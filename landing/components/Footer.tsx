'use client';

import { Linkedin, Share2, Camera, Code2 } from 'lucide-react';

const cols = {
  Product: ['Features', 'How It Works', 'Pricing', 'Download App'],
  Company: ['About Us', 'Blog', 'Careers', 'Press'],
  Support: ['Help Center', 'Contact', 'Privacy Policy', 'Terms'],
};

const socials = [
  { icon: Share2, label: 'Twitter' },
  { icon: Camera, label: 'Instagram' },
  { icon: Linkedin, label: 'LinkedIn' },
  { icon: Code2, label: 'GitHub' },
];

export default function Footer() {
  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Top */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-14">
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#00FF9D] flex items-center justify-center"
                style={{ boxShadow: '0 0 14px rgba(0,255,157,0.4)' }}>
                <span className="text-[#0a0a0a] text-xs font-black">CB</span>
              </div>
              <span className="font-bold text-lg tracking-tight">
                Campus<span className="gradient-text">Bazaar</span>
              </span>
            </div>
            <p className="text-[#444] text-sm leading-relaxed mb-6 max-w-xs">
              The campus-only verified marketplace. Buy, sell, and connect safely within your college.
            </p>
            {/* Socials */}
            <div className="flex gap-2.5">
              {socials.map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444] transition-all duration-200 hover:text-[#00FF9D]"
                  style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,157,0.25)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(0,255,157,0.15)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(cols).map(([cat, links]) => (
            <div key={cat}>
              <h4 className="text-white font-bold text-sm mb-4">{cat}</h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[#444] hover:text-[#00FF9D] text-sm transition-colors duration-200">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{ background: 'rgba(255,255,255,0.04)' }} />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#333] text-sm">© 2026 CampusBazaar. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" style={{ boxShadow: '0 0 4px #00FF9D' }} />
            <span className="text-[#333] text-xs">Launching June 2026</span>
          </div>
          <div className="flex gap-5">
            {['About', 'Contact', 'Privacy'].map((l) => (
              <a key={l} href="#" className="text-[#333] hover:text-[#00FF9D] text-sm transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
