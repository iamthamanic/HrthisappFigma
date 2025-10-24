import { useRef, useCallback, useEffect } from 'react';

/**
 * useThrottle Hook
 * ================
 * Throttles function calls to max once per delay period
 * Essential for performance-critical operations like wheel/mousemove events
 * 
 * Performance Impact: Reduces event handler calls from 60+ per second to configurable rate
 * Use Cases: Zoom, Pan, Scroll, Mousemove during drag
 * 
 * @param callback - Function to throttle
 * @param delay - Minimum time between calls in milliseconds (default: 16ms = ~60fps)
 * @returns Throttled version of callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 16
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRan.current;

    if (timeSinceLastRun >= delay) {
      callback(...args);
      lastRan.current = now;
    } else {
      // Schedule call for later if not executed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRan.current = Date.now();
      }, delay - timeSinceLastRun);
    }
  }, [callback, delay]) as T;
}

/**
 * useRAF Hook (requestAnimationFrame)
 * ====================================
 * Uses requestAnimationFrame for smooth 60fps animations
 * Better than setTimeout for visual updates
 * 
 * @param callback - Function to call on each frame
 * @returns Function to trigger RAF update
 */
export function useRAF<T extends (...args: any[]) => any>(
  callback: T
): T {
  const rafRef = useRef<number>();
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      callbackRef.current(...args);
    });
  }, []) as T;
}
