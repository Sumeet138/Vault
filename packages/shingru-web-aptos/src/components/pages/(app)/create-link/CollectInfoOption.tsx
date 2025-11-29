import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT_QUART } from "@/config/animation";
import {
  CheckIcon,
  InboxIcon,
  PaperAirplaneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface CollectInfoOptionProps {
  isOpen: boolean;
  onToggle: () => void;
  collectFields: {
    email: boolean;
    name: boolean;
    telegram: boolean;
  };
  onFieldChange: (
    field: keyof CollectInfoOptionProps["collectFields"],
    value: boolean
  ) => void;
  variant?: "payment" | "digital-product";
  disabled?: boolean;
}

const fieldConfigs = [
  {
    key: "email" as const,
    icon: InboxIcon,
    title: "Email Address",
    description: "Get payer's email for receipts and updates",
  },
  {
    key: "name" as const,
    icon: UserIcon,
    title: "Name",
    description: "Collect payer's name",
  },
  {
    key: "telegram" as const,
    icon: PaperAirplaneIcon,
    title: "Telegram Username",
    description: "Collect payer's Telegram username",
  },
];

const CollectInfoOption = React.memo(function CollectInfoOption({
  isOpen,
  onToggle,
  collectFields,
  onFieldChange,
  variant = "payment",
  disabled = false,
}: CollectInfoOptionProps) {
  return (
    <div className="space-y-4">
      <div>
        {/* Header - Always visible and clickable */}
        <div
          className={`flex items-center justify-between ${
            !disabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          }`}
          onClick={!disabled ? onToggle : undefined}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {variant === "digital-product"
                  ? "Collect Customer Information"
                  : "Collect Payer Info"}
              </h3>
              <p className="text-sm text-gray-500">
                {variant === "digital-product"
                  ? "Required for digital file delivery"
                  : "Gather additional information from customers"}
              </p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${
              isOpen
                ? "border-gray-950 bg-gray-950"
                : "border-gray-300 bg-transparent"
            }`}
          >
            {isOpen && <CheckIcon className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Expanded Content - Inside same container */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: EASE_OUT_QUART,
              }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-black/5">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-3">
                    {variant === "digital-product"
                      ? "Email is required for delivery. You can also collect additional information:"
                      : "Select the information you'd like to collect from customers during payment:"}
                  </div>

                  <div className="grid gap-3">
                    {fieldConfigs.map(
                      ({ key, icon: Icon, title, description }) => {
                        const isEmailRequired =
                          variant === "digital-product" && key === "email";
                        const isFieldDisabled = isEmailRequired;
                        const isFieldSelected =
                          isEmailRequired || collectFields[key];

                        return (
                          <div
                            key={key}
                            className={`py-3 px-5 rounded-2xl transition-all ${
                              isFieldSelected
                                ? "bg-primary-200 border-transparent"
                                : "bg-gray-50 hover:bg-gray-50/80 border-transparent"
                            } ${
                              isFieldDisabled
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                            onClick={
                              !isFieldDisabled
                                ? () => onFieldChange(key, !collectFields[key])
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                                  isFieldSelected
                                    ? "bg-primary-300 border-transparent"
                                    : "border-gray-300 bg-transparent"
                                }`}
                              >
                                {isFieldSelected && (
                                  <CheckIcon className="w-3 h-3 text-primary-700" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <Icon className="size-4 stroke-2" />
                                  <span
                                    className={`font-medium ${
                                      isFieldDisabled
                                        ? "text-gray-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {title}
                                    {isEmailRequired && (
                                      <span className="text-xs text-primary-600 ml-2 font-normal">
                                        (Required)
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {isEmailRequired
                                    ? "Needed to send digital files after purchase"
                                    : description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Info note */}
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-2xl">
                    {variant === "digital-product" ? (
                      <>
                        📧 <strong>Email Delivery:</strong> Digital files will
                        be automatically sent to the customer&apos;s email after
                        successful payment.
                      </>
                    ) : (
                      <>
                        💡 <strong>Tip:</strong> Collecting customer info helps
                        you provide better service and build relationships with
                        your customers.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default CollectInfoOption;
