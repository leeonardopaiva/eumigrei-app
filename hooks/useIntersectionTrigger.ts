'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseIntersectionTriggerOptions = {
  enabled?: boolean;
  rootMargin?: string;
};

export function useIntersectionTrigger(
  onIntersect: () => void,
  { enabled = true, rootMargin = '0px 0px 240px 0px' }: UseIntersectionTriggerOptions = {},
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbackRef = useRef(onIntersect);
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    callbackRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    if (!enabled || !target || typeof IntersectionObserver === 'undefined') {
      return;
    }

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current();
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    observerRef.current.observe(target);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [enabled, rootMargin, target]);

  return useCallback((node: Element | null) => {
    setTarget(node);
  }, []);
}
