'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: "What's New?", href: '#trust' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-400 ${
          scrolled ? 'bg-[#0a0a0a]/85 backdrop-blur-xl border-b border-white/[0.05]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg bg-[#00FF9D] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
              style={{ boxShadow: '0 0 16px rgba(0,255,157,0.45)' }}
            >
              <span className="text-[#0a0a0a] text-xs font-black">CB</span>
            </div>
            <span className="font-bold text-base tracking-tight">
              Campus<span className="gradient-text">Bazaar</span>
            </span>
          </a>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[#888] hover:text-white text-sm font-medium transition-colors duration-200 relative group"
              >
                {l.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#00FF9D] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#cta" className="neon-btn px-5 py-2 rounded-xl text-sm">
              Explore Now
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden w-9 h-9 rounded-xl glass flex items-center justify-center"
          >
            {open ? <X size={17} className="text-[#00FF9D]" /> : <Menu size={17} className="text-white" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.05] md:hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-3">
              {links.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)}
                  className="text-[#888] hover:text-white text-base py-1.5 transition-colors">
                  {l.label}
                </a>
              ))}
              <a href="#cta" onClick={() => setOpen(false)}
                className="neon-btn px-5 py-3 rounded-xl text-sm text-center mt-2">
                Explore Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
