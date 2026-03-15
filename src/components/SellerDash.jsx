import React from 'react';
import styles from './SellerDash.module.css';
import { SELLER_LISTINGS } from '../data';

const STATS = [
  { lbl: 'Active listings', val: '4', sub: '↑ 1 this week' },
  { lbl: 'Items sold', val: '11', sub: '↑ 3 this month' },
  { lbl: 'Total earned', val: '₹8.4k', sub: '↑ ₹2.1k this month' },
  { lbl: 'Avg response', val: '12m', sub: 'Faster than avg' },
];

export default function SellerDash() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Seller dashboard</h2>
        <p>Track your listings and earnings</p>
      </div>

      <div className={styles.statsGrid}>
        {STATS.map(s => (
          <div key={s.lbl} className={styles.statCard}>
            <div className={styles.statLbl}>{s.lbl}</div>
            <div className={styles.statVal}>{s.val}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.secLbl}>Active listings</div>
      <div className={styles.myList}>
        {SELLER_LISTINGS.map((l, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.rowIcon}><span style={{ fontSize: 22 }}>{l.ico}</span></div>
            <div className={styles.rowInfo}>
              <div className={styles.rowTitle}>{l.t}</div>
              <div className={styles.rowMeta}>
                {l.views} · {l.msgs}
                {l.rating && (
                  <>
                    {' · '}
                    <span className={styles.rowStars}>★</span>
                    <span className={styles.rowRating}>{l.rating.toFixed(1)}</span>
                    <span className={styles.rowReviews}>({l.reviews} reviews)</span>
                  </>
                )}
              </div>
            </div>
            <div className={styles.rowRight}>
              <div className={styles.rowPrice}>{l.price}</div>
              <span className={`${styles.pill} ${l.status === 'Active' ? styles.pActive : styles.pPending}`}>{l.status}</span>
            </div>
            <div className={styles.rowActions}>
              <button className={styles.abtn}>Edit</button>
              <button className={`${styles.abtn} ${styles.abtnR}`}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
