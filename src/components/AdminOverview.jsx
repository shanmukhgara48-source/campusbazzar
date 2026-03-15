import React from 'react';
import styles from './AdminOverview.module.css';

const STATS = [
  { lbl: 'Total users', val: '1,248', sub: '↑ 42 this week' },
  { lbl: 'Active listings', val: '386', sub: '↑ 18 today' },
  { lbl: 'Trades completed', val: '923', sub: '↑ 7 today' },
  { lbl: 'Flagged items', val: '2', sub: 'Needs review', danger: true },
];

const RECENT = [
  { user: 'Priya R. (CSE)', action: 'New listing', item: 'HP Laptop 15s', time: '2m ago', status: 'Active' },
  { user: 'Arjun S. (ECE)', action: 'Sale completed', item: 'Engg Maths Vol.2', time: '18m ago', status: 'Sold' },
  { user: 'unknown_user91', action: 'New listing', item: 'Cheap iPhone 12', time: '1h ago', status: 'Flagged' },
];

export default function AdminOverview({ onPageChange }) {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Admin overview</h2>
        <p>Platform health and activity</p>
      </div>

      <div className={styles.notif}>
        ⚠ 2 listings flagged for review{' '}
        <button className={styles.notifLink} onClick={() => onPageChange('aflag')}>Review now →</button>
      </div>

      <div className={styles.statsGrid}>
        {STATS.map(s => (
          <div key={s.lbl} className={styles.statCard}>
            <div className={styles.statLbl}>{s.lbl}</div>
            <div className={styles.statVal} style={s.danger ? { color: '#c0392b' } : {}}>{s.val}</div>
            <div className={styles.statSub} style={s.danger ? { color: '#c0392b' } : {}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.secLbl}>Recent activity</div>
      <div className={styles.tblWrap}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '28%' }}>User</th>
              <th style={{ width: '22%' }}>Action</th>
              <th style={{ width: '26%' }}>Item</th>
              <th style={{ width: '12%' }}>Time</th>
              <th style={{ width: '12%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {RECENT.map((r, i) => (
              <tr key={i}>
                <td>{r.user}</td>
                <td>{r.action}</td>
                <td>{r.item}</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{r.time}</td>
                <td>
                  <span className={`${styles.pill} ${r.status === 'Active' ? styles.pActive : r.status === 'Sold' ? styles.pSold : styles.pFlag}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
