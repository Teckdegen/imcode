
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Umi Network configuration
const umiNetwork = {
  id: 4090, // Umi chain ID
  name: 'Umi Network',
  nativeCurrency: {
    decimals: 18,
    name: 'UMI',
    symbol: 'UMI',
  },
  rpcUrls: {
    default: {
      http: ['https://devnet.moved.network'],
    },
    public: {
      http: ['https://devnet.moved.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Umi Explorer',
      url: 'https://explorer.devnet.moved.network',
    },
  },
  testnet: true,
};

const config = getDefaultConfig({
  appName: 'ImCode Blue & Black',
  projectId: 'imcode-blue-black-dapp', // You should replace this with your actual WalletConnect project ID
  chains: [umiNetwork as any],
  ssr: false,
});

const queryClient = new QueryClient();

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#3B82F6',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
