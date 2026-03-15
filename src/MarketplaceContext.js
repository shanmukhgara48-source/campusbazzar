import React, { createContext, useContext, useMemo, useState } from 'react';
import { LISTINGS as BASE_LISTINGS } from './data';

const MarketplaceContext = createContext(null);

export function MarketplaceProvider({ children }) {
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const listings = BASE_LISTINGS;

  const selectedListing = useMemo(
    () => listings.find(l => l.id === selectedListingId) || null,
    [selectedListingId, listings],
  );

  const cartItems = useMemo(
    () => cart.map(id => listings.find(l => l.id === id)).filter(Boolean),
    [cart, listings],
  );

  const wishlistItems = useMemo(
    () => wishlist.map(id => listings.find(l => l.id === id)).filter(Boolean),
    [wishlist, listings],
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => {
      if (!item) return sum;
      const numeric = Number(String(item.price).replace(/[^\d]/g, ''));
      return sum + (Number.isNaN(numeric) ? 0 : numeric);
    }, 0),
    [cartItems],
  );

  const addToCart = (id) => {
    setCart(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(x => x !== id));
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const value = {
    listings,
    selectedListingId,
    selectedListing,
    setSelectedListingId,
    cart,
    cartItems,
    cartTotal,
    addToCart,
    removeFromCart,
    wishlist,
    wishlistItems,
    toggleWishlist,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error('useMarketplace must be used within MarketplaceProvider');
  return ctx;
}

