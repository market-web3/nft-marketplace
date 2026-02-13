'use client';

import { ReactNode } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ThemeProvider } from './providers/ThemeProvider';
import { QueryProvider } from './providers/QueryProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TonConnectUIProvider 
      manifestUrl="https://your-domain.com/tonconnect-manifest.json"
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/your_bot',
      }}
    >
      <QueryProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryProvider>
    </TonConnectUIProvider>
  );
}
