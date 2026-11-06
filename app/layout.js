import { Hind_Vadodara, Hind, Rasa, Baloo_Bhai_2, Baloo_2 } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import ServiceWorker from '@/components/ServiceWorker';
import './globals.css';

// Hind Vadodara is designed for Gujarati (with matching Latin); Rasa gives headings a traditional feel
const body = Hind_Vadodara({ subsets: ['gujarati', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
// Rounded, friendly Gujarati face for the student app's clay style
const clay = Baloo_Bhai_2({ subsets: ['gujarati', 'latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-clay', display: 'swap' });
const display = Rasa({ subsets: ['gujarati', 'latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });
// Hindi (Devanagari) versions of the same two faces; the browser picks them only for Hindi letters
const bodyDeva = Hind({ subsets: ['devanagari'], weight: ['400', '500', '600', '700'], variable: '--font-body-deva', display: 'swap', preload: false });
const clayDeva = Baloo_2({ subsets: ['devanagari'], weight: ['400', '500', '600', '700', '800'], variable: '--font-clay-deva', display: 'swap', preload: false });

export const metadata = {
  title: 'Jain Pathshala Portal',
  description: 'Jain Pathshala Portal - Track attendance, submit gatha progress, and view analytics for Jain learning sessions.',
  manifest: '/manifest.json',
  applicationName: 'Jain Pathshala',
  icons: { icon: [{ url: '/favicon.ico' }, { url: '/icon-192.png', type: 'image/png' }], apple: '/apple-touch-icon.png' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ff8418',
};

export default function RootLayout({ children }) {
  return (
    <html lang="gu" className={`${body.variable} ${display.variable} ${clay.variable} ${bodyDeva.variable} ${clayDeva.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {/* Vercel Web Analytics: page views only (no cookies); shows in Vercel → Analytics */}
        <Analytics />
        <ServiceWorker />
      </body>
    </html>
  );
}
