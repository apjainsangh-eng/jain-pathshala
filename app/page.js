'use client';

import dynamic from 'next/dynamic';

// The app reads localStorage and other browser APIs during render, so it runs client-side only.
const App = dynamic(() => import('@/components/App'), { ssr: false });

export default function Page() {
  return <App />;
}
