import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TON NFT Marketplace - Buy, Sell & Trade NFTs',
  description: 'A premium NFT marketplace built on The Open Network (TON) blockchain. Buy, sell, auction and trade digital collectibles.',
  keywords: ['NFT', 'TON', 'Blockchain', 'Marketplace', 'Crypto', 'Digital Collectibles'],
  openGraph: {
    title: 'TON NFT Marketplace',
    description: 'Premium NFT marketplace on TON blockchain',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TonConnectUIProvider manifestUrl="https://your-domain.com/tonconnect-manifest.json">
          <QueryProvider>
            <ThemeProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 transition-colors duration-300">
                <Navbar />
                <main className="relative">
                  {children}
                </main>
                <Footer />
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
              </div>
            </ThemeProvider>
          </QueryProvider>
        </TonConnectUIProvider>
      </body>
    </html>
  );
}
