"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from "react";

const queryClient = new QueryClient();

// Simple Aptos wallet provider - wallets will be connected directly via window.aptos
// This is a minimal implementation for backend-less operation
export const AptosWalletProvider = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

