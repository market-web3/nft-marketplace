'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Toaster } from 'react-hot-toast';
import { WebSocketProvider } from '@/hooks/useWebSocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const tonConnectManifest = {
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
  name: 'NFT Marketplace',
  iconUrl: process.env.NEXT_PUBLIC_APP_URL + '/icon.png',
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TonConnectUIProvider manifestUrl={tonConnectManifest}>
          <WebSocketProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
          </WebSocketProvider>
        </TonConnectUIProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
