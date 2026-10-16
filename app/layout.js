import { Hind_Vadodara, Rasa, Baloo_Bhai_2 } from 'next/font/google';
import './globals.css';

// Hind Vadodara is designed for Gujarati (with matching Latin); Rasa gives headings a traditional feel
const body = Hind_Vadodara({ subsets: ['gujarati', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
// Rounded, friendly Gujarati face for the student app's clay style
const clay = Baloo_Bhai_2({ subsets: ['gujarati', 'latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-clay', display: 'swap' });
const display = Rasa({ subsets: ['gujarati', 'latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });

export const metadata = {
  title: 'Jain Pathshala Portal',
  description: 'Jain Pathshala Portal - Track attendance, submit gatha progress, and view analytics for Jain learning sessions.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/logo192.png' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#d9600f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="gu" className={`${body.variable} ${display.variable} ${clay.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
