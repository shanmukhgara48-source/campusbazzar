import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSavedItems, saveItem, unsaveItem } from '../services/savedItemsService';

interface FavouritesContextValue {
  savedIds: Set<string>;
  isFavourite: (id: string) => boolean;
  toggle: (listingId: string) => Promise<void>;
  loading: boolean;
}

const FavouritesContext = createContext<FavouritesContextValue>({
  savedIds:    new Set(),
  isFavourite: () => false,
  toggle:      async () => {},
  loading:     false,
});

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { savedIds, loading } = useSavedItems(user?.uid);

  const isFavourite = (id: string) => savedIds.has(id);

  const toggle = async (listingId: string) => {
    if (!user?.uid) return;
    if (savedIds.has(listingId)) {
      await unsaveItem(user.uid, listingId);
    } else {
      await saveItem(user.uid, listingId);
    }
  };

  return (
    <FavouritesContext.Provider value={{ savedIds, isFavourite, toggle, loading }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}
