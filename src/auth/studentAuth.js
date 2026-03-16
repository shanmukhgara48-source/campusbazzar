const STORAGE_KEY = 'cb_student';
const SESSION_KEY = 'cb_student_session';
const OTP_KEY = 'cb_pending_otp';
const USERS_KEY = 'cb_users';
const RL_KEY = 'cb_rate_limit';

export function getApprovedCollegeDomains() {
  // Configure like "@college.edu,@college.ac.in" via env. Default matches prompt example.
  const raw = (process.env.REACT_APP_COLLEGE_DOMAINS || process.env.REACT_APP_COLLEGE_DOMAIN || '@college.edu');
  return String(raw)
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .map((d) => (d.startsWith('@') ? d : `@${d}`));
}

export function getCollegeEmailDomain() {
  // Back-compat for UI hints (first domain).
  return getApprovedCollegeDomains()[0] || '@college.edu';
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getStorageForStudent() {
  const hasPersistent = localStorage.getItem(STORAGE_KEY);
  if (hasPersistent) return localStorage;
  const hasSession = sessionStorage.getItem(SESSION_KEY);
  if (hasSession) return sessionStorage;
  return localStorage;
}

export function getStudent() {
  try {
    const persistent = localStorage.getItem(STORAGE_KEY);
    if (persistent) return JSON.parse(persistent);
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) return JSON.parse(session);
    return null;
  } catch {
    return null;
  }
}

export function setStudent(student, { rememberMe } = {}) {
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(student));
  localStorage.removeItem(STORAGE_KEY);
}

export function logoutStudent() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(OTP_KEY);
}

export function validateStudentLogin({ rollNumber, email, password }) {
  const errors = {};
  const rn = String(rollNumber || '').trim();
  const em = normalizeEmail(email);
  const pw = String(password || '');

  if (!rn) errors.rollNumber = 'Roll Number is required.';
  if (!em) errors.email = 'College Email ID is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) errors.email = 'Enter a valid email address.';
  else {
    const domains = getApprovedCollegeDomains();
    const ok = domains.some((d) => em.endsWith(d));
    if (!ok) errors.email = `Use an approved college email (${domains.join(', ')}).`;
  }

  if (password !== undefined) {
    if (!pw.trim()) errors.password = 'Password is required.';
    else if (pw.length < 6) errors.password = 'Password must be at least 6 characters.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    normalized: { rollNumber: rn, email: em, password: pw },
  };
}

export function normalizeFullName(fullName) {
  return String(fullName || '').trim().replace(/\s+/g, ' ');
}

export function validateFullName(fullName) {
  const v = normalizeFullName(fullName);
  if (!v) return { ok: false, error: 'Full Name is required.' };
  if (!/^[A-Za-z ]+$/.test(v)) return { ok: false, error: 'Full Name can contain only letters and spaces.' };
  return { ok: true, value: v };
}

export function isOtpRequired() {
  return String(process.env.REACT_APP_REQUIRE_OTP || '').toLowerCase() === 'true';
}

export function requestOtp({ rollNumber, email }) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = { rollNumber, email, otp, expiresAt };
  localStorage.setItem(OTP_KEY, JSON.stringify(payload));

  // No backend in this repo to actually email. In dev you can read OTP from console.
  // eslint-disable-next-line no-console
  console.log(`[CampusBazaar OTP] ${email}: ${otp} (expires in 5 min)`);

  return { ok: true, expiresAt };
}

export function verifyOtp({ otp }) {
  try {
    const raw = localStorage.getItem(OTP_KEY);
    if (!raw) return { ok: false, error: 'Please request an OTP first.' };
    const payload = JSON.parse(raw);
    if (Date.now() > payload.expiresAt) return { ok: false, error: 'OTP expired. Please request a new one.' };
    if (String(otp || '').trim() !== String(payload.otp)) return { ok: false, error: 'Incorrect OTP.' };
    return { ok: true, rollNumber: payload.rollNumber, email: payload.email };
  } catch {
    return { ok: false, error: 'Please request an OTP again.' };
  }
}

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

function hashPassword(pw) {
  // Frontend-only demo auth: basic obfuscation, not cryptographic security.
  let h = 2166136261;
  const s = String(pw || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16)}`;
}

function getUsers() {
  return readJson(localStorage, USERS_KEY, []);
}

function setUsers(users) {
  writeJson(localStorage, USERS_KEY, users);
}

export function createAccount({ fullName, rollNumber, email, password, confirmPassword }) {
  const nameRes = validateFullName(fullName);
  if (!nameRes.ok) return { ok: false, errors: { fullName: nameRes.error } };

  if (confirmPassword !== undefined && String(confirmPassword) !== String(password)) {
    return { ok: false, errors: { confirmPassword: 'Passwords do not match.' } };
  }

  const { ok, errors, normalized } = validateStudentLogin({ rollNumber, email, password });
  if (!ok) return { ok: false, errors };

  const users = getUsers();
  const exists = users.some((u) => u.email === normalized.email);
  if (exists) return { ok: false, errors: { email: 'Account already exists. Please log in.' } };

  const now = new Date().toISOString();
  const user = {
    fullName: nameRes.value,
    rollNumber: normalized.rollNumber,
    email: normalized.email,
    passwordHash: hashPassword(normalized.password),
    verified: true,
    createdAt: now,
    lastLoginAt: now,
  };
  setUsers([...users, user]);
  return { ok: true, user };
}

export function authenticate({ rollNumber, email, password }) {
  const { ok, errors, normalized } = validateStudentLogin({ rollNumber, email, password });
  if (!ok) return { ok: false, errors };

  const users = getUsers();
  const user = users.find((u) => u.email === normalized.email);
  if (!user) return { ok: false, errors: { email: 'No account found. Please create an account.' } };
  if (user.rollNumber !== normalized.rollNumber) return { ok: false, errors: { rollNumber: 'Incorrect roll number.' } };
  if (user.passwordHash !== hashPassword(normalized.password)) return { ok: false, errors: { password: 'Incorrect password.' } };
  return { ok: true, user: { ...user, lastLoginAt: new Date().toISOString() } };
}

export function resetPassword({ email, newPassword }) {
  const em = normalizeEmail(email);
  if (!em) return { ok: false, error: 'College Email ID is required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return { ok: false, error: 'Enter a valid email address.' };
  const domains = getApprovedCollegeDomains();
  const okDomain = domains.some((d) => em.endsWith(d));
  if (!okDomain) return { ok: false, error: `Use an approved college email (${domains.join(', ')}).` };
  const pw = String(newPassword || '');
  if (!pw.trim()) return { ok: false, error: 'New password is required.' };
  if (pw.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  const users = getUsers();
  const idx = users.findIndex((u) => u.email === em);
  if (idx < 0) return { ok: false, error: 'No account found for this email.' };
  const next = [...users];
  next[idx] = { ...next[idx], passwordHash: hashPassword(pw) };
  setUsers(next);
  return { ok: true };
}

function getRateLimit() {
  return readJson(localStorage, RL_KEY, {});
}

function setRateLimit(rl) {
  writeJson(localStorage, RL_KEY, rl);
}

export function checkRateLimit({ email }) {
  const em = normalizeEmail(email);
  const rl = getRateLimit();
  const entry = rl[em];
  if (!entry) return { ok: true };
  if (entry.lockUntil && Date.now() < entry.lockUntil) {
    return { ok: false, retryInMs: entry.lockUntil - Date.now() };
  }
  return { ok: true };
}

export function registerFailedAttempt({ email }) {
  const em = normalizeEmail(email);
  const rl = getRateLimit();
  const now = Date.now();
  const entry = rl[em] || { fails: 0, windowStart: now, lockUntil: 0 };

  // 5-attempt rolling window over 2 minutes; lock for 30 seconds.
  const WINDOW_MS = 2 * 60 * 1000;
  const MAX_FAILS = 5;
  const LOCK_MS = 30 * 1000;

  const withinWindow = now - entry.windowStart <= WINDOW_MS;
  const nextEntry = withinWindow
    ? { ...entry, fails: entry.fails + 1 }
    : { fails: 1, windowStart: now, lockUntil: 0 };

  if (nextEntry.fails >= MAX_FAILS) {
    nextEntry.lockUntil = now + LOCK_MS;
  }

  rl[em] = nextEntry;
  setRateLimit(rl);
  return { ...nextEntry };
}

export function clearFailedAttempts({ email }) {
  const em = normalizeEmail(email);
  const rl = getRateLimit();
  if (rl[em]) {
    delete rl[em];
    setRateLimit(rl);
  }
}

export function finalizeStudentSession({ fullName, rollNumber, email }, { rememberMe } = {}) {
  const storage = getStorageForStudent();
  const existing = readJson(storage, STORAGE_KEY, null) || readJson(storage, SESSION_KEY, null);
  const now = new Date().toISOString();

  const student = existing && existing.email === email
    ? { ...existing, fullName: fullName || existing.fullName, rollNumber, verified: true, lastLoginAt: now }
    : { fullName, rollNumber, email, verified: true, createdAt: now, lastLoginAt: now };

  setStudent(student, { rememberMe });
  localStorage.removeItem(OTP_KEY);
  return student;
}
