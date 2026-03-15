import React from 'react';
import styles from './Topbar.module.css';

export default function Topbar({ role, onPageChange }) {
  return (
    <div className={styles.topbar}>
      <div className={styles.searchBar}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#a8a8a8" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="#a8a8a8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input type="text" placeholder="Search books, laptops, calculators…" />
      </div>
      <button
        className={styles.iconBtn}
        type="button"
        title="Notifications"
        onClick={() => onPageChange && onPageChange('notifications')}
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M9 3a3 3 0 00-3 3v2.5L5 10l-1 1h10l-1-1-.999-.5V6a3 3 0 00-3-3z" stroke="#4b4b4b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 14.5a1.5 1.5 0 003 0" stroke="#4b4b4b" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <div className={styles.verifiedBadge}>
        <svg width="11" height="11" viewBox="0 0 12 12">
          <path d="M10 3L5 9 2 6" stroke="#1a5c3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        Verified student
      </div>
      <button
        className={styles.actionBtn}
        onClick={() => role === 'seller' ? onPageChange('list') : null}
      >
        {role === 'admin' ? 'Export CSV' : '+ List item'}
      </button>
    </div>
  );
}
