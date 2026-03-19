'use client';

const items = [
  'BUY', '✦', 'SELL', '✦', 'CONNECT', '✦', 'CAMPUS ONLY', '✦',
  'VERIFIED STUDENTS', '✦', 'SAFE TRANSACTIONS', '✦', 'REAL-TIME CHAT', '✦',
  'BUY', '✦', 'SELL', '✦', 'CONNECT', '✦', 'CAMPUS ONLY', '✦',
  'VERIFIED STUDENTS', '✦', 'SAFE TRANSACTIONS', '✦', 'REAL-TIME CHAT', '✦',
];

export default function MarqueeTicker() {
  return (
    <div
      className="relative py-5 overflow-hidden"
      style={{ background: '#0f0f0f', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Left/right fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #0f0f0f, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #0f0f0f, transparent)' }} />

      <div className="flex whitespace-nowrap animate-marquee">
        {items.map((item, i) => (
          <span
            key={i}
            className={`mx-4 text-sm font-bold tracking-wider ${item === '✦' ? 'text-[#00FF9D]' : 'text-[#3a3a3a]'}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
