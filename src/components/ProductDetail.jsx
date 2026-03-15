import React, { useState } from 'react';
import styles from './ProductDetail.module.css';
import { useMarketplace } from '../MarketplaceContext';

export default function ProductDetail({ onMessageSeller, onOpenSeller }) {
  const { selectedListing, addToCart, toggleWishlist, wishlist } = useMarketplace();
  const [activeImage, setActiveImage] = useState(
    selectedListing?.images?.[0] || null,
  );

  if (!selectedListing) {
    return <div className={styles.empty}>Select a product from Browse to see details.</div>;
  }

  const isSaved = wishlist.includes(selectedListing.id);

  const images = selectedListing.images && selectedListing.images.length
    ? selectedListing.images
    : [selectedListing.ico];

  const handleAddToCart = () => addToCart(selectedListing.id);
  const handleToggleWishlist = () => toggleWishlist(selectedListing.id);

  return (
    <div className={styles.wrap}>
      <div className={styles.main}>
        <div className={styles.gallery}>
          <div className={styles.mainImg}>
            {activeImage ? (
              <span className={styles.mainEmoji}>{activeImage}</span>
            ) : (
              <span className={styles.mainEmoji}>{selectedListing.ico}</span>
            )}
          </div>
          <div className={styles.thumbs}>
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.thumb} ${img === activeImage ? styles.thumbOn : ''}`}
                onClick={() => setActiveImage(img)}
              >
                <span className={styles.thumbEmoji}>{img}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <h2 className={styles.title}>{selectedListing.t}</h2>
          <div className={styles.priceRow}>
            <span className={styles.price}>{selectedListing.price}</span>
            <span className={`${styles.cond} ${selectedListing.cond === 'Good' ? styles.good : styles.fair}`}>
              {selectedListing.cond}
            </span>
          </div>
          <div className={styles.meta}>
            <span>{selectedListing.cat}</span>
            {selectedListing.dept && <span>· {selectedListing.dept}</span>}
          </div>
          {selectedListing.rating && (
            <div className={styles.ratingRow}>
              <span className={styles.stars}>★</span>
              <span className={styles.ratingValue}>{selectedListing.rating.toFixed(1)}</span>
              <span className={styles.reviewCount}>({selectedListing.reviews} reviews)</span>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={handleAddToCart}>
              Add to cart
            </button>
            <button type="button" className={styles.secondary} onClick={onMessageSeller}>
              Message seller
            </button>
            <button type="button" className={styles.secondary} onClick={handleToggleWishlist}>
              {isSaved ? 'Saved' : 'Save item'}
            </button>
          </div>

          <div className={styles.sellerBox}>
            <div className={styles.sellerAvatar}>{selectedListing.seller?.[0] || 'S'}</div>
            <div className={styles.sellerInfo}>
              <div className={styles.sellerName}>{selectedListing.seller}</div>
              {selectedListing.dept && <div className={styles.sellerDept}>{selectedListing.dept}</div>}
            </div>
            <button type="button" className={styles.linkBtn} onClick={onOpenSeller}>
              View seller profile
            </button>
          </div>
        </div>
      </div>

      <div className={styles.descSection}>
        <h3>Description</h3>
        <p>{selectedListing.description || 'No additional description provided.'}</p>
      </div>
    </div>
  );
}

