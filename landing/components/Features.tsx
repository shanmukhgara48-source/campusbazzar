'use client';

import { motion } from 'framer-motion';
import { ListChecks, MessageSquare, Tag, CreditCard, Lock, Smartphone } from 'lucide-react';

const features = [
  {
    icon: ListChecks,
    title: 'Smart Listings',
    desc: 'Post items in under 60 seconds. Photos, description, price — clean and organized.',
    col: 'col-span-1',
  },
  {
    icon: MessageSquare,
    title: 'Instant Messaging',
    desc: 'Real-time chat between buyers and sellers. Negotiate, ask questions, close deals fast.',
    col: 'col-span-1',
  },
  {
    icon: Tag,
    title: 'Offer System',
    desc: 'Make or receive offers on any listing. Sellers can accept, reject, or counter.',
    col: 'col-span-1',
    wide: true,
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    desc: 'Powered by Razorpay — UPI, cards, net banking. Every transaction encrypted.',
    col: 'col-span-1',
  },
  {
    icon: Lock,
    title: 'Campus-Only Access',
    desc: 'Entry requires a verified college email. Your campus stays private and safe.',
    col: 'col-span-1',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    desc: 'Designed for students on the go. Fast, lightweight, works on any device.',
    col: 'col-span-1',
    wide: true,
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#0c0c0c' }} />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.15), transparent)' }} />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="section-label mb-5">Everything you need</div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Everything You Need <span className="gradient-text">in One App</span>
          </h2>
          <p className="mt-4 text-[#555] text-lg max-w-xl mx-auto">
            A complete marketplace built from the ground up for campus life.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="card-hover group relative rounded-2xl p-7 overflow-hidden"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle at top right, rgba(0,255,157,0.1), transparent)' }} />

                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.12)' }}>
                  <Icon size={22} className="text-[#00FF9D]" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-[#555] text-sm leading-relaxed">{f.desc}</p>

                {/* Bottom glow line */}
                <div className="absolute bottom-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.5), transparent)' }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
