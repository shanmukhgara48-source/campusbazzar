'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: 1000, suffix: '+', label: 'Students on Waitlist', prefix: '' },
  { value: 500, suffix: '+', label: 'Campus Listings', prefix: '' },
  { value: 100, suffix: '%', label: 'Campus Verified', prefix: '' },
  { value: 4.9, suffix: '★', label: 'Average Rating', prefix: '' },
];

function CountUp({ target, suffix, prefix, duration = 1800 }: { target: number; suffix: string; prefix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const isDecimal = target % 1 !== 0;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = isDecimal
              ? parseFloat((eased * target).toFixed(1))
              : Math.round(eased * target);
            setCount(current);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <section className="relative py-0">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-7xl mx-auto px-6"
      >
        <div
          className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x-0 lg:divide-x"
          style={{
            background: '#111',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center justify-center py-10 px-6 text-center relative ${
                i < stats.length - 1 ? 'border-b lg:border-b-0 lg:border-r border-white/[0.06]' : ''
              }`}
            >
              <div className="text-4xl font-black text-white mb-1 tabular-nums">
                <CountUp target={s.value} suffix={s.suffix} prefix={s.prefix} />
              </div>
              <div className="text-sm text-[#555] font-medium">{s.label}</div>
              {/* Subtle green glow on numbers */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.5), transparent)' }} />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
