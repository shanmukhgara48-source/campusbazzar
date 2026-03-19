'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

export default function CTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); return; }
      if (data.message === 'already_registered') { setStatus('duplicate'); return; }
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="cta" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.2), transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,157,0.08) 0%, transparent 70%)' }} />

      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-label mb-7">Get In Touch Today</div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-4">
            <span className="text-white">Be the first to experience</span>
            <br />
            <span className="gradient-text">CampusBazaar</span>
          </h2>
          <p className="text-[#555] text-lg mb-12 max-w-xl mx-auto">
            Join the waitlist. We&apos;ll notify you the moment your campus goes live.
          </p>

          <AnimatePresence mode="wait">
            {status === 'success' || status === 'duplicate' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,255,157,0.1)', border: '2px solid rgba(0,255,157,0.4)', boxShadow: '0 0 24px rgba(0,255,157,0.3)' }}>
                  <CheckCircle2 size={32} className="text-[#00FF9D]" />
                </div>
                <p className="text-white font-bold text-2xl">
                  {status === 'duplicate' ? "Already registered! 👍" : "You're on the list! 🎉"}
                </p>
                <p className="text-[#555]">
                  {status === 'duplicate'
                    ? "You're already on our waitlist. We'll be in touch soon."
                    : "We'll notify you the moment CampusBazaar launches."}
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                  placeholder="Enter your college email"
                  className="flex-1 h-14 px-5 rounded-2xl text-white placeholder-[#333] outline-none text-base bg-[#111] focus:border-[rgba(0,255,157,0.35)] transition-all duration-300"
                  style={{ border: `1px solid ${status === 'error' ? 'rgba(255,100,100,0.35)' : 'rgba(255,255,255,0.08)'}` }}
                  required
                />
                <button
                  type="submit"
                  disabled={!isValid || status === 'loading'}
                  className="h-14 px-7 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={isValid ? {
                    background: '#00FF9D',
                    color: '#0a0a0a',
                    boxShadow: '0 0 24px rgba(0,255,157,0.4)',
                  } : {
                    background: 'rgba(0,255,157,0.15)',
                    color: 'rgba(0,255,157,0.4)',
                  }}
                >
                  {status === 'loading' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><span>Get Early Access</span><ArrowRight size={16} /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {status === 'error' && (
            <p className="mt-3 text-red-400 text-sm">Something went wrong. Please try again.</p>
          )}
          {(status === 'idle' || status === 'loading') && (
            <p className="mt-4 text-[#333] text-sm">No spam. Notify only on launch.</p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
