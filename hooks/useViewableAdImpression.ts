'use client';

import { useEffect, useRef } from 'react';

export function useViewableAdImpression(
  bannerId: string,
  placement: 'HOME' | 'FEED',
  matchedBy: string[] = [],
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef(false);
  const matchedByKey = matchedBy.join('|');

  useEffect(() => {
    const element = elementRef.current;
    if (!element || sentRef.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        timer ??= setTimeout(() => {
          sentRef.current = true;
          observer.disconnect();
          void fetch(`/api/banners/${bannerId}/impression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ placement, matchedBy: matchedByKey ? matchedByKey.split('|') : [] }),
            keepalive: true,
          }).catch(() => undefined);
        }, 1_000);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { threshold: [0.5] });

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [bannerId, matchedByKey, placement]);

  return elementRef;
}
