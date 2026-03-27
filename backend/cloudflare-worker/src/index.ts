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

    // ── Auth ─────────────────────────────────────────────────────────────────

    if (path === '/auth/register' && method === 'POST') {
      const { email, password, name, college, rollNumber } = body as Record<string, string>;
      if (!email || !password || !name) return err('email, password and name are required');

      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
      if (existing) return err('Email already registered', 409);

      const id   = uid();
      const hash = await hashPassword(password);
      await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, name, college, roll_number) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, email.toLowerCase(), hash, name, college ?? '', rollNumber ?? '').run();

      const token = await signJWT({ uid: id, email: email.toLowerCase() }, env.JWT_SECRET);
      return json({ token, user: { uid: id, email: email.toLowerCase(), name, college: college ?? '', rollNumber: rollNumber ?? '', avatar: '', role: 'buyer', isVerified: false, rating: 0, reviewCount: 0, totalSales: 0 } });
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
      await env.DB.prepare('UPDATE offers SET status = ?, counter_amount = COALESCE(?, counter_amount) WHERE id = ?')
        .bind(status, counterAmount, offerMatch.id).run();

      if (status === 'accepted') {
        const offer = await env.DB.prepare('SELECT * FROM offers WHERE id = ?').bind(offerMatch.id).first() as Record<string, unknown> | null;
        if (offer) {
          await env.DB.prepare('UPDATE listings SET status = \'reserved\', final_price = ?, accepted_offer_id = ?, reserved_for = ? WHERE id = ?')
            .bind(offer.amount, offerMatch.id, offer.buyer_id, offer.listing_id).run();
        }
      }
      return json({ success: true });
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
      const { status, qrCodeData, isDelivered, buyerConfirmed, sellerConfirmed } = body as Record<string, unknown>;
      await env.DB.prepare(`UPDATE transactions SET status=COALESCE(?,status), qr_code_data=COALESCE(?,qr_code_data), is_delivered=COALESCE(?,is_delivered), buyer_confirmed=COALESCE(?,buyer_confirmed), seller_confirmed=COALESCE(?,seller_confirmed) WHERE id=?`)
        .bind(status, qrCodeData, isDelivered != null ? (isDelivered ? 1 : 0) : null, buyerConfirmed != null ? (buyerConfirmed ? 1 : 0) : null, sellerConfirmed != null ? (sellerConfirmed ? 1 : 0) : null, txById.id).run();
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
