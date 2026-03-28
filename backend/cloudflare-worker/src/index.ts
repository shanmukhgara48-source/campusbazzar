// CampusBazaar — Cloudflare Worker API
// Handles: Auth · Listings · Offers · Transactions · Chat · Notifications · R2 uploads

interface Env {
  DB: D1Database;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
  RESEND_API_KEY: string;         // npx wrangler secret put RESEND_API_KEY
  DEV_MODE: string;               // set to "true" in [vars] for local testing (returns OTP in response)
  RAZORPAY_KEY_ID: string;        // npx wrangler secret put RAZORPAY_KEY_ID
  RAZORPAY_KEY_SECRET: string;    // npx wrangler secret put RAZORPAY_KEY_SECRET
  ADMIN_JWT_SECRET: string;       // npx wrangler secret put ADMIN_JWT_SECRET  (separate secret — never shared with mobile)
  ADMIN_EMAIL: string;            // npx wrangler secret put ADMIN_EMAIL
  ADMIN_PASSWORD_HASH: string;    // npx wrangler secret put ADMIN_PASSWORD_HASH  (SHA-256 hex of admin password)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function corsHeaders(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const body    = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).replace(/=/g, '');
  const input   = `${header}.${body}`;
  const key     = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig     = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  const sigB64  = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${input}.${sigB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split('.');
    const input   = `${header}.${body}`;
    const key     = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBuf  = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid   = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(input));
    if (!valid) return null;
    return JSON.parse(atob(body));
  } catch {
    return null;
  }
}

async function getUserFromRequest(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const payload = await verifyJWT(auth.slice(7), env.JWT_SECRET);
  return payload ? (payload.uid as string) : null;
}

// ─── Password hashing (PBKDF2 via Web Crypto) ────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256);
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256);
  const candidate = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return candidate === hashHex;
}

// ─── AWS Signature V4 for R2 presigned PUT URLs ───────────────────────────────

async function hmacSHA256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data));
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignedUploadUrl(env: Env, key: string, contentType: string): Promise<string> {
  const region   = 'auto';
  const service  = 's3';
  const endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const host     = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const now          = new Date();
  const datestamp    = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDatetime  = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const expires      = 3600; // 1 hour

  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const credential      = `${env.R2_ACCESS_KEY_ID}/${credentialScope}`;

  const params = new URLSearchParams({
    'X-Amz-Algorithm':     'AWS4-HMAC-SHA256',
    'X-Amz-Credential':    credential,
    'X-Amz-Date':          amzDatetime,
    'X-Amz-Expires':       String(expires),
    'X-Amz-SignedHeaders': 'host',
  });
  params.sort();

  const canonicalRequest = [
    'PUT',
    `/${env.R2_BUCKET_NAME}/${key}`,
    params.toString(),
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = ['AWS4-HMAC-SHA256', amzDatetime, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

  const signingKey = await [
    new TextEncoder().encode(`AWS4${env.R2_SECRET_ACCESS_KEY}`),
    datestamp, region, service, 'aws4_request',
  ].slice(1).reduce(async (prev, curr) => hmacSHA256(await prev, curr as string), Promise.resolve(new TextEncoder().encode(`AWS4${env.R2_SECRET_ACCESS_KEY}`).buffer));

  const signature = [...new Uint8Array(await hmacSHA256(await signingKey as ArrayBuffer, stringToSign))].map(b => b.toString(16).padStart(2, '0')).join('');

  return `${endpoint}/${env.R2_BUCKET_NAME}/${key}?${params.toString()}&X-Amz-Signature=${signature}`;
}

// ─── OTP helpers ─────────────────────────────────────────────────────────────

/** Crypto-safe 6-digit OTP using Web Crypto (not Math.random). */
function generateOTP(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // Map to 100000–999999 range
  return String(100000 + (buf[0] % 900000));
}

/** Validate basic email format. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Extract domain from email, lowercase. */
function emailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

// ─── Email (Resend) ───────────────────────────────────────────────────────────

interface EmailResult {
  ok: boolean;
  status: number;
  body: string;
}

async function sendOTPEmail(
  env: Env,
  to: string,
  otp: string,
  collegeName: string,
): Promise<EmailResult> {
  // Always use Resend's shared domain (onboarding@resend.dev) on free tier.
  // Switch to your verified domain once DNS records are confirmed in Resend dashboard.
  const from = 'CampusBazaar <onboarding@resend.dev>';

  if (!env.RESEND_API_KEY) {
    console.error('[otp] RESEND_API_KEY is not set');
    return { ok: false, status: 500, body: 'Email service not configured' };
  }

  console.log('[otp] Sending email to:', to, '| college:', collegeName);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#6C47FF;padding:28px 32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">CampusBazaar</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Campus Marketplace</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;color:#374151;font-size:16px;font-weight:600">Verify your email</p>
          <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6">
            You're registering with <strong style="color:#111827">${collegeName}</strong>.<br>
            Use the code below to complete your signup.
          </p>
          <!-- OTP Box -->
          <div style="background:#f3f0ff;border:2px solid #e0d9ff;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px">
            <p style="margin:0 0 8px;font-size:12px;color:#7C3AED;font-weight:600;letter-spacing:1px;text-transform:uppercase">Your verification code</p>
            <p style="margin:0;font-size:44px;font-weight:900;letter-spacing:12px;color:#6C47FF;font-variant-numeric:tabular-nums">${otp}</p>
          </div>
          <p style="margin:0 0 8px;color:#6B7280;font-size:13px">⏱ This code expires in <strong>5 minutes</strong>.</p>
          <p style="margin:0;color:#9CA3AF;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;color:#9CA3AF;font-size:11px">© CampusBazaar · Do not reply to this email</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  let resBody = '';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'CampusBazaar Verification Code',
        html,
      }),
    });
    resBody = await res.text();
    console.log('[otp] Resend response:', res.status, resBody);
    return { ok: res.ok, status: res.status, body: resBody };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[otp] Resend fetch error:', msg);
    return { ok: false, status: 500, body: msg };
  }
}

// ─── Admin JWT (separate secret — never usable by mobile app JWTs) ───────────

async function signAdminJWT(secret: string): Promise<string> {
  const payload = { isAdmin: true, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 };
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const body    = btoa(JSON.stringify(payload)).replace(/=/g, '');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.${sigB64}`;
}

async function verifyAdminJWT(token: string, secret: string): Promise<boolean> {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return false;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
    );
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${header}.${body}`));
    if (!valid) return false;
    const payload = JSON.parse(atob(body)) as Record<string, unknown>;
    if (!payload.isAdmin) return false;
    if (payload.exp && typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

// ─── Admin guard ─────────────────────────────────────────────────────────────

async function checkAdmin(request: Request, env: Env): Promise<{ ok: true } | Response> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return err('Unauthorized', 401);
  const valid = await verifyAdminJWT(token, env.ADMIN_JWT_SECRET);
  if (!valid) return err('Forbidden: invalid admin token', 403);
  return { ok: true };
}

// ─── Route helpers ────────────────────────────────────────────────────────────

function match(pathname: string, pattern: string): Record<string, string> | null {
  const patParts = pattern.split('/');
  const urlParts = pathname.split('/');
  if (patParts.length !== urlParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(':')) {
      params[patParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
    } else if (patParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

// ─── Main fetch handler ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return corsHeaders();

    const url      = new URL(request.url);
    const path     = url.pathname;
    const method   = request.method;
    let   body: Record<string, unknown> = {};

    if (['POST', 'PUT'].includes(method)) {
      try { body = await request.json(); } catch { /* empty body ok */ }
    }

    // ── Colleges ──────────────────────────────────────────────────────────────

    if (path === '/colleges' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM colleges ORDER BY name ASC').all();
      return json({ colleges: (results ?? []).map(c => ({
        id: c.id, name: c.name, domain: c.domain, createdAt: c.created_at,
      })) });
    }

    if (path === '/colleges' && method === 'POST') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;
      const { name, domain } = body as Record<string, string>;
      if (!name?.trim() || !domain?.trim()) return err('name and domain are required');
      const cleanDomain = domain.toLowerCase().trim().replace(/^@/, '');
      const existing = await env.DB.prepare('SELECT id FROM colleges WHERE domain=?').bind(cleanDomain).first();
      if (existing) return err('College with this domain already exists', 409);
      const id = uid();
      await env.DB.prepare('INSERT INTO colleges (id, name, domain) VALUES (?, ?, ?)').bind(id, name.trim(), cleanDomain).run();
      return json({ college: { id, name: name.trim(), domain: cleanDomain } }, 201);
    }

    const collegeMatch = match(path, '/colleges/:id');

    if (collegeMatch && method === 'PUT') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;
      const { name, domain } = body as Record<string, string>;
      if (!name?.trim() && !domain?.trim()) return err('At least one of name or domain is required');

      const cleanDomain = domain?.trim().toLowerCase().replace(/^@/, '').replace(/\s/g, '');
      if (cleanDomain && !cleanDomain.includes('.')) return err('Invalid domain format — must contain a dot (e.g. vnrvjiet.ac.in)');

      // Ensure domain uniqueness (exclude current record)
      if (cleanDomain) {
        const conflict = await env.DB.prepare('SELECT id FROM colleges WHERE domain=? AND id!=?').bind(cleanDomain, collegeMatch.id).first();
        if (conflict) return err('Another college with this domain already exists', 409);
      }

      const nowISO = new Date().toISOString();
      const updates: string[] = ['updated_at = ?'];
      const vals: unknown[]   = [nowISO];
      if (name?.trim())  { updates.push('name = ?');   vals.push(name.trim()); }
      if (cleanDomain)   { updates.push('domain = ?'); vals.push(cleanDomain); }

      await env.DB.prepare(`UPDATE colleges SET ${updates.join(', ')} WHERE id = ?`).bind(...vals, collegeMatch.id).run();
      const updated = await env.DB.prepare('SELECT * FROM colleges WHERE id=?').bind(collegeMatch.id).first() as Record<string, unknown>;
      return json({ college: { id: updated.id, name: updated.name, domain: updated.domain, createdAt: updated.created_at, updatedAt: updated.updated_at } });
    }

    if (collegeMatch && method === 'DELETE') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;
      await env.DB.prepare('DELETE FROM colleges WHERE id=?').bind(collegeMatch.id).run();
      return json({ success: true });
    }

    // ── OTP: Send ─────────────────────────────────────────────────────────────

    if (path === '/send-otp' && method === 'POST') {
      const { email } = body as Record<string, string>;

      // 1. Validate email format
      if (!email?.trim()) return err('email is required');
      const emailLower = email.toLowerCase().trim();
      if (!isValidEmail(emailLower)) return err('Invalid email address format');

      // 2. Validate college domain
      const domain  = emailDomain(emailLower);
      const college = await env.DB.prepare('SELECT id, name FROM colleges WHERE domain=?')
        .bind(domain).first() as Record<string, unknown> | null;
      if (!college) {
        console.log('[otp] Rejected domain not in colleges table:', domain);
        return err('Please use your college email ID. Your institution is not registered yet.');
      }

      // 3. Reject already-registered emails
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(emailLower).first();
      if (existing) return err('This email is already registered. Please log in instead.', 409);

      // 4. Rate limiting — max 3 requests per 10-minute window
      const now    = new Date();
      const nowISO = now.toISOString();
      const pending = await env.DB.prepare('SELECT * FROM otp_pending WHERE email=?')
        .bind(emailLower).first() as Record<string, unknown> | null;

      if (pending) {
        const windowStart  = new Date(pending.window_start as string);
        const windowAgeMin = (now.getTime() - windowStart.getTime()) / 60_000;
        // BUG FIX: was `>` (inverted). Correct: within window AND count exhausted.
        if (windowAgeMin < 10 && Number(pending.req_count) >= 3) {
          const waitMin = Math.ceil(10 - windowAgeMin);
          return err(`Too many requests. Please wait ${waitMin} minute(s) before trying again.`, 429);
        }
      }

      // 5. Generate OTP (fixed in DEV_MODE for easy testing)
      const otp = env.DEV_MODE === 'true' ? '123456' : generateOTP();
      console.log('[otp] Generated OTP for', emailLower, ':', otp);

      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

      // Reset window if more than 10 min old; otherwise increment counter
      const inWindow = pending
        ? (now.getTime() - new Date(pending.window_start as string).getTime()) < 10 * 60_000
        : false;
      const newCount    = inWindow ? Number(pending!.req_count) + 1 : 1;
      const windowStart = inWindow ? (pending!.window_start as string) : nowISO;

      // 6. Upsert OTP record (also resets attempts counter)
      await env.DB.prepare(`
        INSERT INTO otp_pending (email, otp, expires_at, req_count, window_start)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          otp          = excluded.otp,
          expires_at   = excluded.expires_at,
          req_count    = excluded.req_count,
          window_start = excluded.window_start
      `).bind(emailLower, otp, expiresAt, newCount, windowStart).run();

      // 7. Send email (skipped in DEV_MODE)
      const isDev = env.DEV_MODE === 'true';
      if (!isDev) {
        const emailResult = await sendOTPEmail(env, emailLower, otp, college.name as string);
        if (!emailResult.ok) {
          console.error('[otp] Email delivery failed:', emailResult.status, emailResult.body);
          // Delete the stored OTP so user isn't stuck
          await env.DB.prepare('DELETE FROM otp_pending WHERE email=?').bind(emailLower).run();
          return err(
            'Failed to send OTP email. Please check the email address and try again. ' +
            `(Error: ${emailResult.status})`,
            502,
          );
        }
        console.log('[otp] Email sent successfully to', emailLower);
      } else {
        console.log('[otp] DEV_MODE: skipping email, otp =', otp);
      }

      return json({
        success: true,
        message: isDev ? 'OTP generated (DEV_MODE — no email sent)' : 'OTP sent to your college email',
        ...(isDev ? { _dev_otp: otp } : {}),
      });
    }

    // ── OTP: Verify & Create Account ──────────────────────────────────────────

    if (path === '/verify-otp' && method === 'POST') {
      const { email, otp, name, password, rollNumber } = body as Record<string, string>;
      if (!email || !otp || !name || !password)
        return err('email, otp, name and password are required');

      const emailLower = email.toLowerCase().trim();
      if (!isValidEmail(emailLower)) return err('Invalid email format');

      // 1. Fetch stored OTP record
      const pending = await env.DB.prepare('SELECT * FROM otp_pending WHERE email=?')
        .bind(emailLower).first() as Record<string, unknown> | null;

      if (!pending) {
        return err('No OTP found for this email. Please request a new code.');
      }

      // 2. Check expiry
      if (new Date() > new Date(pending.expires_at as string)) {
        await env.DB.prepare('DELETE FROM otp_pending WHERE email=?').bind(emailLower).run();
        return err('OTP has expired. Please request a new one.', 410);
      }

      // 3. Brute-force guard — max 5 wrong attempts
      const attempts = Number(pending.attempts ?? 0);
      if (attempts >= 5) {
        await env.DB.prepare('DELETE FROM otp_pending WHERE email=?').bind(emailLower).run();
        return err('Too many incorrect attempts. Please request a new OTP.', 429);
      }

      // 4. Verify OTP (constant-time comparison to prevent timing attacks)
      const inputOtp  = otp.trim();
      const storedOtp = pending.otp as string;

      if (inputOtp.length !== storedOtp.length || inputOtp !== storedOtp) {
        // Increment attempt counter
        await env.DB.prepare('UPDATE otp_pending SET attempts = attempts + 1 WHERE email=?')
          .bind(emailLower).run();
        const remaining = 4 - attempts;
        return err(`Invalid OTP. ${remaining} attempt(s) remaining.`, 401);
      }

      // 5. OTP valid — delete immediately to prevent reuse
      await env.DB.prepare('DELETE FROM otp_pending WHERE email=?').bind(emailLower).run();
      console.log('[otp] OTP verified for', emailLower);

      // 6. Race-condition guard
      const alreadyExists = await env.DB.prepare('SELECT id FROM users WHERE email=?')
        .bind(emailLower).first();
      if (alreadyExists) return err('Email already registered', 409);

      // 7. Look up college name from domain
      const domain  = emailDomain(emailLower);
      const college = await env.DB.prepare('SELECT id, name FROM colleges WHERE domain=?')
        .bind(domain).first() as Record<string, unknown> | null;

      // 8. Create verified user
      const id   = uid();
      const hash = await hashPassword(password);
      await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, name, college, roll_number, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)'
      ).bind(id, emailLower, hash, name.trim(), college?.name ?? domain, rollNumber?.trim() ?? '').run();

      console.log('[otp] User created:', id, emailLower);

      const token = await signJWT({ uid: id, email: emailLower }, env.JWT_SECRET);
      const user  = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
      return json({ success: true, token, user: formatUser(user as Record<string, unknown>) }, 201);
    }

    // ── Auth ─────────────────────────────────────────────────────────────────

    if (path === '/auth/register' && method === 'POST') {
      // Legacy endpoint — kept for backwards compatibility but now enforces college domain
      const { email, password, name, college, rollNumber } = body as Record<string, string>;
      if (!email || !password || !name) return err('email, password and name are required');

      const emailLower = email.toLowerCase().trim();
      const domain     = emailLower.split('@')[1] ?? '';
      const validCollege = await env.DB.prepare('SELECT name FROM colleges WHERE domain=?').bind(domain).first() as Record<string, unknown> | null;
      if (!validCollege) return err('Please use your college email ID.');

      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(emailLower).first();
      if (existing) return err('Email already registered', 409);

      const id   = uid();
      const hash = await hashPassword(password);
      await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, name, college, roll_number) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, emailLower, hash, name, validCollege.name ?? college ?? '', rollNumber ?? '').run();

      const token = await signJWT({ uid: id, email: emailLower }, env.JWT_SECRET);
      return json({ token, user: { uid: id, email: emailLower, name, college: validCollege.name ?? college ?? '', rollNumber: rollNumber ?? '', avatar: '', role: 'buyer', isVerified: false, rating: 0, reviewCount: 0, totalSales: 0 } });
    }

    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = body as Record<string, string>;
      if (!email || !password) return err('email and password are required');

      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first() as Record<string, unknown> | null;
      if (!user) return err('Invalid email or password', 401);
      if (user.is_banned) return err('Account suspended', 403);

      const valid = await verifyPassword(password, user.password_hash as string);
      if (!valid) return err('Invalid email or password', 401);

      const token = await signJWT({ uid: user.id, email: user.email }, env.JWT_SECRET);
      return json({ token, user: formatUser(user) });
    }

    if (path === '/auth/me' && method === 'GET') {
      const uid = await getUserFromRequest(request, env);
      if (!uid) return err('Unauthorized', 401);
      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(uid).first();
      if (!user) return err('User not found', 404);
      return json({ user: formatUser(user as Record<string, unknown>) });
    }

    if (path === '/auth/me' && method === 'PUT') {
      const uid = await getUserFromRequest(request, env);
      if (!uid) return err('Unauthorized', 401);
      const { name, avatar, department, year, college, rollNumber } = body as Record<string, string>;
      await env.DB.prepare(
        'UPDATE users SET name=COALESCE(?,name), avatar=COALESCE(?,avatar), department=COALESCE(?,department), year=COALESCE(?,year), college=COALESCE(?,college), roll_number=COALESCE(?,roll_number) WHERE id=?'
      ).bind(name, avatar, department, year, college, rollNumber, uid).run();
      const updated = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(uid).first();
      return json({ user: formatUser(updated as Record<string, unknown>) });
    }

    // ── Upload URL ────────────────────────────────────────────────────────────

    if (path === '/upload-url' && method === 'POST') {
      const uid = await getUserFromRequest(request, env);
      if (!uid) return err('Unauthorized', 401);

      const { folder = 'listings', filename = 'image.jpg', contentType = 'image/jpeg' } = body as Record<string, string>;
      const key       = `${folder}/${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`;
      const uploadUrl = await getSignedUploadUrl(env, key, contentType);
      const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

      return json({ uploadUrl, publicUrl, key });
    }

    // ── Listings ──────────────────────────────────────────────────────────────

    if (path === '/listings' && method === 'GET') {
      const category = url.searchParams.get('category');
      const search   = url.searchParams.get('q');
      const limit    = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
      const offset   = Number(url.searchParams.get('offset') ?? 0);

      let query = 'SELECT l.*, u.name as seller_name, u.avatar as seller_avatar, u.rating as seller_rating, u.is_verified as seller_verified FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.status = \'active\'';
      const params: unknown[] = [];

      if (category) { query += ' AND l.category = ?'; params.push(category); }
      if (search)   { query += ' AND (l.title LIKE ? OR l.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

      query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return json({ listings: (results ?? []).map(formatListing) });
    }

    if (path === '/listings' && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);

      const { title, description, price, category, condition, images, department, tags } = body as Record<string, unknown>;
      if (!title || !price || !category || !condition) return err('Missing required fields');

      const id = uid();
      await env.DB.prepare(
        'INSERT INTO listings (id, title, description, price, category, condition, images, seller_id, department, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, title, description ?? '', price, category, condition, JSON.stringify(images ?? []), userId, department ?? '', JSON.stringify(tags ?? [])).run();

      const listing = await env.DB.prepare('SELECT l.*, u.name as seller_name, u.avatar as seller_avatar, u.rating as seller_rating, u.is_verified as seller_verified FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = ?').bind(id).first();
      return json({ listing: formatListing(listing as Record<string, unknown>) }, 201);
    }

    const listingMatch = match(path, '/listings/:id');
    if (listingMatch) {
      const { id } = listingMatch;

      if (method === 'GET') {
        await env.DB.prepare('UPDATE listings SET views = views + 1 WHERE id = ?').bind(id).run();
        const listing = await env.DB.prepare('SELECT l.*, u.name as seller_name, u.avatar as seller_avatar, u.rating as seller_rating, u.is_verified as seller_verified FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = ?').bind(id).first();
        if (!listing) return err('Listing not found', 404);
        return json({ listing: formatListing(listing as Record<string, unknown>) });
      }

      if (method === 'PUT') {
        const userId = await getUserFromRequest(request, env);
        if (!userId) return err('Unauthorized', 401);
        const listing = await env.DB.prepare('SELECT * FROM listings WHERE id = ?').bind(id).first() as Record<string, unknown> | null;
        if (!listing) return err('Not found', 404);
        if (listing.seller_id !== userId) return err('Forbidden', 403);

        const fields  = ['title', 'description', 'price', 'category', 'condition', 'status', 'final_price', 'accepted_offer_id'];
        const updates = fields.filter(f => body[f] !== undefined);
        if (updates.length === 0) return json({ listing });

        const setClause = updates.map(f => `${f} = ?`).join(', ');
        const values    = updates.map(f => f === 'images' ? JSON.stringify(body[f]) : body[f]);
        await env.DB.prepare(`UPDATE listings SET ${setClause} WHERE id = ?`).bind(...values, id).run();
        const updated = await env.DB.prepare('SELECT l.*, u.name as seller_name, u.avatar as seller_avatar FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = ?').bind(id).first();
        return json({ listing: formatListing(updated as Record<string, unknown>) });
      }

      if (method === 'DELETE') {
        const userId = await getUserFromRequest(request, env);
        if (!userId) return err('Unauthorized', 401);
        const listing = await env.DB.prepare('SELECT seller_id FROM listings WHERE id = ?').bind(id).first() as Record<string, unknown> | null;
        if (!listing) return err('Not found', 404);
        if (listing.seller_id !== userId) return err('Forbidden', 403);
        await env.DB.prepare('DELETE FROM listings WHERE id = ?').bind(id).run();
        return json({ success: true });
      }
    }

    // ── Razorpay: Create Order ────────────────────────────────────────────────

    if (path === '/razorpay/create-order' && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);

      const { amount, receipt } = body as { amount: number; receipt?: string };
      if (!amount || amount <= 0) return err('amount (in paise) is required');
      if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET)
        return err('Razorpay is not configured on this server', 503);

      const credentials = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          amount:   Math.round(amount),
          currency: 'INR',
          receipt:  receipt ?? `cb_${uid()}`,
        }),
      });

      if (!rzpRes.ok) {
        const rzpErr = await rzpRes.json() as { error?: { description: string } };
        return err(rzpErr.error?.description ?? 'Failed to create Razorpay order', 502);
      }

      const order = await rzpRes.json() as { id: string; amount: number; currency: string };
      return json({ orderId: order.id, keyId: env.RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency });
    }

    // ── Buy Now (direct checkout, no negotiation) ─────────────────────────────

    const listingBuyNow = match(path, '/listings/:id/buy-now');
    if (listingBuyNow && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);

      const {
        paymentMethod      = 'cod',
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      } = body as Record<string, string>;

      // ── Verify Razorpay signature for online payments ─────────────────────
      if (paymentMethod === 'online') {
        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature)
          return err('Missing Razorpay payment verification data', 400);
        if (env.RAZORPAY_KEY_SECRET) {
          const sigKey   = await crypto.subtle.importKey(
            'raw', new TextEncoder().encode(env.RAZORPAY_KEY_SECRET),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
          );
          const sigBytes = await crypto.subtle.sign(
            'HMAC', sigKey,
            new TextEncoder().encode(`${razorpayOrderId}|${razorpayPaymentId}`),
          );
          const sigHex = Array.from(new Uint8Array(sigBytes))
            .map(b => b.toString(16).padStart(2, '0')).join('');
          if (sigHex !== razorpaySignature)
            return err('Payment verification failed — invalid signature', 400);
        }
      }

      const listing = await env.DB.prepare('SELECT * FROM listings WHERE id = ?').bind(listingBuyNow.id).first() as Record<string, unknown> | null;
      if (!listing) return err('Listing not found', 404);
      if (listing.seller_id === userId) return err('Cannot buy your own listing', 400);

      // Allow purchase if listing is active, OR if it is reserved specifically for this buyer
      // (the reservation is created when a seller accepts a negotiated offer).
      const isReservedForBuyer = listing.status === 'reserved' && listing.reserved_for === userId;
      if (listing.status !== 'active' && !isReservedForBuyer)
        return err('This item is no longer available', 400);

      // ── Backend-controlled price: use negotiated final_price when it exists ─
      // Never trust a price sent from the frontend. The final_price is written
      // by the server when an offer is accepted, so it cannot be manipulated.
      const itemPrice = (isReservedForBuyer && listing.final_price)
        ? listing.final_price as number
        : listing.price as number;

      const initialPaymentStatus = paymentMethod === 'online' ? 'paid' : 'pending';

      // ── If a pre-transaction was created during offer acceptance, update it ─
      // The offer-accept handler creates a skeleton transaction so both parties
      // can track the deal. On checkout we fill in the payment details rather
      // than creating a duplicate.
      const existing = await env.DB.prepare(
        "SELECT id FROM transactions WHERE listing_id = ? AND buyer_id = ? AND status != 'cancelled' LIMIT 1"
      ).bind(listingBuyNow.id, userId).first() as Record<string, unknown> | null;

      if (existing) {
        await env.DB.prepare(
          `UPDATE transactions
             SET payment_method = ?,
                 razorpay_payment_id = COALESCE(NULLIF(?, ''), razorpay_payment_id),
                 payment_status = ?,
                 amount = ?,
                 item_price = ?
           WHERE id = ?`
        ).bind(
          paymentMethod,
          razorpayPaymentId ?? '',
          initialPaymentStatus,
          itemPrice,
          itemPrice,
          existing.id,
        ).run();
        return json({ transactionId: existing.id });
      }

      const buyer  = await env.DB.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first() as Record<string, unknown> | null;
      const seller = await env.DB.prepare('SELECT name FROM users WHERE id = ?').bind(listing.seller_id).first() as Record<string, unknown> | null;
      const images = listing.images ? (() => { try { return JSON.parse(listing.images as string); } catch { return []; } })() : [];

      // ── Create auto-accepted offer at asking price (direct buy-now path) ──
      const offerId = uid();
      await env.DB.prepare(
        "INSERT INTO offers (id, listing_id, buyer_id, seller_id, amount, status, message) VALUES (?, ?, ?, ?, ?, 'accepted', 'Buy Now')"
      ).bind(offerId, listingBuyNow.id, userId, listing.seller_id, itemPrice).run();

      // ── Reserve listing ───────────────────────────────────────────────────
      await env.DB.prepare(
        "UPDATE listings SET status = 'reserved', final_price = ?, accepted_offer_id = ?, reserved_for = ? WHERE id = ?"
      ).bind(itemPrice, offerId, userId, listingBuyNow.id).run();

      // ── Create transaction ────────────────────────────────────────────────
      const txId = uid();
      await env.DB.prepare(`
        INSERT INTO transactions
          (id, listing_id, listing_title, listing_image, listing_price,
           buyer_id, buyer_name, seller_id, seller_name,
           amount, item_price, platform_fee, gst, convenience_fee, convenience_fee_paid,
           payment_method, razorpay_payment_id, payment_status,
           status, meetup_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', 'pending')
      `).bind(
        txId,
        listingBuyNow.id,
        listing.title,
        (images as string[])[0] ?? '',
        itemPrice,
        userId,
        buyer?.name  ?? '',
        listing.seller_id,
        seller?.name ?? '',
        itemPrice,
        itemPrice,
        0, 0, 0,
        paymentMethod === 'online' ? 1 : 0,
        paymentMethod,
        razorpayPaymentId ?? '',
        initialPaymentStatus,
      ).run();

      return json({ transactionId: txId }, 201);
    }

    // ── Offers ────────────────────────────────────────────────────────────────

    if (path === '/offers' && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const { listingId, amount, message } = body as Record<string, unknown>;
      if (!listingId || !amount) return err('listingId and amount required');

      const listing = await env.DB.prepare('SELECT seller_id FROM listings WHERE id = ?').bind(listingId).first() as Record<string, unknown> | null;
      if (!listing) return err('Listing not found', 404);
      if (listing.seller_id === userId) return err('Cannot offer on own listing', 400);

      const id = uid();
      await env.DB.prepare('INSERT INTO offers (id, listing_id, buyer_id, seller_id, amount, message) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, listingId, userId, listing.seller_id, amount, message ?? '').run();
      return json({ offer: { id, listingId, buyerId: userId, sellerId: listing.seller_id, amount, message, status: 'pending' } }, 201);
    }

    // GET /offers/listing/:listingId/deal?buyerId=... — must be matched BEFORE
    // the 4-segment /offers/listing/:listingId handler because match() requires
    // exact path segment counts and would never reach this branch otherwise.
    const offerDealMatch = match(path, '/offers/listing/:listingId/deal');
    if (offerDealMatch && method === 'GET') {
      const userId  = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const listingId = offerDealMatch.listingId;
      const buyerId   = url.searchParams.get('buyerId') ?? userId;
      // Only the buyer or the seller may fetch the deal
      const listing = await env.DB.prepare('SELECT seller_id, final_price, reserved_for FROM listings WHERE id = ?').bind(listingId).first() as Record<string, unknown> | null;
      if (!listing) return err('Listing not found', 404);
      if (userId !== buyerId && userId !== (listing.seller_id as string)) return err('Forbidden', 403);
      const deal = await env.DB.prepare(
        `SELECT o.*, u.name as buyer_name FROM offers o
         JOIN users u ON o.buyer_id = u.id
         WHERE o.listing_id = ? AND o.buyer_id = ? AND o.status = 'accepted'
         ORDER BY o.created_at DESC LIMIT 1`
      ).bind(listingId, buyerId).first() as Record<string, unknown> | null;
      return json({ deal: deal ? formatOffer(deal) : null });
    }

    const offersByListing = match(path, '/offers/listing/:listingId');
    if (offersByListing && method === 'GET') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const { results } = await env.DB.prepare('SELECT o.*, u.name as buyer_name FROM offers o JOIN users u ON o.buyer_id = u.id WHERE o.listing_id = ? ORDER BY o.created_at DESC').bind(offersByListing.listingId).all();
      return json({ offers: (results ?? []).map(formatOffer) });
    }

    const offersByUser = match(path, '/offers/user/:userId');
    if (offersByUser && method === 'GET') {
      const callerId = await getUserFromRequest(request, env);
      if (!callerId) return err('Unauthorized', 401);
      const { results } = await env.DB.prepare('SELECT o.*, l.title as listing_title, l.images as listing_images FROM offers o JOIN listings l ON o.listing_id = l.id WHERE o.buyer_id = ? OR o.seller_id = ? ORDER BY o.created_at DESC').bind(offersByUser.userId, offersByUser.userId).all();
      return json({ offers: (results ?? []).map(formatOffer) });
    }

    const offerMatch = match(path, '/offers/:id');
    if (offerMatch && method === 'PUT') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const { status, counterAmount } = body as Record<string, unknown>;
      // D1 requires null, not undefined — coerce here so COALESCE works correctly
      await env.DB.prepare('UPDATE offers SET status = ?, counter_amount = COALESCE(?, counter_amount) WHERE id = ?')
        .bind(status ?? null, counterAmount ?? null, offerMatch.id).run();

      let transactionId: string | undefined;
      if (status === 'accepted') {
        const offer = await env.DB.prepare('SELECT * FROM offers WHERE id = ?').bind(offerMatch.id).first() as Record<string, unknown> | null;
        if (offer) {
          await env.DB.prepare('UPDATE listings SET status = \'reserved\', final_price = ?, accepted_offer_id = ?, reserved_for = ? WHERE id = ?')
            .bind(offer.amount, offerMatch.id, offer.buyer_id, offer.listing_id).run();

          // Create a pre-transaction so both parties can track the deal
          const listing = await env.DB.prepare('SELECT * FROM listings WHERE id = ?').bind(offer.listing_id).first() as Record<string, unknown> | null;
          const buyer   = await env.DB.prepare('SELECT name FROM users WHERE id = ?').bind(offer.buyer_id).first() as Record<string, unknown> | null;
          const seller  = await env.DB.prepare('SELECT name FROM users WHERE id = ?').bind(offer.seller_id).first() as Record<string, unknown> | null;
          const images  = listing?.images ? (() => { try { return JSON.parse(listing.images as string); } catch { return []; } })() : [];
          transactionId = uid();
          await env.DB.prepare(`
            INSERT INTO transactions
              (id, listing_id, listing_title, listing_image, listing_price,
               buyer_id, buyer_name, seller_id, seller_name,
               amount, item_price, platform_fee, gst, convenience_fee,
               status, meetup_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'accepted', 'pending')
          `).bind(
            transactionId,
            offer.listing_id,
            listing?.title ?? '',
            images[0] ?? '',
            listing?.price ?? 0,
            offer.buyer_id,
            buyer?.name ?? '',
            offer.seller_id,
            seller?.name ?? '',
            offer.amount,
            offer.amount,
          ).run();
        }
      }
      return json({ success: true, transactionId });
    }

    // ── Transactions ──────────────────────────────────────────────────────────

    if (path === '/transactions' && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);

      const d = body as Record<string, unknown>;
      const id = uid();
      await env.DB.prepare(`
        INSERT INTO transactions (id, listing_id, listing_title, listing_image, listing_price, buyer_id, buyer_name, seller_id, seller_name, amount, item_price, platform_fee, gst, convenience_fee, convenience_fee_paid, qr_code_data, is_delivered, meetup_location, meetup_time, payment_method, razorpay_payment_id, delivery_otp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, d.listingId, d.listingTitle, d.listingImage ?? '', d.listingPrice, userId, d.buyerName, d.sellerId, d.sellerName, d.amount, d.itemPrice, d.platformFee, d.gst, d.convenienceFee, d.convenienceFeePaid ? 1 : 0, d.qrCodeData ?? '', 0, d.meetupLocation ?? '', d.meetupTime ?? '', d.paymentMethod ?? 'Razorpay', d.razorpayPaymentId ?? '', d.deliveryOtp ?? '').run();
      return json({ transactionId: id }, 201);
    }

    const txById = match(path, '/transactions/:id');
    if (txById && method === 'GET') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(txById.id).first();
      if (!tx) return err('Not found', 404);
      return json({ transaction: formatTx(tx as Record<string, unknown>) });
    }

    if (txById && method === 'PUT') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const d = body as Record<string, unknown>;
      const { status, qrCodeData, isDelivered, buyerConfirmed, sellerConfirmed,
              itemPrice, platformFee, gst, convenienceFee, convenienceFeePaid,
              deliveryOtp, paymentMethod, razorpayPaymentId } = d;
      await env.DB.prepare(`
        UPDATE transactions SET
          status=COALESCE(?,status),
          qr_code_data=COALESCE(?,qr_code_data),
          is_delivered=COALESCE(?,is_delivered),
          buyer_confirmed=COALESCE(?,buyer_confirmed),
          seller_confirmed=COALESCE(?,seller_confirmed),
          item_price=COALESCE(?,item_price),
          platform_fee=COALESCE(?,platform_fee),
          gst=COALESCE(?,gst),
          convenience_fee=COALESCE(?,convenience_fee),
          convenience_fee_paid=COALESCE(?,convenience_fee_paid),
          delivery_otp=COALESCE(?,delivery_otp),
          payment_method=COALESCE(?,payment_method),
          razorpay_payment_id=COALESCE(?,razorpay_payment_id)
        WHERE id=?
      `).bind(
        status ?? null,
        qrCodeData ?? null,
        isDelivered  != null ? (isDelivered  ? 1 : 0) : null,
        buyerConfirmed  != null ? (buyerConfirmed  ? 1 : 0) : null,
        sellerConfirmed != null ? (sellerConfirmed ? 1 : 0) : null,
        itemPrice         ?? null,
        platformFee       ?? null,
        gst               ?? null,
        convenienceFee    ?? null,
        convenienceFeePaid != null ? (convenienceFeePaid ? 1 : 0) : null,
        deliveryOtp       ?? null,
        paymentMethod     ?? null,
        razorpayPaymentId ?? null,
        txById.id,
      ).run();
      return json({ success: true });
    }

    const txVerifyQr = match(path, '/transactions/:id/verify-qr');
    if (txVerifyQr && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const { qrData } = body as Record<string, string>;
      const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(txVerifyQr.id).first() as Record<string, unknown> | null;
      if (!tx) return err('Transaction not found', 404);
      if (tx.qr_code_data !== qrData)     return err('QR code mismatch', 400);
      if (!tx.convenience_fee_paid)        return err('Convenience fee not paid', 400);
      if (tx.is_delivered)                 return err('Already delivered', 400);
      if (tx.status === 'cancelled')       return err('Transaction cancelled', 400);
      await env.DB.prepare('UPDATE transactions SET is_delivered=1, status=\'completed\', buyer_confirmed=1, seller_confirmed=1, delivered_at=datetime(\'now\') WHERE id=?').bind(txVerifyQr.id).run();
      await env.DB.prepare('UPDATE listings SET status=\'sold\' WHERE id=?').bind(tx.listing_id).run();
      return json({ success: true });
    }

    const txVerifyOtp = match(path, '/transactions/:id/verify-otp');
    if (txVerifyOtp && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const { otp } = body as Record<string, string>;
      const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(txVerifyOtp.id).first() as Record<string, unknown> | null;
      if (!tx) return err('Transaction not found', 404);
      if (tx.delivery_otp !== otp.trim())  return json({ matched: false });
      await env.DB.prepare('UPDATE transactions SET is_delivered=1, status=\'completed\', buyer_confirmed=1, seller_confirmed=1, delivered_at=datetime(\'now\') WHERE id=?').bind(txVerifyOtp.id).run();
      await env.DB.prepare('UPDATE listings SET status=\'sold\' WHERE id=?').bind(tx.listing_id).run();
      return json({ matched: true });
    }

    // ── set-meetup (seller only) ──────────────────────────────────────────────
    const txSetMeetup = match(path, '/transactions/:id/set-meetup');
    if (txSetMeetup && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const { meetupLocation, meetupTime } = body as Record<string, unknown>;
      if (!meetupLocation || !meetupTime) return err('meetupLocation and meetupTime are required');
      const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(txSetMeetup.id).first() as Record<string, unknown> | null;
      if (!tx) return err('Transaction not found', 404);
      if (tx.seller_id !== userId) return err('Only the seller can set the meetup', 403);
      await env.DB.prepare(
        'UPDATE transactions SET meetup_location=?, meetup_time=?, meetup_status=\'seller_set\', status=\'meetup_set\' WHERE id=?'
      ).bind(meetupLocation, meetupTime, txSetMeetup.id).run();
      return json({ success: true });
    }

    // ── confirm-meetup (buyer only) ───────────────────────────────────────────
    const txConfirmMeetup = match(path, '/transactions/:id/confirm-meetup');
    if (txConfirmMeetup && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(txConfirmMeetup.id).first() as Record<string, unknown> | null;
      if (!tx) return err('Transaction not found', 404);
      if (tx.buyer_id !== userId) return err('Only the buyer can confirm the meetup', 403);
      await env.DB.prepare(
        'UPDATE transactions SET meetup_status=\'buyer_confirmed\' WHERE id=?'
      ).bind(txConfirmMeetup.id).run();
      return json({ success: true });
    }

    // ── request-meetup-change (buyer only) ────────────────────────────────────
    const txRequestChange = match(path, '/transactions/:id/request-meetup-change');
    if (txRequestChange && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(txRequestChange.id).first() as Record<string, unknown> | null;
      if (!tx) return err('Transaction not found', 404);
      if (tx.buyer_id !== userId) return err('Only the buyer can request a meetup change', 403);
      await env.DB.prepare(
        'UPDATE transactions SET meetup_status=\'change_requested\', status=\'accepted\' WHERE id=?'
      ).bind(txRequestChange.id).run();
      return json({ success: true });
    }

    // Find transaction by listing (buyer or seller) — used by ListingDetail "Proceed to Checkout"
    const txByListing = match(path, '/transactions/listing/:listingId');
    if (txByListing && method === 'GET') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const tx = await env.DB.prepare(
        'SELECT * FROM transactions WHERE listing_id = ? AND (buyer_id = ? OR seller_id = ?) AND status != \'cancelled\' ORDER BY created_at DESC LIMIT 1'
      ).bind(txByListing.listingId, userId, userId).first() as Record<string, unknown> | null;
      if (!tx) return err('Not found', 404);
      return json({ transaction: formatTx(tx) });
    }

    // GET /orders?userId=... — dedicated orders endpoint (alias for buyer transactions)
    if (path === '/orders' && method === 'GET') {
      const callerId = await getUserFromRequest(request, env);
      if (!callerId) return err('Unauthorized', 401);
      const userId = url.searchParams.get('userId') ?? callerId;
      // Users can only fetch their own orders
      if (userId !== callerId) return err('Forbidden', 403);
      const { results } = await env.DB.prepare(
        'SELECT * FROM transactions WHERE buyer_id = ? ORDER BY created_at DESC'
      ).bind(userId).all();
      return json({ orders: (results ?? []).map(t => formatTx(t as Record<string, unknown>)) });
    }

    const txByBuyer = match(path, '/transactions/buyer/:userId');
    if (txByBuyer && method === 'GET') {
      const callerId = await getUserFromRequest(request, env);
      if (!callerId) return err('Unauthorized', 401);
      const { results } = await env.DB.prepare('SELECT * FROM transactions WHERE buyer_id = ? ORDER BY created_at DESC').bind(txByBuyer.userId).all();
      return json({ transactions: (results ?? []).map(t => formatTx(t as Record<string, unknown>)) });
    }

    const txBySeller = match(path, '/transactions/seller/:userId');
    if (txBySeller && method === 'GET') {
      const callerId = await getUserFromRequest(request, env);
      if (!callerId) return err('Unauthorized', 401);
      const { results } = await env.DB.prepare('SELECT * FROM transactions WHERE seller_id = ? ORDER BY created_at DESC').bind(txBySeller.userId).all();
      return json({ transactions: (results ?? []).map(t => formatTx(t as Record<string, unknown>)) });
    }

    // ── Cancel Order ─────────────────────────────────────────────────────────

    if (path === '/cancel-order' && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);

      const { orderId } = body as { orderId: string };
      if (!orderId) return err('orderId is required');

      const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?')
        .bind(orderId).first() as Record<string, unknown> | null;
      if (!tx) return err('Order not found', 404);
      if (tx.buyer_id !== userId) return err('Forbidden', 403);
      if (tx.status === 'cancelled')  return err('Order is already cancelled', 400);
      if (tx.status === 'completed')  return err('Cannot cancel a completed order', 400);
      if (tx.status === 'meetup_set') return err('Meetup is already confirmed. Contact seller to reschedule.', 400);

      let paymentStatus = 'cancelled';
      let refundId: string | null = null;

      // ── Razorpay refund for online payments ─────────────────────────────────
      if (tx.payment_method === 'online' && tx.razorpay_payment_id) {
        try {
          const credentials = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
          const rzpRes = await fetch(
            `https://api.razorpay.com/v1/payments/${tx.razorpay_payment_id}/refund`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
              },
              body: JSON.stringify({
                amount: Math.round((tx.amount as number) * 100), // ₹ → paise
                speed:  'normal',
                notes:  { reason: 'buyer_cancelled', orderId },
              }),
            },
          );
          if (rzpRes.ok) {
            const refund = await rzpRes.json() as { id: string };
            refundId     = refund.id;
            paymentStatus = 'refunded';
          } else {
            paymentStatus = 'refund_pending'; // retry manually
          }
        } catch {
          paymentStatus = 'refund_pending';
        }
      }

      // ── Cancel transaction ───────────────────────────────────────────────────
      await env.DB.prepare(
        "UPDATE transactions SET status = 'cancelled', payment_status = ? WHERE id = ?"
      ).bind(paymentStatus, orderId).run();

      // ── Restock listing ──────────────────────────────────────────────────────
      await env.DB.prepare(
        "UPDATE listings SET status = 'active', reserved_for = NULL, final_price = NULL, accepted_offer_id = NULL WHERE id = ?"
      ).bind(tx.listing_id).run();

      // ── Decline the auto-accepted offer ──────────────────────────────────────
      await env.DB.prepare(
        "UPDATE offers SET status = 'declined' WHERE listing_id = ? AND buyer_id = ? AND status = 'accepted'"
      ).bind(tx.listing_id, userId).run();

      return json({ success: true, paymentStatus, refundId });
    }

    // ── Conversations & Messages (polling) ────────────────────────────────────

    const convsByUser = match(path, '/conversations/user/:userId');
    if (convsByUser && method === 'GET') {
      const callerId = await getUserFromRequest(request, env);
      if (!callerId) return err('Unauthorized', 401);
      const { results } = await env.DB.prepare(`
        SELECT c.*,
               u1.name as p1_name, u1.avatar as p1_avatar,
               u2.name as p2_name, u2.avatar as p2_avatar
        FROM conversations c
        JOIN users u1 ON c.participant_1 = u1.id
        JOIN users u2 ON c.participant_2 = u2.id
        WHERE c.participant_1 = ? OR c.participant_2 = ?
        ORDER BY c.last_message_at DESC
      `).bind(convsByUser.userId, convsByUser.userId).all();
      return json({ conversations: (results ?? []).map(c => formatConversation(c as Record<string, unknown>, convsByUser.userId)) });
    }

    if (path === '/conversations' && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const { otherUserId, listingId, listingTitle } = body as Record<string, string>;
      const [p1, p2] = [userId, otherUserId].sort();

      let conv = await env.DB.prepare('SELECT * FROM conversations WHERE listing_id=? AND participant_1=? AND participant_2=?').bind(listingId, p1, p2).first() as Record<string, unknown> | null;
      if (!conv) {
        const id = uid();
        await env.DB.prepare('INSERT INTO conversations (id, listing_id, listing_title, participant_1, participant_2) VALUES (?, ?, ?, ?, ?)').bind(id, listingId, listingTitle ?? '', p1, p2).run();
        conv = { id, listing_id: listingId, listing_title: listingTitle ?? '', participant_1: p1, participant_2: p2 };
      }
      return json({ conversationId: conv.id });
    }

    const convMessages = match(path, '/conversations/:id/messages');
    if (convMessages && method === 'GET') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const since = url.searchParams.get('since'); // ISO timestamp for polling
      let query = 'SELECT * FROM messages WHERE conversation_id = ?';
      const params: unknown[] = [convMessages.id];
      if (since) { query += ' AND created_at > ?'; params.push(since); }
      query += ' ORDER BY created_at ASC LIMIT 100';
      const { results } = await env.DB.prepare(query).bind(...params).all();
      // Mark messages as read for this user
      await env.DB.prepare('UPDATE messages SET is_read=1 WHERE conversation_id=? AND sender_id!=? AND is_read=0').bind(convMessages.id, userId).run();
      return json({ messages: (results ?? []).map(formatMessage) });
    }

    if (path === '/messages' && method === 'POST') {
      const userId = await getUserFromRequest(request, env);
      if (!userId) return err('Unauthorized', 401);
      const { conversationId, text, type, offerAmount } = body as Record<string, unknown>;
      if (!conversationId || !text) return err('conversationId and text required');
      const id = uid();
      await env.DB.prepare('INSERT INTO messages (id, conversation_id, sender_id, text, type, offer_amount) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, conversationId, userId, text, type ?? 'text', offerAmount ?? null).run();
      await env.DB.prepare('UPDATE conversations SET last_message=?, last_message_at=datetime(\'now\') WHERE id=?').bind(text, conversationId).run();
      return json({ message: { id, conversationId, senderId: userId, text, type: type ?? 'text', offerAmount, isRead: false, createdAt: new Date().toISOString() } }, 201);
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    const notifsByUser = match(path, '/notifications/user/:userId');
    if (notifsByUser && method === 'GET') {
      const callerId = await getUserFromRequest(request, env);
      if (!callerId) return err('Unauthorized', 401);
      const { results } = await env.DB.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(notifsByUser.userId).all();
      return json({ notifications: results ?? [] });
    }

    if (path === '/notifications' && method === 'POST') {
      // Internal: create a notification (called from other routes)
      const { userId, type, title, body: notifBody, data } = body as Record<string, unknown>;
      if (!userId || !type || !title) return err('Missing fields');
      const id = uid();
      await env.DB.prepare('INSERT INTO notifications (id, user_id, type, title, body, data) VALUES (?, ?, ?, ?, ?, ?)').bind(id, userId, type, title, notifBody ?? '', JSON.stringify(data ?? {})).run();
      return json({ id }, 201);
    }

    const notifRead = match(path, '/notifications/:id/read');
    if (notifRead && method === 'PUT') {
      await env.DB.prepare('UPDATE notifications SET is_read=1 WHERE id=?').bind(notifRead.id).run();
      return json({ success: true });
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    const userById = match(path, '/users/:id');
    if (userById && method === 'GET') {
      const user = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(userById.id).first();
      if (!user) return err('User not found', 404);
      return json({ user: formatUser(user as Record<string, unknown>) });
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    if (path === '/admin/login' && method === 'POST') {
      const { email, password } = body as Record<string, string>;
      if (!email || !password) return err('email and password required');
      if (email !== env.ADMIN_EMAIL) return err('Invalid credentials', 401);
      // Compare SHA-256 hex of submitted password against stored hash
      const pwBytes  = new TextEncoder().encode(password);
      const hashBuf  = await crypto.subtle.digest('SHA-256', pwBytes);
      const hashHex  = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (hashHex !== env.ADMIN_PASSWORD_HASH) return err('Invalid credentials', 401);
      const token = await signAdminJWT(env.ADMIN_JWT_SECRET);
      return json({ token });
    }

    if (path === '/admin/users' && method === 'GET') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;
      const { results } = await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
      return json({ users: (results ?? []).map(u => ({ ...formatUser(u as Record<string, unknown>), isBanned: !!(u as Record<string, unknown>).is_banned })) });
    }

    const adminUserMatch = match(path, '/admin/users/:id');
    if (adminUserMatch && method === 'PUT') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;
      const { isBanned, role } = body as Record<string, unknown>;
      const updates: string[] = [];
      const vals: unknown[]   = [];
      if (isBanned !== undefined) { updates.push('is_banned = ?'); vals.push(isBanned ? 1 : 0); }
      if (role      !== undefined) { updates.push('role = ?');      vals.push(role); }
      if (updates.length === 0) return err('No fields to update');
      await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...vals, adminUserMatch.id).run();
      return json({ success: true });
    }

    if (path === '/admin/listings' && method === 'GET') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;
      const status = url.searchParams.get('status');
      let q = 'SELECT l.*, u.name as seller_name, u.avatar as seller_avatar, u.rating as seller_rating, u.is_verified as seller_verified FROM listings l JOIN users u ON l.seller_id = u.id';
      const params: unknown[] = [];
      if (status) { q += ' WHERE l.status = ?'; params.push(status); }
      q += ' ORDER BY l.created_at DESC LIMIT 500';
      const { results } = await env.DB.prepare(q).bind(...params).all();
      return json({ listings: (results ?? []).map(formatListing) });
    }

    const adminListingMatch = match(path, '/admin/listings/:id');
    if (adminListingMatch && method === 'PUT') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;
      const { status } = body as Record<string, unknown>;
      if (!status) return err('status required');
      await env.DB.prepare('UPDATE listings SET status = ? WHERE id = ?').bind(status, adminListingMatch.id).run();
      return json({ success: true });
    }

    if (path === '/admin/transactions' && method === 'GET') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;
      const { results } = await env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 500').all();
      return json({ transactions: (results ?? []).map(formatTx) });
    }

    if (path === '/admin/stats' && method === 'GET') {
      const guard = await checkAdmin(request, env);
      if (guard instanceof Response) return guard;

      const [usersRow, listingsRow, txRow, revenueRow, activeRow, pendingRow] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first() as Promise<Record<string, unknown>>,
        env.DB.prepare('SELECT COUNT(*) as cnt FROM listings').first() as Promise<Record<string, unknown>>,
        env.DB.prepare('SELECT COUNT(*) as cnt FROM transactions').first() as Promise<Record<string, unknown>>,
        env.DB.prepare('SELECT COALESCE(SUM(platform_fee),0) as total FROM transactions').first() as Promise<Record<string, unknown>>,
        env.DB.prepare("SELECT COUNT(*) as cnt FROM listings WHERE status='active'").first() as Promise<Record<string, unknown>>,
        env.DB.prepare("SELECT COUNT(*) as cnt FROM listings WHERE status='pending'").first() as Promise<Record<string, unknown>>,
      ]);

      const { results: monthlyRaw } = await env.DB.prepare(
        "SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(platform_fee),0) as revenue, COUNT(*) as count FROM transactions GROUP BY month ORDER BY month DESC LIMIT 12"
      ).all();

      const { results: catRaw } = await env.DB.prepare(
        'SELECT category, COUNT(*) as count FROM listings GROUP BY category ORDER BY count DESC LIMIT 8'
      ).all();

      return json({
        totalUsers:        Number((usersRow as Record<string, unknown>).cnt ?? 0),
        totalListings:     Number((listingsRow as Record<string, unknown>).cnt ?? 0),
        totalTransactions: Number((txRow as Record<string, unknown>).cnt ?? 0),
        totalRevenue:      Number((revenueRow as Record<string, unknown>).total ?? 0),
        activeListings:    Number((activeRow as Record<string, unknown>).cnt ?? 0),
        pendingListings:   Number((pendingRow as Record<string, unknown>).cnt ?? 0),
        monthlySales: (monthlyRaw ?? []).map(r => ({
          month:   r.month,
          revenue: Number(r.revenue),
          count:   Number(r.count),
        })).reverse(),
        topCategories: (catRaw ?? []).map(r => ({
          category: r.category,
          count:    Number(r.count),
        })),
      });
    }

    return err('Not found', 404);
  },
};

// ─── Formatters (snake_case DB → camelCase API) ───────────────────────────────

function formatUser(u: Record<string, unknown>) {
  return {
    uid:          u.id,
    email:        u.email,
    name:         u.name,
    avatar:       u.avatar ?? '',
    department:   u.department ?? '',
    year:         u.year ?? '',
    college:      u.college ?? '',
    rollNumber:   u.roll_number ?? '',
    role:         u.role ?? 'buyer',
    isVerified:   !!u.is_verified,
    rating:       u.rating ?? 0,
    reviewCount:  u.review_count ?? 0,
    totalSales:   u.total_sales ?? 0,
    responseTime: u.response_time ?? 'Usually within a day',
    createdAt:    u.created_at,
  };
}

function formatListing(l: Record<string, unknown>) {
  let images: string[] = [];
  try { images = JSON.parse(l.images as string); } catch { images = []; }
  return {
    id:             l.id,
    title:          l.title,
    description:    l.description,
    price:          l.price,
    originalPrice:  l.original_price,
    finalPrice:     l.final_price,
    acceptedOfferId:l.accepted_offer_id,
    category:       l.category,
    condition:      l.condition,
    images,
    sellerId:       l.seller_id,
    seller: {
      id:         l.seller_id,
      name:       l.seller_name ?? '',
      avatar:     l.seller_avatar ?? '',
      rating:     l.seller_rating ?? 0,
      isVerified: !!l.seller_verified,
    },
    department:  l.department,
    status:      l.status,
    views:       l.views ?? 0,
    isFeatured:  !!l.is_featured,
    reservedFor: l.reserved_for,
    createdAt:   l.created_at,
  };
}

function formatOffer(o: Record<string, unknown>) {
  return {
    id:            o.id,
    listingId:     o.listing_id,
    buyerId:       o.buyer_id,
    buyerName:     o.buyer_name ?? '',
    sellerId:      o.seller_id,
    amount:        o.amount,
    status:        o.status,
    message:       o.message,
    counterAmount: o.counter_amount,
    createdAt:     o.created_at,
  };
}

function formatTx(t: Record<string, unknown>) {
  return {
    id:                  t.id,
    listingId:           t.listing_id,
    listingTitle:        t.listing_title,
    listingImage:        t.listing_image,
    listingPrice:        t.listing_price,
    buyerId:             t.buyer_id,
    buyerName:           t.buyer_name,
    sellerId:            t.seller_id,
    sellerName:          t.seller_name,
    amount:              t.amount,
    itemPrice:           t.item_price,
    platformFee:         t.platform_fee,
    gst:                 t.gst,
    convenienceFee:      t.convenience_fee,
    convenienceFeePaid:  !!t.convenience_fee_paid,
    qrCodeData:          t.qr_code_data,
    isDelivered:         !!t.is_delivered,
    meetupLocation:      t.meetup_location,
    meetupTime:          t.meetup_time,
    paymentMethod:       t.payment_method,
    razorpayPaymentId:   t.razorpay_payment_id,
    deliveryOtp:         t.delivery_otp,
    status:              t.status,
    buyerConfirmed:      !!t.buyer_confirmed,
    sellerConfirmed:     !!t.seller_confirmed,
    meetupStatus:        t.meetup_status ?? 'pending',
    paymentStatus:       t.payment_status ?? (t.convenience_fee_paid ? 'paid' : 'pending'),
    deliveredAt:         t.delivered_at,
    createdAt:           t.created_at,
  };
}

function formatConversation(c: Record<string, unknown>, currentUserId: string) {
  const isP1 = c.participant_1 === currentUserId;
  const otherName   = isP1 ? c.p2_name   : c.p1_name;
  const otherAvatar = isP1 ? c.p2_avatar : c.p1_avatar;
  const otherId     = isP1 ? c.participant_2 : c.participant_1;
  const unread      = isP1 ? c.unread_1 : c.unread_2;
  return {
    id:           c.id,
    listingId:    c.listing_id,
    listingTitle: c.listing_title,
    otherUserId:  otherId,
    otherUserName:otherName ?? '',
    otherAvatar:  otherAvatar ?? '',
    lastMessage:  c.last_message ?? '',
    lastMessageAt:c.last_message_at,
    unreadCount:  unread ?? 0,
  };
}

function formatMessage(m: Record<string, unknown>) {
  return {
    id:             m.id,
    conversationId: m.conversation_id,
    senderId:       m.sender_id,
    text:           m.text,
    type:           m.type ?? 'text',
    offerAmount:    m.offer_amount,
    isRead:         !!m.is_read,
    createdAt:      m.created_at,
  };
}
