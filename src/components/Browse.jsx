import React, { useState } from 'react';
import styles from './Browse.module.css';
import { useMarketplace } from '../MarketplaceContext';

const CATEGORIES = ['All', 'Books', 'Laptops', 'Calculators', 'Other'];

export default function Browse() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { listings, setSelectedListingId, addToCart, toggleWishlist, wishlist } = useMarketplace();

  const filtered = activeFilter === 'All'
    ? listings
    : listings.filter(l => l.cat === activeFilter);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Browse listings</h2>
        <p>Items from verified students at your college</p>
      </div>

      <div className={styles.chips}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`${styles.chip} ${activeFilter === cat ? styles.on : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtered.map(item => (
          <div
            key={item.id}
            className={styles.card}
            onClick={() => setSelectedListingId(item.id)}
          >
            <div className={styles.cardImg}>
              <span style={{ fontSize: 38 }}>{item.ico}</span>
            </div>
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
                <div className={styles.footRight}>
                  <span className={`${styles.cond} ${item.cond === 'Good' ? styles.good : styles.fair}`}>
                    {item.cond}
                  </span>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={(e) => { e.stopPropagation(); addToCart(item.id); }}
                    title="Add to cart"
                  >
                    🛒
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(item.id); }}
                    title="Save item"
                  >
                    {wishlist.includes(item.id) ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
