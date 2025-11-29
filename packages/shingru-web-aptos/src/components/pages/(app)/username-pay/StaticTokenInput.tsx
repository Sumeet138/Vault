import { WalletIcon } from "lucide-react";
import { formatUiNumber } from "@/utils/formatting";
import TokenAvatar from "../../../common/TokenAvatar";

interface StaticTokenInputProps {
  amount: string;
  token: {
    symbol: string;
    imageUrl?: string | null;
    image?: string | null; // Added for compatibility
    name: string;
    decimals: number;
  };
  balance?: number | null;
  isLoadingBalance?: boolean;
}

export default function StaticTokenInput({
  amount,
  token,
  balance,
  isLoadingBalance,
}: StaticTokenInputProps) {
  const logo = token.imageUrl || token.image;

  return (
    <div className="mb-4">
      <div className="w-full rounded-2xl p-4 border border-black/10 shadow-supa-smooth">
        <div className="flex flex-row items-center justify-between gap-4">
          {/* Amount Display */}
          <div className="text-2xl pl-2 font-semibold truncate">
            {amount}
          </div>

          {/* Token Display */}
          <div className="shrink-0 flex items-center gap-2">
            <TokenAvatar imageUrl={logo} symbol={token.symbol} size="sm" />
            <span className="font-semibold text-gray-900 text-md">
              {token.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="flex items-center justify-start mt-1 h-4 pl-2">
        {isLoadingBalance ? (
          <div className="skeleton h-4 w-24 rounded-md" />
        ) : (
          balance !== undefined &&
          balance !== null && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <WalletIcon className="w-3 h-3" />
              {formatUiNumber(balance, token.symbol, {
                maxDecimals: Math.min(4, token.decimals),
                exactDecimals: true,
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
