import { useMemo, useState } from "react";
import { cnm } from "@/utils/style";
import Image from "next/image";
import { getChainLogo } from "../../utils/misc";
import { SupportedChain } from "@/config/chains";

export interface TokenAvatarProps {
  imageUrl?: string | null;
  symbol: string;
  size?: "sm" | "smd" | "md" | "lg";
  variant?: "default" | "primary";
  isNative?: boolean;
  isVerified?: boolean;
  className?: string;
  chain?: SupportedChain;
  isShowChain?: boolean;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  smd: "w-8 h-8 text-sm",
  md: "size-9 md:size-10 text-sm md:text-base",
  lg: "w-14 h-14 text-xl",
};

const variantClasses = {
  default: "bg-gray-200 text-gray-600",
  primary: "bg-primary/10 text-primary",
};

export default function TokenAvatar({
  imageUrl,
  symbol,
  size = "md",
  variant = "default",
  isNative = false,
  isVerified = false,
  chain,
  className,
}: TokenAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = useMemo(() => {
    return symbol?.slice(0, 2).toUpperCase() || "";
  }, [symbol]);

  const showFallback = !imageUrl || imageError;

  return (
    <div className={cnm("relative inline-block", className)}>
      <div
        className={cnm(
          "rounded-full flex items-center justify-center overflow-hidden",
          sizeClasses[size],
          showFallback && variantClasses[variant]
        )}
      >
        {!showFallback ? (
          <img
            src={imageUrl!}
            alt={symbol}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-medium">{initials}</span>
        )}
      </div>

      {/* {chain && !isNative && (
        <div className="absolute -bottom-1.5 -right-1.5 rounded-full border-2 border-white bg-white overflow-hidden">
          <Image
            src={getChainLogo(chain, true) || ""}
            alt={chain}
            width={14}
            height={14}
            className="w-5 h-5 object-cover"
          />
        </div>
      )} */}
    </div>
  );
}
