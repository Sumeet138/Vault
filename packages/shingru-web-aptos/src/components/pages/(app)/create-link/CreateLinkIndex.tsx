"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { LinkFormProvider, useLinkForm } from "@/providers/LinkFormProvider";
import { PAYMENT_TEMPLATES, PaymentTemplate } from "@/config/templates";
import SimplePaymentForm from "./SimplePaymentForm";
import DigitalProductForm from "./DigitalProductForm";
import FundraisingForm from "./FundraisingForm";
import MainButton from "@/components/common/MainButton";
import { cn } from "@/lib/utils";
import EmojiColorPicker from "@/components/common/EmojiColorPicker";
import { useAppHeaderStore } from "@/store/app-header-store";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useAttributionTracking } from "@/hooks/useAttributionTracking";

// Template Picker UI components (kept inside the main file as requested)
interface TemplateButtonProps {
  template: PaymentTemplate;
  onSelect: (template: PaymentTemplate) => void;
}

const TemplateButton: React.FC<TemplateButtonProps> = ({
  template,
  onSelect,
}) => (
  <div
    className={`bg-white rounded-3xl border border-black/5 shadow-supa-smooth transition-shadow relative ${
      template.isComingSoon
        ? "opacity-50 cursor-not-allowed"
        : "hover:bg-gray-50 cursor-pointer"
    }`}
    onClick={() => !template.isComingSoon && onSelect(template)}
  >
    <div className="p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <Image
            src={template.icon}
            alt={template.title}
            width={32}
            height={32}
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base sm:text-md font-semibold">
              {template.title}
            </h3>
            <span className="text-xs bg-gray-100 text-black/50 px-2 py-1 rounded-full font-medium">
              {template.subtitle}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-black/50 mb-1">
            {template.description}
          </p>
          <p className="text-xs text-black/40">
            Perfect for: {template.perfectFor}
          </p>
        </div>
      </div>
    </div>
    {template.isComingSoon && (
      <div className="absolute -top-2 -right-2 bg-gray-100 border border-black/10 text-black px-3 py-1.5 rounded-full text-xs font-semibold">
        Coming Soon
      </div>
    )}
  </div>
);

interface TemplatePickerProps {
  onSelect: (template: PaymentTemplate) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect }) => {
  const primaryTemplates = PAYMENT_TEMPLATES.filter((t) => t.isPrimary);
  const otherTemplates = PAYMENT_TEMPLATES.filter((t) => !t.isPrimary);

  return (
    <div className="space-y-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Choose a Template</h1>
        <p className="text-black/50 text-sm">
          Pick the perfect template for your payment link.
        </p>
      </div>
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold">Popular</h2>
        {primaryTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 800,
              damping: 80,
              mass: 4,
              delay: index * 0.025,
            }}
          >
            <TemplateButton template={template} onSelect={onSelect} />
          </motion.div>
        ))}
      </div>
      {otherTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">More Options</h2>
          {otherTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 800,
                damping: 80,
                mass: 4,
                delay: index * 0.025,
              }}
            >
              <TemplateButton template={template} onSelect={onSelect} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Content Component
function CreateLinkContent() {
  const router = useRouter();
  const {
    selectedTemplate,
    setSelectedTemplate,
    formData,
    isDuplicateName,
    isSubmitting,
    submitError,
    handleSubmit,
    isEmojiColorPickerOpen,
    setIsEmojiColorPickerOpen,
    selectedEmoji,
    setSelectedEmoji,
    selectedColor,
    setSelectedColor,
  } = useLinkForm();
  const { setOverride } = useAppHeaderStore();
  const { trackFeatureUsage } = useAttributionTracking();

  const handleTemplateSelect = (template: PaymentTemplate) => {
    setSelectedTemplate(template);
    // Track template selection
    trackFeatureUsage('template_selection', { 
      templateId: template.id,
      templateTitle: template.title 
    });
  };

  const handleBackToTemplatePicker = React.useCallback(() => {
    setSelectedTemplate(null);
  }, [setSelectedTemplate]);

  React.useEffect(() => {
    if (selectedTemplate) {
      setOverride({
        title: selectedTemplate.title,
        showBackButton: true,
        onBack: handleBackToTemplatePicker,
      });
    } else {
      setOverride(null);
    }

    return () => {
      setOverride(null);
    };
  }, [selectedTemplate, setOverride, handleBackToTemplatePicker]);

  const renderFormForTemplate = () => {
    if (!selectedTemplate) {
      return <TemplatePicker onSelect={handleTemplateSelect} />;
    }

    switch (selectedTemplate.id) {
      case "simple-payment":
        return <SimplePaymentForm />;
      case "digital-product":
        return <DigitalProductForm />;
      case "fundraiser":
        return <FundraisingForm />;
      default:
        return <TemplatePicker onSelect={handleTemplateSelect} />;
    }
  };

  return (
    <>
      <EmojiColorPicker
        isOpen={isEmojiColorPickerOpen}
        onClose={() => setIsEmojiColorPickerOpen(false)}
        onEmojiSelect={setSelectedEmoji}
        onColorSelect={setSelectedColor}
        selectedEmoji={selectedEmoji}
        selectedColor={selectedColor}
      />
      <div className="w-full max-w-lg mx-auto relative md:py-3 pt-5">
        {/* Desktop Page Header */}
        <div className="relative md:hidden flex items-center justify-center mb-6">
          <button
            type="button"
            onClick={() => {
              if (selectedTemplate) {
                handleBackToTemplatePicker();
              } else {
                router.back();
              }
            }}
            className="absolute left-0 cursor-pointer flex items-center justify-center text-gray-600 hover:text-black transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate px-12">
            {selectedTemplate ? selectedTemplate.title : "Create Link"}
          </h1>
        </div>
        <div className="pb-[12rem]">
          {renderFormForTemplate()}
          {selectedTemplate && (
            <div className="mt-8">
              {submitError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-red-700 text-sm font-medium">
                        Error creating link
                      </p>
                      <p className="text-red-600 text-sm mt-1">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}
              <MainButton
                onClick={() => handleSubmit()}
                disabled={
                  !formData.name.trim() ||
                  isDuplicateName ||
                  !selectedTemplate ||
                  isSubmitting
                }
                isLoading={isSubmitting}
                className={cn(
                  "w-full",
                  !formData.name.trim() ||
                    isDuplicateName ||
                    !selectedTemplate ||
                    isSubmitting
                    ? "!bg-gray-50 !text-gray-400 !border-gray-200"
                    : "!bg-primary !text-gray-900",
                  "py-4 rounded-2xl"
                )}
              >
                {isSubmitting ? "Creating Link..." : "Create Payment Link"}
              </MainButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Main component that wraps everything in the provider
export default function CreateLinkIndex() {
  return (
    <LinkFormProvider mode="create">
      <CreateLinkContent />
    </LinkFormProvider>
  );
}
