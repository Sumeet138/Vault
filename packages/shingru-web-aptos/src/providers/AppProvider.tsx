import { AuthProvider } from "@/providers/AuthProvider";
import { AptosWalletProvider } from "./AptosWalletProvider";
import { PropsWithChildren } from "react";
import UserProvider from "./UserProvider";
import { MetaKeysProvider } from "./MetaKeysProvider";

export default function AppProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletProvider>
      <AuthProvider>
        <MetaKeysProvider>
          <UserProvider>
            <div>{children}</div>
          </UserProvider>
        </MetaKeysProvider>
      </AuthProvider>
    </AptosWalletProvider>
  );
}
