"use client"

import { useState, useEffect } from 'react';

interface UseLocalStorageOptions<T> {
  key: string;
  defaultValue: T;
}

export function useLocalStorage<T>({ key, defaultValue }: UseLocalStorageOptions<T>) {
  // Initialize state with a function to avoid localStorage access during SSR
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Initialize localStorage on first client render
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        window.localStorage.setItem(key, JSON.stringify(defaultValue));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Update localStorage when value changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error updating localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}