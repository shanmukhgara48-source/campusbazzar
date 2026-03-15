import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import { NAV_CONFIG } from '../data';

const ROLES = ['buyer', 'seller', 'admin'];

export default function Sidebar({ role, page, onRoleChange, onPageChange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`${styles.sidebar} ${expanded ? styles.expanded : ''}`}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className={styles.sbTop}>
        <div
          className={styles.sbToggle}
          onClick={() => setExpanded(v => !v)}
          title="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="16" height="2" rx="1" fill="rgba(255,255,255,0.75)" />
            <rect x="2" y="9" width="16" height="2" rx="1" fill="rgba(255,255,255,0.75)" />
            <rect x="2" y="14" width="16" height="2" rx="1" fill="rgba(255,255,255,0.75)" />
          </svg>
        </div>
        <div className={styles.logoText}>
          <h1>CampusBazaar</h1>
          <p>Student marketplace</p>
        </div>
      </div>

      {expanded && (
        <div className={styles.sbRoles}>
          {ROLES.map(r => (
            <button
              key={r}
              className={`${styles.rtab} ${role === r ? styles.rtabOn : ''}`}
              onClick={() => onRoleChange(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}

      <nav className={styles.sbNav}>
        {NAV_CONFIG[role].map(item => (
          <div
            key={item.id}
            className={`${styles.ni} ${page === item.id ? styles.niOn : ''}`}
            onClick={() => onPageChange(item.id)}
            title={!expanded ? item.lbl : undefined}
          >
            <div className={styles.niIcoWrap}>
              <NavIcon id={item.id} />
            </div>
            <span className={styles.niLbl}>{item.lbl}</span>
            {item.badge && (
              <span className={styles.nbadge}>{item.badge}</span>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function NavIcon({ id }) {
  const icons = {
    browse: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <path d="M2 9l7-7 7 7v7H12v-4H6v4H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    messages: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <path d="M15 2H3a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    saved: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <path d="M4 2h10a1 1 0 011 1v13l-6-3.5L3 16V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    sdash: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    list: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5v8M5 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    mylist: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <path d="M3 4h12M3 9h12M3 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    aoverview: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <path d="M2 13l4-4 3 3 4-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    alist: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 6h8M5 9h8M5 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    ausers: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 16c0-3 2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 8a2 2 0 100-4M16 16c0-2-1-3.5-3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    aflag: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <path d="M4 2v14M4 2h9l-2 4 2 4H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    notifications: (
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <path d="M9 3a3 3 0 00-3 3v2.5L5 10l-1 1h10l-1-1-.999-.5V6a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 14.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };
  return icons[id] || icons['browse'];
}
