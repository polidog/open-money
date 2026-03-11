"use client";

import { useState, useEffect, useRef } from "react";

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const isInitialized = useRef(false);

  // Restore from localStorage after hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setState(JSON.parse(stored) as T);
      }
    } catch {
      // ignore
    }
    isInitialized.current = true;
  }, [key]);

  // Persist to localStorage on changes (skip the initial restore)
  useEffect(() => {
    if (!isInitialized.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [key, state]);

  return [state, setState];
}
