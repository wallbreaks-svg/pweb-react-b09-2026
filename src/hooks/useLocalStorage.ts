import { useEffect, useState } from "react";

/**
 * Custom hook untuk sinkronisasi state React dengan browser localStorage.
 * Memakai lazy initial state untuk membaca nilai awal secara efisien (hanya saat mount).
 * Setter mendukung nilai langsung maupun updater function (T | ((prev: T) => T)).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy initial state: baca dari localStorage sekali saat pertama kali di-mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return JSON.parse(item) as T;
    } catch (error: unknown) {
      console.error(`Gagal membaca "${key}" dari localStorage:`, error);
      return initialValue;
    }
  });

  // Sinkronisasi otomatis ke localStorage setiap kali storedValue atau key berubah
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error: unknown) {
      console.error(`Gagal menulis "${key}" ke localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
