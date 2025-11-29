import { Link } from "@/lib/api/links";
import { PAYMENT_TEMPLATES } from "@/config/templates";
import {
  Wallet,
  Target,
  Package,
  Link as LinkIcon,
  DollarSign,
} from "lucide-react";
import FundraisingProgress from "./FundraisingProgress";

interface FileData {
  id: string;
  type: string;
  category: string | null;
  filename: string;
  size: number;
  contentType: string;
}

interface FilesData {
  thumbnail?: FileData;
  deliverables?: FileData[];
}

type ExtendedLink = {
  files?: FilesData;
  collectedData?: {
    totalUsdValue: number;
    totalPayments: number;
    tokens?: any[];
  };
} & Link;

interface TypeBadgeProps {
  linkData: ExtendedLink;
  variant?: "default" | "detail";
}

function TypeBadge({ linkData, variant = "default" }: TypeBadgeProps) {
  const template = PAYMENT_TEMPLATES.find((t) => t.id === linkData.template);
  const templateName = template?.title || linkData.template;
  const templateColor = template?.color || "#6B7280";

  const getIcon = () => {
    const iconSize = variant === "detail" ? "h-3 w-3" : "h-4 w-4";

    switch (linkData.template) {
      case "simple-payment":
        return <Wallet className={iconSize} />;
      case "digital-product":
        return <Package className={iconSize} />;
      case "fundraiser":
        return <Target className={iconSize} />;
      case "payment-request":
        return <DollarSign className={iconSize} />;
      default:
        return <LinkIcon className={iconSize} />;
    }
  };

  const getDescription = () => {
    // Action-based description
    let actionDesc = "";

    switch (linkData.template) {
      case "simple-payment":
        if (linkData.amountType === "OPEN") {
          actionDesc = "Pay any amount you want";
        } else if (linkData.amountType === "FIXED") {
          actionDesc = "Pay the set amount";
        } else {
          actionDesc = "Complete the payment";
        }
        break;
      case "digital-product":
        const hasDeliverables =
          linkData.files?.deliverables &&
          linkData.files.deliverables.length > 0;
        if (linkData.amountType === "OPEN") {
          actionDesc = hasDeliverables
            ? "Pay any amount and get instant download access"
            : "Pay any amount for this digital product";
        } else if (linkData.amountType === "FIXED") {
          actionDesc = hasDeliverables
            ? "Buy now and get instant download access"
            : "Purchase this digital product";
        } else {
          actionDesc = "Get this digital product for free";
        }
        break;
      case "fundraiser":
        if (linkData.amountType === "OPEN") {
          actionDesc =
            linkData.goalAmount && Number(linkData.goalAmount) > 0
              ? "Contribute any amount to help reach the target"
              : "Contribute any amount to support this initiative";
        } else if (linkData.amountType === "FIXED") {
          actionDesc = "Contribute the suggested amount";
        } else {
          actionDesc = "Support this initiative";
        }
        break;
      case "payment-request":
        if (linkData.amountType === "OPEN") {
          actionDesc = "Pay the amount you owe";
        } else if (linkData.amountType === "FIXED") {
          actionDesc = "Pay the requested amount";
        } else {
          actionDesc = "Complete this payment request";
        }
        break;
      default:
        actionDesc =
          linkData.amountType === "OPEN"
            ? "Pay any amount"
            : "Complete the payment";
    }

    return actionDesc;
  };

  if (variant === "detail") {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-700 shadow-xs"
        title={getDescription()}
      >
        <div
          className="flex size-6 items-center justify-center rounded-full text-[8px] text-white"
          style={{ backgroundColor: templateColor }}
        >
          {getIcon()}
        </div>
        <span className="font-semibold capitalize">{templateName}</span>
        {linkData.amountType !== "OPEN" && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            {linkData.amountType === "FIXED" ? "Fixed" : "Free"}
          </span>
        )}
      </div>
    );
  }

  // Default variant (for pay page)
  return (
    <div className="w-full rounded-lg p-3">
      <div className="flex items-center gap-3">
        {/* Circular icon with colored background */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: templateColor }}
        >
          <div className="w-4 h-4">{getIcon()}</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-gray-900">
              {templateName}
            </h3>
            <div className="px-1.5 py-0.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-full">
              {linkData.amountType === "OPEN"
                ? "Open"
                : linkData.amountType === "FIXED"
                ? "Fixed"
                : "Free"}
            </div>
          </div>
          <p className="text-xs text-gray-600">{getDescription()}</p>
        </div>
      </div>

      {/* Fundraising Progress - only show for fundraiser template */}
      {linkData.template === "fundraiser" && (
        <div className="mt-3">
          <FundraisingProgress
            goalAmount={linkData.goalAmount ? Number(linkData.goalAmount) : null}
            currentAmount={
              linkData.collectedData?.totalUsdValue ||
              linkData.stats?.totalRaised ||
              0
            }
            amountType={linkData.amountType}
          />
        </div>
      )}
    </div>
  );
}

export default TypeBadge;
