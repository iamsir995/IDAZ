import { useState, useEffect } from "react";

/**
 * Custom Hook cho Debounce giá trị input (mặc định 500ms)
 * @param {*} value - Giá trị cần debounce
 * @param {number} delay - Thời gian trễ ms
 * @returns {*}
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
