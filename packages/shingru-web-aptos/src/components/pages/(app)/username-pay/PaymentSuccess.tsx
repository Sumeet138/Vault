import {
  Download,
  ExternalLink,
  Package,
  FileText,
  CheckIcon,
} from "lucide-react";
import { usePay } from "@/providers/PayProvider";
import { getFileUrl, formatFileSize } from "@/utils/file";
import MainButton from "@/components/common/MainButton";
import { motion } from "motion/react";
import { EASE_OUT_QUART } from "@/config/animation";
import { formatUiNumber } from "@/utils/formatting";
import { shortenId, getExplorerTxLink, ExplorerChain } from "@/utils/misc";

export default function PaymentSuccess() {
  const { paymentSuccess, addressData, resetForNewPayment } = usePay();

  if (!paymentSuccess) return null;

  const deliverables = addressData?.linkData?.files?.deliverables || [];
  const hasDeliverables = deliverables.length > 0;

  const handleDownload = async (fileId: string, filename: string, contentType?: string) => {
    const fileUrl = getFileUrl(fileId);

    // Check if file is an image
    const isImage = contentType?.startsWith("image/") || 
                    /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(filename);

    // If it's an image, just open in new tab
    if (isImage) {
      window.open(fileUrl, "_blank");
      return;
    }

    // For non-images, trigger download
    try {
      // Try to fetch the file and create a blob for download
      const response = await fetch(fileUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to fetch file");
      }
    } catch (error) {
      // Fallback: try direct download
      console.log("Blob download failed, trying direct download:", error);
      try {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (directError) {
        // Final fallback: open in new tab
        console.log("Direct download failed, opening in new tab:", directError);
        window.open(fileUrl, "_blank");
      }
    }
  };

  const handleViewTransaction = () => {
    // Use explorerUrl from backend if available, otherwise fallback to building URL
    let url = paymentSuccess.explorerUrl;
    console.log("paymentSuccess", paymentSuccess);

    if (!url) {
      url = getExplorerTxLink(
        paymentSuccess.signature,
        paymentSuccess.sourceChain as ExplorerChain
      );
    }

    window.open(url, "_blank");
  };

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
      className="p-4 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckIcon className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Payment Successful!
      </h2>
      <div className="text-gray-600 mb-4">
        Your payment of{" "}
        <span className="font-bold text-gray-800">
          {formatUiNumber(paymentSuccess.amount, "", { maxDecimals: 4 })}{" "}
          {paymentSuccess.token?.symbol}
        </span>{" "}
        has been sent
      </div>

      {/* Transaction Details */}
      <div className="w-full bg-gray-50 p-3 rounded-lg mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Transaction</span>
          <button
            onClick={handleViewTransaction}
            className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-gray-600"
          >
            {shortenId(paymentSuccess.signature, 3, 3)}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Deliverables Download Section */}
      {hasDeliverables && (
        <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
            <Package className="w-5 h-5 text-gray-500" />
            Your Digital Files
          </div>
          <div className="space-y-3">
            {deliverables.map((file: any, index: number) => (
              <div
                key={file.id || index}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="p-2 bg-white rounded-full border border-gray-200">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {file.filename}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <MainButton
                  onClick={() => handleDownload(file.id, file.filename, file.contentType)}
                  className="flex-shrink-0 !py-2 !px-3"
                >
                  <Download className="w-4 h-4" />
                </MainButton>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full">
        <MainButton
          onClick={resetForNewPayment}
          className="w-full"
          color="gray"
          variant="light"
        >
          Make Another Payment
        </MainButton>
      </div>
    </motion.div>
  );
}
