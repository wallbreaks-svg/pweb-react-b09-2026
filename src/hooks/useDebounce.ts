import { useEffect, useState } from "react";

/**
 * Custom hook untuk menunda pembaruan nilai hingga delay waktu tertentu terlewati.
 * Sangat berguna untuk input pencarian agar tidak memicu filter/fetch pada setiap ketikan tombol.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Buat timer untuk mengupdate debouncedValue setelah delay milidetik
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bersihkan timer sebelumnya jika value atau delay berubah sebelum timer selesai
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
