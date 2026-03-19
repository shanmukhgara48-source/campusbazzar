'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

const trustPoints = [
  'Zero anonymous users — every student verified',
  'Campus-exclusive listings, no outside sellers',
  'Razorpay-secured payments with full transparency',
  'Meet at campus hotspots for complete safety',
];

export default function Trust() {
  return (
    <section id="trust" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#0c0c0c' }} />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.15), transparent)' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(0,255,157,0.06) 0%, transparent 65%)' }} />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT — visual card (crypto reference style) */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              {/* Main card */}
              <div className="rounded-2xl p-8 mb-4"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-[#444] text-xs mb-1 font-mono tracking-wide">AVERAGE RATING</p>
                    <p className="text-white font-black text-4xl">4.9 ★</p>
                    <p className="text-[#00FF9D] text-sm font-semibold mt-1">+12% this month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#444] text-xs mb-1 font-mono tracking-wide">ACTIVE USERS</p>
                    <p className="text-white font-black text-4xl">1.2K+</p>
                    <p className="text-[#555] text-sm mt-1">On waitlist</p>
                  </div>
                </div>

                {/* Graph-like bars */}
                <div className="flex items-end gap-2 h-16 mb-4">
                  {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm"
                      style={{
                        height: `${h}%`,
                        background: i >= 10 ? '#00FF9D' : 'rgba(0,255,157,0.2)',
                      }} />
                  ))}
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Listings', value: '500+' },
                    { label: 'Deals Closed', value: '200+' },
                    { label: 'Colleges', value: '5+' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3 text-center"
                      style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="text-white font-black text-lg">{s.value}</div>
                      <div className="text-[#444] text-xs mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating mini card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-4 -bottom-4 glass-neon rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-[#00FF9D] fill-[#00FF9D]" />)}
                </div>
                <p className="text-white text-xs font-bold">&quot;Best campus app ever!&quot;</p>
                <p className="text-[#4a7a5a] text-[10px] mt-0.5">— Student, VJIT</p>
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT — text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="section-label mb-6">Trusted platform</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              <span className="text-white">Trusted platform </span>
              <br />
              <span className="gradient-text">anytime &amp; anywhere.</span>
            </h2>

            {/* Stars */}
            <div className="flex items-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-[#00FF9D] fill-[#00FF9D]" />)}
              <span className="text-[#555] text-sm ml-2">Loved by students</span>
            </div>

            <p className="text-[#666] text-lg leading-relaxed mb-8">
              Built for students, by students. CampusBazaar is a growing ecosystem of verified campus buyers and sellers, backed by trust and technology.
            </p>

            {/* Trust points */}
            <ul className="space-y-3 mb-10">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[rgba(0,255,157,0.12)] border border-[rgba(0,255,157,0.25)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#00FF9D]" />
                  </div>
                  <span className="text-[#888] text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <a href="#cta" className="neon-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm">
                Learn More <ArrowRight size={16} />
              </a>
              <a href="#features" className="text-[#555] hover:text-[#00FF9D] text-sm font-medium transition-colors self-center">
                Ask question?
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
