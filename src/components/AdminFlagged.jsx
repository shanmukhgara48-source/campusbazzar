import React, { useState } from 'react';
import styles from './AdminFlagged.module.css';
import { FLAGGED_ITEMS } from '../data';

export default function AdminFlagged() {
  const [items, setItems] = useState(FLAGGED_ITEMS);

  const remove = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const approve = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Flagged items</h2>
        <p>Review and moderate suspicious listings</p>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <span style={{ fontSize: 32 }}>✅</span>
          <p style={{ fontWeight: 600, marginTop: 12 }}>All clear!</p>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>No flagged items to review.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((f, i) => (
            <div key={i} className={styles.row}>
              <div className={styles.rowIcon}><span style={{ fontSize: 22 }}>{f.ico}</span></div>
              <div className={styles.rowInfo}>
                <div className={styles.rowTitle}>{f.t}</div>
                <div className={styles.rowMeta}>Seller: {f.seller}</div>
                <div className={styles.rowReason}>⚠ {f.reason}</div>
              </div>
              <div className={styles.rowPrice}>{f.price}</div>
              <div className={styles.rowActions}>
                <button className={`${styles.abtn} ${styles.abtnApprove}`} onClick={() => approve(i)}>Approve</button>
                <button className={`${styles.abtn} ${styles.abtnRemove}`} onClick={() => remove(i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
