import { useState, useEffect, useRef } from 'react';

/**
 * useScrollReveal
 * Hook using IntersectionObserver to trigger entry reveals on scroll.
 * Automatically respects prefers-reduced-motion.
 */
export function useScrollReveal({ threshold = 0.15, rootMargin = '0px', once = true } = {}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // If user prefers reduced motion, reveal immediately without scroll tracking
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsRevealed(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsRevealed(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, isRevealed];
}
