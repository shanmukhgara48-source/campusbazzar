import React, { useMemo, useState } from 'react';
import styles from './StudentLogin.module.css';
import {
  authenticate,
  checkRateLimit,
  clearFailedAttempts,
  createAccount,
  finalizeStudentSession,
  getCollegeEmailDomain,
  isOtpRequired,
  registerFailedAttempt,
  requestOtp,
  resetPassword,
  validateFullName,
  validateStudentLogin,
  verifyOtp,
} from '../auth/studentAuth';

function LogoMark() {
  return (
    <div className={styles.logo} aria-label="CampusBazaar">
      <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="cbg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2d7a52" />
            <stop offset="1" stopColor="#1a5c3a" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="url(#cbg)" />
        <path d="M13 22.5l7-10 7 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M15.5 22.5h9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <div className={styles.logoText}>
        <div className={styles.logoName}>CampusBazaar</div>
        <div className={styles.logoTag}>Campus marketplace</div>
      </div>
    </div>
  );
}

export default function StudentLogin({ onSuccess }) {
  const collegeDomain = useMemo(() => getCollegeEmailDomain(), []);
  const requireOtp = useMemo(() => isOtpRequired(), []);

  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [step, setStep] = useState(requireOtp ? 'otp_request' : 'login'); // login | otp_verify
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setStatus('');
    setErrors({});

    const rl = checkRateLimit({ email });
    if (!rl.ok) {
      setErrors({ form: `Too many failed attempts. Try again in ${Math.ceil(rl.retryInMs / 1000)}s.` });
      return;
    }

    const res = validateStudentLogin({ rollNumber, email, password });
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));

    if (requireOtp) {
      const auth = authenticate(res.normalized);
      if (!auth.ok) {
        registerFailedAttempt({ email: res.normalized.email });
        setErrors(auth.errors);
        setLoading(false);
        return;
      }
      requestOtp({ rollNumber: res.normalized.rollNumber, email: res.normalized.email });
      setStep('otp_verify');
      setStatus(`OTP sent to ${res.normalized.email}.`);
      setLoading(false);
      return;
    }

    const auth = authenticate(res.normalized);
    if (!auth.ok) {
      registerFailedAttempt({ email: res.normalized.email });
      setErrors(auth.errors);
      setLoading(false);
      return;
    }

    clearFailedAttempts({ email: res.normalized.email });
    const student = finalizeStudentSession(
      { fullName: auth.user.fullName, rollNumber: res.normalized.rollNumber, email: res.normalized.email },
      { rememberMe },
    );
    onSuccess(student);
  };

  const onVerifyOtp = async () => {
    setStatus('');
    setErrors({});
    if (!String(otp || '').trim()) {
      setErrors((e) => ({ ...e, otp: 'OTP is required.' }));
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const res = verifyOtp({ otp });
    if (!res.ok) {
      setErrors((e) => ({ ...e, otp: res.error }));
      setLoading(false);
      return;
    }

    clearFailedAttempts({ email: res.email });
    // In OTP flow, we keep the auth user info from prior step if available.
    const auth = authenticate({ rollNumber, email: res.email, password });
    const name = auth.ok ? auth.user.fullName : undefined;
    const student = finalizeStudentSession({ fullName: name, rollNumber: res.rollNumber, email: res.email }, { rememberMe });
    onSuccess(student);
  };

  const onResend = () => {
    setStatus('');
    const res = validateStudentLogin({ rollNumber, email, password });
    setErrors(res.errors);
    if (!res.ok) return;
    requestOtp(res.normalized);
    setStatus(`New OTP sent to ${res.normalized.email}.`);
  };

  const onSignup = async () => {
    setStatus('');
    setErrors({});

    const rl = checkRateLimit({ email });
    if (!rl.ok) {
      setErrors({ form: `Too many attempts. Try again in ${Math.ceil(rl.retryInMs / 1000)}s.` });
      return;
    }

    const nameRes = validateFullName(fullName);
    if (!nameRes.ok) {
      setErrors({ fullName: nameRes.error });
      return;
    }

    const res = validateStudentLogin({ rollNumber, email, password });
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }

    if (String(confirmPassword) !== String(password)) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    const created = createAccount({
      fullName: nameRes.value,
      rollNumber: res.normalized.rollNumber,
      email: res.normalized.email,
      password: res.normalized.password,
      confirmPassword,
    });
    if (!created.ok) {
      registerFailedAttempt({ email: res.normalized.email });
      setErrors(created.errors || { form: 'Could not create account.' });
      setLoading(false);
      return;
    }

    clearFailedAttempts({ email: res.normalized.email });
    if (requireOtp) {
      requestOtp({ rollNumber: res.normalized.rollNumber, email: res.normalized.email });
      setStep('otp_verify');
      setMode('login');
      setStatus(`OTP sent to ${res.normalized.email}.`);
      setLoading(false);
      return;
    }

    const student = finalizeStudentSession(
      { fullName: nameRes.value, rollNumber: res.normalized.rollNumber, email: res.normalized.email },
      { rememberMe },
    );
    onSuccess(student);
  };

  const onForgot = async () => {
    setStatus('');
    setErrors({});
    const em = String(email || '').trim();
    if (!em) {
      setErrors({ email: 'College Email ID is required.' });
      return;
    }
    if (!password.trim()) {
      setErrors({ password: 'Enter a new password to reset.' });
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    const res = resetPassword({ email, newPassword: password });
    if (!res.ok) {
      setErrors({ form: res.error });
      setLoading(false);
      return;
    }
    setLoading(false);
    setMode('login');
    setStatus('Password updated. Please log in.');
  };

  const submitLabel = mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Login';

  return (
    <div className={styles.shell}>
      <div className={styles.card} role="dialog" aria-label="Student Login">
        <LogoMark />
        <h1 className={styles.title}>Student Login</h1>
        <p className={styles.subtitle}>
          Login using your college credentials to access the campus marketplace.
        </p>

        <div className={styles.form}>
          {errors.form ? <div className={styles.formError}>{errors.form}</div> : null}

          {mode === 'signup' ? (
            <label className={styles.label}>
              Full Name
              <input
                className={errors.fullName ? `${styles.input} ${styles.inputError}` : styles.input}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={loading}
              />
              {errors.fullName ? <div className={styles.error}>{errors.fullName}</div> : null}
            </label>
          ) : null}

          <label className={styles.label}>
            Roll Number
            <input
              className={errors.rollNumber ? `${styles.input} ${styles.inputError}` : styles.input}
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Enter your Roll Number"
              autoComplete="username"
              disabled={loading || mode === 'forgot'}
            />
            {errors.rollNumber ? <div className={styles.error}>{errors.rollNumber}</div> : null}
          </label>

          <label className={styles.label}>
            College Email ID
            <input
              className={errors.email ? `${styles.input} ${styles.inputError}` : styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your College Email (e.g., name@college.edu)"
              autoComplete="email"
              disabled={loading}
            />
            {errors.email ? <div className={styles.error}>{errors.email}</div> : (
              <div className={styles.hint}>Allowed domain: <span className={styles.mono}>{collegeDomain}</span></div>
            )}
          </label>

          {step !== 'otp_verify' ? (
            <label className={styles.label}>
              Password
              <div className={styles.passwordRow}>
                <input
                  className={errors.password ? `${styles.input} ${styles.inputError}` : styles.input}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'forgot' ? 'Enter a new password' : 'Enter your password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  disabled={loading}
                />
                <button
                  className={styles.toggleBtn}
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={loading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password ? <div className={styles.error}>{errors.password}</div> : null}
            </label>
          ) : null}

          {step !== 'otp_verify' && mode === 'signup' ? (
            <label className={styles.label}>
              Confirm Password
              <input
                className={errors.confirmPassword ? `${styles.input} ${styles.inputError}` : styles.input}
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={loading}
              />
              {errors.confirmPassword ? <div className={styles.error}>{errors.confirmPassword}</div> : null}
            </label>
          ) : null}

          {step !== 'otp_verify' && mode === 'login' ? (
            <div className={styles.optionsRow}>
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                Remember Me
              </label>
              <button
                className={styles.linkBtn}
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrors({});
                  setStatus('');
                }}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
          ) : null}

          {requireOtp && step === 'otp_verify' ? (
            <label className={styles.label}>
              One-time OTP
              <input
                className={errors.otp ? `${styles.input} ${styles.inputError}` : styles.input}
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the 6-digit OTP"
                disabled={loading}
              />
              {errors.otp ? <div className={styles.error}>{errors.otp}</div> : null}
              <div className={styles.row}>
                <button className={styles.linkBtn} type="button" onClick={onResend}>Resend OTP</button>
                <div className={styles.small}>OTP expires in 5 minutes.</div>
              </div>
            </label>
          ) : null}

          {status ? <div className={styles.status}>{status}</div> : null}

          {requireOtp && step === 'otp_verify' ? (
            <button className={styles.primaryBtn} type="button" onClick={onVerifyOtp} disabled={loading}>
              {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
              Verify & Continue
            </button>
          ) : (
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={mode === 'signup' ? onSignup : mode === 'forgot' ? onForgot : onLogin}
              disabled={loading}
            >
              {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
              {submitLabel}
            </button>
          )}

          {step !== 'otp_verify' ? (
            <div className={styles.altRow}>
              {mode !== 'login' ? (
                <button
                  className={styles.linkBtn}
                  type="button"
                  onClick={() => {
                    setMode('login'); setErrors({}); setStatus('');
                    setFullName(''); setConfirmPassword('');
                  }}
                  disabled={loading}
                >
                  Back to Login
                </button>
              ) : (
                <button className={styles.linkBtn} type="button" onClick={() => { setMode('signup'); setErrors({}); setStatus(''); }} disabled={loading}>
                  Create Account / Sign Up
                </button>
              )}
              {mode === 'signup' ? (
                <div className={styles.small}>First-time users can create an account.</div>
              ) : null}
            </div>
          ) : null}

          <div className={styles.foot}>
            Only verified college students can access CampusBazaar.
          </div>
        </div>
      </div>
    </div>
  );
}

