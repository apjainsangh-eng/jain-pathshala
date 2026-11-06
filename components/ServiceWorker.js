'use client';

import { useEffect } from 'react';

// Registers public/sw.js, which only shows a friendly page when there is no internet (used by the Android app)
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
