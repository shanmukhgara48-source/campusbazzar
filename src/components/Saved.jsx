import React from 'react';
import styles from './Saved.module.css';
import { useMarketplace } from '../MarketplaceContext';

export default function Saved() {
  const { wishlistItems } = useMarketplace();
  const saved = wishlistItems;
  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Saved items</h2>
        <p>Items you bookmarked</p>
      </div>
      <div className={styles.grid}>
        {saved.map(item => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardImg}><span style={{ fontSize: 38 }}>{item.ico}</span></div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{item.t}</div>
              <div className={styles.cardMeta}>{item.seller} · {item.dept}</div>
              {item.rating && (
                <div className={styles.cardRating}>
                  <span className={styles.stars}>★</span>
                  <span className={styles.ratingValue}>{item.rating.toFixed(1)}</span>
                  <span className={styles.reviewCount}>({item.reviews} reviews)</span>
                </div>
              )}
              <div className={styles.cardFoot}>
                <span className={styles.price}>{item.price}</span>
                <span className={`${styles.cond} ${item.cond === 'Good' ? styles.good : styles.fair}`}>{item.cond}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
