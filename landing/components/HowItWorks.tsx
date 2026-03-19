'use client';

import { motion } from 'framer-motion';
import { Mail, Search, MessageSquare, CheckCircle2 } from 'lucide-react';

const steps = [
  { n: '01', icon: Mail, title: 'Sign up with college email', desc: 'Register with your official college email. Campus affiliation verified instantly.' },
  { n: '02', icon: Search, title: 'Post or browse listings', desc: 'List your items in seconds or scroll through hundreds of campus listings.' },
  { n: '03', icon: MessageSquare, title: 'Chat with buyers or sellers', desc: 'Real-time messaging to negotiate, ask questions, and plan the meetup.' },
  { n: '04', icon: CheckCircle2, title: 'Meet safely & transact', desc: 'Choose a safe campus spot. Pay securely via Razorpay. Rate the experience.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.15), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.15), transparent)' }} />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="section-label mb-5">Simple process</div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="mt-4 text-[#555] text-lg">Get started in minutes. Four simple steps.</p>
        </motion.div>

        <div className="relative">
          {/* Connector (desktop) */}
          <div className="hidden lg:block absolute top-[28px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.4 }}
              className="h-full origin-left"
              style={{
                background: 'linear-gradient(90deg, rgba(0,255,157,0.6), rgba(0,255,157,0.1), rgba(0,255,157,0.6))',
              }}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                  className="relative text-center group"
                >
                  <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300"
                    style={{ background: 'rgba(0,255,157,0.07)', border: '1px solid rgba(0,255,157,0.2)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,255,157,0.3)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <Icon size={24} className="text-[#00FF9D]" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                      style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,157,0.3)', color: '#00FF9D' }}>
                      {i + 1}
                    </div>
                  </div>
                  <div className="text-[10px] font-black tracking-[0.2em] font-mono text-[#2a2a2a] mb-2">{step.n}</div>
                  <h3 className="text-white font-bold text-base mb-2 leading-snug">{step.title}</h3>
                  <p className="text-[#555] text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
