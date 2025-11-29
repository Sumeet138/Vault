"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import CuteModal from "@/components/common/CuteModal";
import { PAYMENT_TEMPLATES, PaymentTemplate } from "@/config/templates";

interface TypePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: PaymentTemplate) => void;
  currentTemplate?: PaymentTemplate | null;
}

interface TemplateButtonProps {
  template: PaymentTemplate;
  onSelect: (template: PaymentTemplate) => void;
  isSelected?: boolean;
}

const TemplateButton: React.FC<TemplateButtonProps> = ({
  template,
  onSelect,
  isSelected = false,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border transition-all relative ${
        template.isComingSoon
          ? "opacity-50 cursor-not-allowed border-gray-200"
          : isSelected
          ? "border-blue-500 shadow-md cursor-pointer"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer"
      }`}
    >
      <div
        className="p-4"
        onClick={() => !template.isComingSoon && onSelect(template)}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Image
              src={template.icon}
              alt={template.title}
              width={28}
              height={28}
              className="w-10 h-10 object-contain rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900">
                {template.title}
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                {template.subtitle}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">{template.description}</p>
            <p className="text-xs text-gray-400">
              Perfect for: {template.perfectFor}
            </p>
          </div>
          {isSelected && (
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      {template.isComingSoon && (
        <div className="absolute -top-1 -right-1 bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
          Soon
        </div>
      )}
    </div>
  );
};

export default function TypePickerModal({
  isOpen,
  onClose,
  onSelect,
  currentTemplate,
}: TypePickerModalProps) {
  const availableTemplates = PAYMENT_TEMPLATES.filter((t) => !t.isComingSoon);

  const handleSelect = (template: PaymentTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <CuteModal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Link Type"
      size="lg"
      withHandle={true}
    >
      <div className="space-y-4">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 text-start text-balance">
            Choose a new template for your link. Your existing data will be
            preserved where possible.
          </p>
        </div>

        <div className="space-y-3">
          {availableTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: index * 0.05,
              }}
            >
              <TemplateButton
                template={template}
                onSelect={handleSelect}
                isSelected={currentTemplate?.id === template.id}
              />
            </motion.div>
          ))}
        </div>

        {/* Notice about data preservation */}
        <div className="mt-6 p-3 bg-blue-50 rounded-xl">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <p className="text-xs text-blue-800 font-medium mb-1">
                Data Preservation
              </p>
              <p className="text-xs text-blue-700">
                When switching templates, your basic information (name,
                description, pricing) will be kept. Template-specific features
                may need to be reconfigured.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CuteModal>
  );
}
