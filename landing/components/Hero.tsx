'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, ShieldCheck, Star, MessageCircle } from 'lucide-react';

const fu = (d = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, delay: d, ease: [0.22, 1, 0.36, 1] },
});

function PhoneMockup() {
  return (
    <div className="relative" style={{ perspective: '800px' }}>
      {/* Glow beneath phone */}
      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-12 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(0,255,157,0.35)' }}
      />

      {/* Phone wrapper — 3D tilted */}
      <div
        className="phone-float relative w-[220px] mx-auto"
        style={{ transform: 'rotateZ(-8deg) rotateY(-12deg)' }}
      >
        {/* Phone frame */}
        <div
          className="relative w-[220px] h-[440px] rounded-[36px] overflow-hidden"
          style={{
            background: '#111',
            border: '2px solid rgba(0,255,157,0.3)',
            boxShadow: '0 0 40px rgba(0,255,157,0.2), -8px 16px 48px rgba(0,0,0,0.7)',
          }}
        >
          {/* Side button */}
          <div className="absolute right-[-3px] top-28 w-[3px] h-12 rounded-l" style={{ background: 'rgba(0,255,157,0.4)' }} />

          {/* Screen */}
          <div className="absolute inset-[2px] rounded-[34px] bg-[#0a0a0a] overflow-hidden flex flex-col">
            {/* Status bar */}
            <div className="flex justify-between items-center px-5 pt-3 pb-1 flex-shrink-0">
              <span className="text-[9px] font-bold text-white">9:41</span>
              <div className="flex items-center gap-1">
                {[3,4,5,4].map((h, i) => (
                  <div key={i} className="w-[3px] rounded-sm bg-[#00FF9D]" style={{ height: h * 2.5, opacity: 0.6 + i * 0.1 }} />
                ))}
              </div>
            </div>

            {/* App header */}
            <div className="px-4 py-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <p className="text-[8px] text-[#444]">Hey Rahul 👋</p>
                  <p className="text-[12px] font-bold text-white">CampusBazaar</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#00FF9D] flex items-center justify-center pulse-glow">
                  <span className="text-[8px] font-black text-[#0a0a0a]">RK</span>
                </div>
              </div>
              {/* Search */}
              <div className="h-7 rounded-full bg-[#1a1a1a] flex items-center px-3 gap-2" style={{ border: '1px solid rgba(0,255,157,0.1)' }}>
                <div className="w-2.5 h-2.5 rounded-full border border-[rgba(0,255,157,0.4)]" />
                <div className="h-1.5 w-20 bg-[rgba(0,255,157,0.08)] rounded-full" />
              </div>
            </div>

            {/* Category chips */}
            <div className="flex gap-1.5 px-4 py-1.5 flex-shrink-0">
              {['All', 'Books', 'Tech', 'Sports'].map((c, i) => (
                <span key={c} className={`px-2 py-[3px] rounded-full text-[8px] font-bold ${i === 0 ? 'bg-[#00FF9D] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-[#555]'}`}
                  style={i === 0 ? { boxShadow: '0 0 8px rgba(0,255,157,0.35)' } : {}}>
                  {c}
                </span>
              ))}
            </div>

            {/* Banner */}
            <div className="mx-4 mb-2 rounded-xl p-2.5 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0a2e1f, #0f3d28)', border: '1px solid rgba(0,255,157,0.2)' }}>
              <p className="text-[#00FF9D] font-bold text-[10px]">🔥 New Arrivals</p>
              <p className="text-[#4a7a5a] text-[8px] mt-0.5">Fresh listings from your campus</p>
            </div>

            {/* Listings grid */}
            <div className="grid grid-cols-2 gap-1.5 px-4 flex-1 overflow-hidden">
              {[
                { emoji: '📚', label: 'Physics Book', price: '₹280', from: 'from-blue-900', to: 'to-blue-950' },
                { emoji: '💻', label: 'HP Laptop', price: '₹15k', from: 'from-violet-900', to: 'to-violet-950' },
                { emoji: '🚲', label: 'MTB Cycle', price: '₹2.5k', from: 'from-emerald-900', to: 'to-emerald-950' },
                { emoji: '🎧', label: 'Headphones', price: '₹800', from: 'from-rose-900', to: 'to-rose-950' },
              ].map((item, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className={`h-12 bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center`}>
                    <span className="text-xl">{item.emoji}</span>
                  </div>
                  <div className="p-1.5">
                    <p className="text-[9px] text-[#555] truncate">{item.label}</p>
                    <p className="text-[#00FF9D] font-bold text-[10px]">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-around px-4 py-2.5 bg-[#111] border-t border-[rgba(255,255,255,0.04)] flex-shrink-0 mt-1">
              {['⊞', '♡', '+', '✉', '◉'].map((icon, i) => (
                <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] ${i === 2 ? 'bg-[#00FF9D] text-[#0a0a0a] font-bold' : i === 0 ? 'text-[#00FF9D]' : 'text-[#333]'}`}
                  style={i === 2 ? { boxShadow: '0 0 10px rgba(0,255,157,0.4)' } : {}}>
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-12 top-20 glass-neon rounded-2xl px-3 py-2.5 min-w-[140px]"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[rgba(0,255,157,0.15)] flex items-center justify-center">
            <ShieldCheck size={11} className="text-[#00FF9D]" />
          </div>
          <div>
            <p className="text-white text-[10px] font-bold">Verified ✓</p>
            <p className="text-[#4a7a5a] text-[9px]">VJIT Campus</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-4 top-32 glass-neon rounded-2xl px-3 py-2"
      >
        <div className="flex items-center gap-1 mb-0.5">
          {[...Array(5)].map((_, i) => <Star key={i} size={9} className="text-[#00FF9D] fill-[#00FF9D]" />)}
        </div>
        <p className="text-[#4a7a5a] text-[9px]">4.9 · 500+ deals</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
        className="absolute -right-8 bottom-28 glass-neon rounded-2xl px-3 py-2"
      >
        <div className="flex items-center gap-1.5">
          <MessageCircle size={11} className="text-[#00FF9D]" />
          <p className="text-white text-[10px] font-bold">New message!</p>
        </div>
        <p className="text-[#4a7a5a] text-[9px] mt-0.5">&quot;Is it still available?&quot;</p>
      </motion.div>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* BG layers */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(0,255,157,0.07) 0%, transparent 65%)' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,200,100,0.04) 0%, transparent 65%)' }} />

      <div className="relative max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* LEFT */}
          <div className="max-w-xl">
            {/* Label */}
            <motion.div {...fu(0)} className="mb-7">
              <span className="section-label">
                <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-[#00FF9D]" style={{ boxShadow: '0 0 5px #00FF9D' }} />
                Keep your campus safe
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fu(0.1)} className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.04] mb-6">
              <span className="text-white">Campus</span>
              <br />
              <span className="gradient-text">Bazaar</span>
              <br />
              <span className="text-white">is </span>
              <span className="text-white">Coming </span>
              <span className="gradient-text">Soon</span>
              <span className="text-white"> 🚀</span>
            </motion.h1>

            {/* Sub */}
            <motion.p {...fu(0.2)} className="text-[#777] text-lg sm:text-xl leading-relaxed mb-10">
              Buy, sell, and connect with students on your campus like never before.
              Verified users. Real-time chat. Secure transactions.
            </motion.p>

            {/* CTA row */}
            <motion.div {...fu(0.3)} className="flex flex-wrap gap-4 mb-12">
              <a href="#cta" className="neon-btn inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base">
                Join Waitlist <ArrowRight size={18} />
              </a>
              <a href="#features" className="ghost-btn inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base">
                Explore Features
              </a>
            </motion.div>

            {/* Mini trust row */}
            <motion.div {...fu(0.4)} className="flex flex-wrap items-center gap-6">
              {[
                { n: '1000+', l: 'Students Waiting' },
                { n: '500+', l: 'Campus Items' },
                { n: '100%', l: 'Verified' },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-2.5">
                  <div className="text-white font-black text-2xl leading-none">{s.n}</div>
                  <div className="text-[#555] text-xs leading-tight">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Phone */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: 20 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex justify-center items-center py-10"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className="text-[#333] text-[10px] tracking-widest uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown size={18} className="text-[#333]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
