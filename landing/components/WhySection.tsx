'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const cards = [
  {
    n: '01.',
    title: 'Service for Every Student.',
    desc: 'From freshers to final-year students, CampusBazaar serves every student on your campus with equal ease.',
    highlight: false,
  },
  {
    n: '02.',
    title: 'Industry Best Practices.',
    desc: 'Verified college emails, Razorpay payments, real-time messaging — built with the highest standards in campus commerce.',
    highlight: true,
    link: 'Learn More →',
  },
  {
    n: '03.',
    title: 'Protected by Campus Trust.',
    desc: 'No anonymous strangers. Every seller and buyer is verified through their college institution.',
    highlight: false,
  },
];

export default function WhySection() {
  return (
    <section id="why" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]" />

      <div className="relative max-w-7xl mx-auto">
        {/* Top row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid lg:grid-cols-2 gap-12 items-end mb-16"
        >
          <div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              <span className="text-white">Your </span>
              <span className="gradient-text">trusted </span>
              <span className="text-white">partner</span>
              <br />
              <span className="text-white">of campus commerce.</span>
            </h2>
          </div>
          <div>
            <p className="text-[#666] text-lg leading-relaxed">
              CampusBazaar unites and secures a growing ecosystem of campus buyers and sellers. Built exclusively for students, it&apos;s the safest way to trade on campus.
            </p>
          </div>
        </motion.div>

        {/* Three cards — middle highlighted green (crypto reference style) */}
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={card.n}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-2xl p-8 flex flex-col justify-between min-h-[280px] ${
                card.highlight ? 'cursor-default' : 'card-hover cursor-default'
              }`}
              style={
                card.highlight
                  ? { background: '#00FF9D', boxShadow: '0 0 60px rgba(0,255,157,0.35), 0 24px 48px rgba(0,0,0,0.4)' }
                  : { background: '#111', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              <div>
                <div className={`font-black text-lg mb-4 ${card.highlight ? 'text-[#0a2e1f]' : 'text-[#00FF9D]'}`}>
                  {card.n}
                </div>
                <h3 className={`font-black text-2xl leading-tight mb-4 ${card.highlight ? 'text-[#0a0a0a]' : 'text-white'}`}>
                  {card.title}
                </h3>
                <p className={`text-sm leading-relaxed ${card.highlight ? 'text-[#1a4a2a]' : 'text-[#555]'}`}>
                  {card.desc}
                </p>
              </div>
              {card.link && (
                <div className="mt-8">
                  <a href="#features" className="inline-flex items-center gap-2 bg-[#0a0a0a] text-[#00FF9D] font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#111] transition-colors">
                    Learn More <ArrowRight size={15} />
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
