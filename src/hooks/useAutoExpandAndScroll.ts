import { useEffect, useRef } from 'react';

/**
 * useAutoExpandAndScroll - One-time smooth scroll to target element
 * 
 * Prevents repeated scrolling and scroll anchoring conflicts.
 * Only scrolls once per ideaId, after layout settles.
 * 
 * @param targetEl - The DOM element to scroll to
 * @param ideaId - Unique identifier to track if we've already scrolled
 */
export function useAutoExpandAndScroll(
  targetEl: HTMLElement | null,
  ideaId?: string
) {
  const lastScrolledIdRef = useRef<string | null>(null);
  const initialScrollYRef = useRef<number | null>(null);

  useEffect(() => {
    // Only proceed if we have both a target and an ideaId
    if (!targetEl || !ideaId) return;

    // Skip if we've already scrolled to this idea
    if (lastScrolledIdRef.current === ideaId) return;

    // Record initial scroll position
    if (initialScrollYRef.current === null) {
      initialScrollYRef.current = window.scrollY;
    }

    // Check if user has already scrolled (within 600ms window)
    const timeoutId = setTimeout(() => {
      // If user scrolled more than 10px, don't auto-scroll
      if (
        initialScrollYRef.current !== null &&
        Math.abs(window.scrollY - initialScrollYRef.current) > 10
      ) {
        console.log('[AutoScroll] User already scrolled, skipping auto-scroll');
        lastScrolledIdRef.current = ideaId; // Mark as done to prevent future attempts
        return;
      }

      // Double requestAnimationFrame to ensure layout has settled
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            targetEl.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            lastScrolledIdRef.current = ideaId;
            console.log('[AutoScroll] Scrolled to idea:', ideaId);
          } catch (error) {
            console.warn('[AutoScroll] Failed to scroll:', error);
          }
        });
      });
    }, 100); // Small delay to let expansion animation start

    return () => clearTimeout(timeoutId);
  }, [targetEl, ideaId]);
}





