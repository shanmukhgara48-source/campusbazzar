import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermission,
  sendKeywordMatchNotification,
} from '../services/notificationService';

const STORAGE_KEY = '@cb_watcher_keywords';

interface WatcherContextValue {
  keywords: string[];
  addKeyword: (keyword: string) => Promise<void>;
  removeKeyword: (keyword: string) => Promise<void>;
  checkListing: (listingTitle: string) => Promise<void>;
}

const WatcherContext = createContext<WatcherContextValue | null>(null);

export function WatcherProvider({ children }: { children: React.ReactNode }) {
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setKeywords(JSON.parse(raw));
    });
    requestNotificationPermission();
  }, []);

  const persist = async (updated: string[]) => {
    setKeywords(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addKeyword = useCallback(async (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return;
    setKeywords(prev => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeKeyword = useCallback(async (keyword: string) => {
    const updated = keywords.filter(k => k !== keyword);
    await persist(updated);
  }, [keywords]);

  const checkListing = useCallback(async (listingTitle: string) => {
    const lower = listingTitle.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        await sendKeywordMatchNotification(kw, listingTitle);
        break; // one notification per listing
      }
    }
  }, [keywords]);

  return (
    <WatcherContext.Provider value={{ keywords, addKeyword, removeKeyword, checkListing }}>
      {children}
    </WatcherContext.Provider>
  );
}

export function useWatcher(): WatcherContextValue {
  const ctx = useContext(WatcherContext);
  if (!ctx) throw new Error('useWatcher must be used within WatcherProvider');
  return ctx;
}
