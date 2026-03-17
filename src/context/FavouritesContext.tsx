import React, {
  createContext, useContext, useEffect, useReducer, ReactNode,
} from 'react';
import { Listing } from '../types';
import * as storageService from '../services/storageService';

interface FavouritesState {
  ids:      Set<string>;
  listings: Listing[];
}

type Action =
  | { type: 'LOAD';   ids: string[] }
  | { type: 'ADD';    listing: Listing }
  | { type: 'REMOVE'; listingId: string };

function reducer(state: FavouritesState, action: Action): FavouritesState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, ids: new Set(action.ids) };
    case 'ADD':
      return {
        ids:      new Set([...state.ids, action.listing.id]),
        listings: [...state.listings.filter(l => l.id !== action.listing.id), action.listing],
      };
    case 'REMOVE': {
      const ids = new Set(state.ids);
      ids.delete(action.listingId);
      return { ids, listings: state.listings.filter(l => l.id !== action.listingId) };
    }
    default:
      return state;
  }
}

interface FavouritesContextValue {
  favouriteIds: Set<string>;
  favourites:   Listing[];
  isFavourite:  (id: string) => boolean;
  toggle:       (listing: Listing) => Promise<void>;
}

const FavouritesContext = createContext<FavouritesContextValue>({
  favouriteIds: new Set(),
  favourites:   [],
  isFavourite:  () => false,
  toggle:       async () => {},
});

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ids: new Set<string>(), listings: [] });

  useEffect(() => {
    storageService.getFavourites().then(ids => dispatch({ type: 'LOAD', ids }));
  }, []);

  const isFavourite = (id: string) => state.ids.has(id);

  const toggle = async (listing: Listing) => {
    if (state.ids.has(listing.id)) {
      dispatch({ type: 'REMOVE', listingId: listing.id });
      await storageService.removeFavourite(listing.id);
    } else {
      dispatch({ type: 'ADD', listing });
      await storageService.addFavourite(listing.id);
    }
  };

  return (
    <FavouritesContext.Provider
      value={{ favouriteIds: state.ids, favourites: state.listings, isFavourite, toggle }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}
