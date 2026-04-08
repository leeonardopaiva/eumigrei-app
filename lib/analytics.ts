export type TrackAnalyticsPayload = {
  type: 'disabled_feature_click' | 'banner_click';
  targetType: 'feature' | 'banner';
  targetKey: string;
  label: string;
  sourcePath?: string;
  sourceSection?: string;
  regionKey?: string | null;
};

export const trackAnalyticsEvent = (payload: TrackAnalyticsPayload) => {
  if (typeof window === 'undefined') {
    return;
  }

  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/track', blob);
    return;
  }

  void fetch('/api/analytics/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => undefined);
};
