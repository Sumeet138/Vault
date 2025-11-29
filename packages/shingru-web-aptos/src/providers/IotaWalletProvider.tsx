"use client";

import { createNetworkConfig, IotaClientProvider, WalletProvider } from '@aptos/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from "react";
import { isTestnet, CHAINS } from "@/config/chains";

// Config options for APTOS networks
const { networkConfig } = createNetworkConfig({
  iotaTestnet: {
    url: CHAINS.IOTA_TESTNET.rpcUrl
  },
  iotaMainnet: {
    url: CHAINS.IOTA_MAINNET.rpcUrl
  },
});

const queryClient = new QueryClient();

export const AptosWalletProvider = ({ children }: PropsWithChildren) => {
  const defaultNetwork = isTestnet ? "iotaTestnet" : "iotaMainnet";

  return (
    <QueryClientProvider client={queryClient}>
      <IotaClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
        <WalletProvider autoConnect={false}>
          {children}
        </WalletProvider>
      </IotaClientProvider>
    </QueryClientProvider>
  );
};
