"use client";

import React from "react";
import { motion } from "motion/react";
import StatusBadge, { PaymentStatus } from "@/components/common/StatusBadge";
import { useLinkForm } from "@/providers/LinkFormProvider";

const statusOptions: PaymentStatus[] = ["pending", "paid", "unpaid", "expired", "active"];

export default function StatusSelector() {
  const { formData, handleInputChange } = useLinkForm();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-900">
          Payment Status
        </label>
        <StatusBadge
          status={formData.paymentStatus || "pending"}
          size="sm"
          animated
        />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {statusOptions.map((status) => (
          <motion.button
            key={status}
            type="button"
            onClick={() => handleInputChange("paymentStatus", status)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-3 rounded-xl border-2 transition-all duration-200
              ${
                formData.paymentStatus === status
                  ? "border-gray-900 bg-gray-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }
            `}
          >
            <div className="flex flex-col items-center gap-2">
              <StatusBadge
                status={status}
                size="sm"
                animated={formData.paymentStatus === status}
              />
            </div>
            {formData.paymentStatus === status && (
              <motion.div
                layoutId="statusSelector"
                className="absolute inset-0 border-2 border-gray-900 rounded-xl"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        ))}
      </div>
      
      <p className="text-xs text-gray-500">
        Set the initial payment status for this link. You can change it later.
      </p>
    </div>
  );
}

