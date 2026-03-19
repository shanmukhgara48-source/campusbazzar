'use client';

import { motion } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';

const rows = [
  {
    feature: 'Verified Users',
    cb: 'College email only',
    olx: 'Anyone can join',
    fb: 'Anyone can join',
    cbIcon: true,
    olxIcon: false,
    fbIcon: false,
  },
  {
    feature: 'Safety',
    cb: 'Campus-only meetups',
    olx: 'Unknown strangers',
    fb: 'Risky meetups',
    cbIcon: true,
    olxIcon: false,
    fbIcon: false,
  },
  {
    feature: 'Relevance',
    cb: 'Only student items',
    olx: 'Mixed junk listings',
    fb: 'Irrelevant listings',
    cbIcon: true,
    olxIcon: false,
    fbIcon: false,
  },
  {
    feature: 'Chat System',
    cb: 'Built-in real-time chat',
    olx: 'Limited messaging',
    fb: 'Messy inbox',
    cbIcon: true,
    olxIcon: false,
    fbIcon: false,
  },
  {
    feature: 'Trust',
    cb: 'Verified community',
    olx: 'No trust system',
    fb: 'Fake profiles',
    cbIcon: true,
    olxIcon: false,
    fbIcon: false,
  },
];

const cols = [
  {
    key: 'cb',
    label: 'CampusBazaar',
    badge: 'Recommended',
    highlight: true,
    textColor: '#00FF9D',
    bg: 'rgba(0,255,157,0.07)',
    border: 'rgba(0,255,157,0.25)',
    badgeBg: '#00FF9D',
    badgeText: '#0a0a0a',
  },
  {
    key: 'olx',
    label: 'OLX',
    highlight: false,
    textColor: '#555',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.06)',
  },
  {
    key: 'fb',
    label: 'Facebook\nMarketplace',
    highlight: false,
    textColor: '#555',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.06)',
  },
];

export default function Comparison() {
  return (
    <section id="comparison" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#0c0c0c' }} />
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.15), transparent)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.15), transparent)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,157,0.05) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="section-label mb-5">Comparison</div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Why not <span className="gradient-text">OLX or Facebook</span>
            <br />
            Marketplace?
          </h2>
          <p className="text-[#555] text-lg max-w-xl mx-auto">
            Public marketplaces are unsafe for campus trades. Here&apos;s why CampusBazaar is in a different league.
          </p>
        </motion.div>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="hidden md:block rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Column headers */}
          <div className="grid grid-cols-4" style={{ background: '#111' }}>
            <div className="px-6 py-5 border-r border-white/[0.06]">
              <span className="text-[#333] text-xs font-bold tracking-widest uppercase">Feature</span>
            </div>
            {cols.map((col) => (
              <div
                key={col.key}
                className="px-6 py-5 text-center relative"
                style={{
                  background: col.highlight ? col.bg : 'transparent',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {col.highlight && (
                  <>
                    {/* Top glow line */}
                    <div
                      className="absolute top-0 inset-x-0 h-[2px]"
                      style={{ background: 'linear-gradient(90deg, transparent, #00FF9D, transparent)', boxShadow: '0 0 12px rgba(0,255,157,0.6)' }}
                    />
                    {/* Badge */}
                    {col.badge && (
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black mb-2"
                        style={{ background: col.badgeBg, color: col.badgeText }}
                      >
                        <Zap size={9} />
                        {col.badge}
                      </div>
                    )}
                  </>
                )}
                <div
                  className="font-black text-sm whitespace-pre-line leading-tight"
                  style={{ color: col.highlight ? '#00FF9D' : '#555' }}
                >
                  {col.label}
                </div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="grid grid-cols-4 group"
              style={{
                background: i % 2 === 0 ? '#0d0d0d' : '#111',
                borderTop: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Feature name */}
              <div className="px-6 py-5 flex items-center border-r border-white/[0.04]">
                <span className="text-white font-semibold text-sm">{row.feature}</span>
              </div>

              {/* CB column */}
              <div
                className="px-6 py-5 flex flex-col items-center justify-center gap-2 border-r border-white/[0.04]"
                style={{ background: 'rgba(0,255,157,0.04)' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,255,157,0.15)', border: '1px solid rgba(0,255,157,0.3)' }}
                >
                  <Check size={13} className="text-[#00FF9D]" />
                </div>
                <span className="text-[#00C97A] text-xs text-center leading-tight font-medium">{row.cb}</span>
              </div>

              {/* OLX column */}
              <div className="px-6 py-5 flex flex-col items-center justify-center gap-2 border-r border-white/[0.04]">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)' }}
                >
                  <X size={13} className="text-red-500/70" />
                </div>
                <span className="text-[#444] text-xs text-center leading-tight">{row.olx}</span>
              </div>

              {/* Facebook column */}
              <div className="px-6 py-5 flex flex-col items-center justify-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)' }}
                >
                  <X size={13} className="text-red-500/70" />
                </div>
                <span className="text-[#444] text-xs text-center leading-tight">{row.fb}</span>
              </div>
            </motion.div>
          ))}

          {/* Bottom verdict row */}
          <div
            className="grid grid-cols-4"
            style={{ background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="px-6 py-4 border-r border-white/[0.04]">
              <span className="text-[#333] text-xs font-bold tracking-widest uppercase">Verdict</span>
            </div>
            <div
              className="px-6 py-4 flex items-center justify-center border-r border-white/[0.04]"
              style={{ background: 'rgba(0,255,157,0.06)' }}
            >
              <span
                className="text-sm font-black"
                style={{ color: '#00FF9D', textShadow: '0 0 16px rgba(0,255,157,0.4)' }}
              >
                ✅ Perfect for campus
              </span>
            </div>
            <div className="px-6 py-4 flex items-center justify-center border-r border-white/[0.04]">
              <span className="text-red-500/50 text-sm font-semibold">❌ Too risky</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-center">
              <span className="text-red-500/50 text-sm font-semibold">❌ Too public</span>
            </div>
          </div>
        </motion.div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {rows.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Feature label */}
              <div
                className="px-5 py-3"
                style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-white font-bold text-sm">{row.feature}</span>
              </div>

              <div className="p-4 space-y-3">
                {/* CB */}
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(0,255,157,0.07)', border: '1px solid rgba(0,255,157,0.2)' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,255,157,0.2)' }}
                  >
                    <Check size={12} className="text-[#00FF9D]" />
                  </div>
                  <div>
                    <p className="text-[#00FF9D] text-xs font-bold">CampusBazaar</p>
                    <p className="text-[#4a9a6a] text-xs">{row.cb}</p>
                  </div>
                </div>

                {/* OLX + FB side by side */}
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: 'OLX', value: row.olx }, { label: 'Facebook', value: row.fb }].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,60,60,0.1)' }}
                        >
                          <X size={9} className="text-red-500/60" />
                        </div>
                        <span className="text-[#444] text-[10px] font-bold">{item.label}</span>
                      </div>
                      <p className="text-[#333] text-[10px] leading-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <div
            className="inline-block px-8 py-5 rounded-2xl"
            style={{
              background: 'rgba(0,255,157,0.05)',
              border: '1px solid rgba(0,255,157,0.2)',
            }}
          >
            <p className="text-[#888] text-sm mb-3">
              🎓 The only marketplace{' '}
              <span className="text-white font-bold">designed exclusively for campus students</span>
            </p>
            <a
              href="#cta"
              className="neon-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
            >
              Join Waitlist — It&apos;s Free
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
