import React from 'react';
import styles from './Cart.module.css';
import { useMarketplace } from '../MarketplaceContext';

export default function Cart() {
  const { cartItems, cartTotal, removeFromCart } = useMarketplace();

  const formattedTotal = `₹${cartTotal.toLocaleString('en-IN')}`;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Your cart</h2>
        <p>Items you plan to buy</p>
      </div>

      {cartItems.length === 0 ? (
        <p className={styles.empty}>Your cart is empty.</p>
      ) : (
        <>
          <div className={styles.list}>
            {cartItems.map(item => (
              <div key={item.id} className={styles.row}>
                <div className={styles.rowImg}>
                  <span style={{ fontSize: 26 }}>{item.ico}</span>
                </div>
                <div className={styles.rowInfo}>
                  <div className={styles.rowTitle}>{item.t}</div>
                  <div className={styles.rowMeta}>{item.seller} · {item.dept}</div>
                </div>
                <div className={styles.rowPrice}>{item.price}</div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalVal}>{formattedTotal}</span>
            </div>
            <button type="button" className={styles.meetupBtn}>
              Proceed to meet-up confirmation
            </button>
          </div>
        </>
      )}
    </div>
  );
}

