import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NexusOne GeoCore | Intelligence Platform',
  description: 'Domain-agnostic geospatial intelligence platform with ML-powered insights',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body 
        className={`${inter.className} bg-black text-white overflow-hidden`}
        suppressHydrationWarning={true}
      >
        <ServiceWorkerProvider>
          {children}
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}