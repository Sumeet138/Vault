"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { LinkFormProvider, useLinkForm } from "@/providers/LinkFormProvider";
import { Link, linksService } from "@/lib/api/links";
import { PAYMENT_TEMPLATES, PaymentTemplate } from "@/config/templates";
import { AVAILABLE_CHAINS } from "@/config/chains";
import EmojiColorPicker from "@/components/common/EmojiColorPicker";
import TypePickerModal from "./TypePickerModal";
import CuteButton from "@/components/common/CuteButton";
import { cn } from "@/lib/utils";

// Import form components
import LinkNameStyleInput from "../create-link/LinkNameStyleInput";
import SelectChainOption from "../create-link/SelectChainOption";
import AmountOption from "../create-link/AmountOption";
import CollectInfoOption from "../create-link/CollectInfoOption";
import DeliverablesOption from "../create-link/DeliverablesOption";
import { Textarea } from "@/components/ui/textarea";
import MainButton from "@/components/common/MainButton";

const FormSection = ({
  title,
  children,
  className,
  classNameContent,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  classNameContent?: string;
}) => (
  <div className={cn("space-y-3", className)}>
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className={cn("pb-8", classNameContent)}>{children}</div>
  </div>
);

function EditLinkContent({ link }: { link: Link }) {
  const {
    selectedTemplate,
    setSelectedTemplate,
    formData,
    handleInputChange,
    handleCollectFieldChange,
    handleChainToggle,
    handleStablecoinInputChange,
    handleChainTokenInputChange,
    handlePricingTypeChange,
    handleUseCustomTokensChange,
    handleDeliverableFilesChange,
    handleDeliveryUrlChange,
    handleThankYouMessageChange,
    selectedEmoji,
    selectedColor,
    setSelectedEmoji,
    setSelectedColor,
    isEmojiColorPickerOpen,
    setIsEmojiColorPickerOpen,
    generateSlug,
    isDuplicateName,
    isSubmitting,
    submitError,
    handleSubmit,
    initializeForEdit,
  } = useLinkForm();

  const { me } = useAuth();
  const { linkId } = useParams();
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form with link data
  useEffect(() => {
    if (link && !initialized) {
      initializeForEdit(link);
      setInitialized(true);
    }
  }, [link, initializeForEdit, initialized]);

  const handleTypeSelect = (template: PaymentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleEditSubmit = async () => {
    await handleSubmit();
  };

  // Render different forms based on template
  const renderTemplateForm = () => {
    if (!selectedTemplate) return null;

    switch (selectedTemplate.id) {
      case "simple-payment":
        return (
          <div className="space-y-6">
            <FormSection title="">
              <SelectChainOption
                availableChains={AVAILABLE_CHAINS as any}
                supportedChains={formData.supportedChains}
                onChainToggle={handleChainToggle}
                pricingType={formData.pricingType}
              />
            </FormSection>

            <FormSection title="Link Name & Style">
              <LinkNameStyleInput
                name={formData.name}
                onNameChange={(value) => handleInputChange("name", value)}
                username={me?.username || undefined}
                generateSlug={generateSlug}
                placeholder="e.g., Coffee Tips"
                selectedEmoji={selectedEmoji}
                selectedColor={selectedColor}
                onOpenEmojiColorPicker={() => setIsEmojiColorPickerOpen(true)}
                useThumbnail={formData.useThumbnail}
                onUseThumbnailChange={(value) =>
                  handleInputChange("useThumbnail", value)
                }
                thumbnail={formData.thumbnail}
                onThumbnailChange={(file) =>
                  handleInputChange("thumbnail", file)
                }
                linkId={linkId as string}
              />
            </FormSection>

            <FormSection
              title="Description (Optional)"
              classNameContent="md:p-4 focus-within:ring-2 focus-within:ring-gray-200 bg-gray-50 border-none rounded-2xl"
            >
              <Textarea
                placeholder="Tell people what this payment is for..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="resize-none min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-none shadow-none"
              />
            </FormSection>

            <FormSection title="Amount">
              <AmountOption
                variant="payment"
                pricingType={formData.pricingType}
                onPricingTypeChange={handlePricingTypeChange}
                useCustomTokens={formData.useCustomTokens}
                onUseCustomTokensChange={handleUseCustomTokensChange}
                stablecoinAmount={formData.stablecoinAmount}
                stablecoinToken={formData.stablecoinToken}
                onStablecoinChange={handleStablecoinInputChange}
                chainTokenConfigs={formData.chainTokenConfigs}
                onChainTokenChange={handleChainTokenInputChange}
                supportedChains={formData.supportedChains}
                availableChains={AVAILABLE_CHAINS as any}
              />
            </FormSection>

            <FormSection title="Advanced">
              <CollectInfoOption
                isOpen={formData.collectInfo}
                onToggle={() =>
                  handleInputChange("collectInfo", !formData.collectInfo)
                }
                collectFields={formData.collectFields}
                onFieldChange={handleCollectFieldChange}
              />
            </FormSection>
          </div>
        );

      case "digital-product":
        return (
          <div className="space-y-6">
            <FormSection title="">
              <SelectChainOption
                availableChains={AVAILABLE_CHAINS as any}
                supportedChains={formData.supportedChains}
                onChainToggle={handleChainToggle}
                pricingType={formData.pricingType}
              />
            </FormSection>

            <FormSection title="Product Name & Style">
              <LinkNameStyleInput
                name={formData.name}
                onNameChange={(value) => handleInputChange("name", value)}
                username={me?.username || undefined}
                generateSlug={generateSlug}
                placeholder="Enter product name (e.g., Design Templates Pack)"
                selectedEmoji={selectedEmoji}
                selectedColor={selectedColor}
                onOpenEmojiColorPicker={() => setIsEmojiColorPickerOpen(true)}
                useThumbnail={formData.useThumbnail}
                onUseThumbnailChange={(value) =>
                  handleInputChange("useThumbnail", value)
                }
                thumbnail={formData.thumbnail}
                onThumbnailChange={(file) =>
                  handleInputChange("thumbnail", file)
                }
                linkId={linkId as string}
              />
            </FormSection>

            <FormSection
              title="Description (Optional)"
              classNameContent="md:p-4 focus-within:ring-2 focus-within:ring-gray-200 bg-gray-50 border-none rounded-2xl"
            >
              <Textarea
                placeholder="Describe your digital product, what's included, and any important details..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="resize-none min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-none shadow-none"
              />
            </FormSection>

            <FormSection title="Deliverables">
              <DeliverablesOption
                files={formData.deliverableFiles}
                onFilesChange={handleDeliverableFilesChange}
                deliveryUrl={formData.deliveryUrl}
                onDeliveryUrlChange={handleDeliveryUrlChange}
                thankYouMessage={formData.thankYouMessage}
                onThankYouMessageChange={handleThankYouMessageChange}
              />
            </FormSection>

            <FormSection title="Amount">
              <AmountOption
                variant="digital-product"
                pricingType={formData.pricingType}
                onPricingTypeChange={handlePricingTypeChange}
                useCustomTokens={formData.useCustomTokens}
                onUseCustomTokensChange={handleUseCustomTokensChange}
                stablecoinAmount={formData.stablecoinAmount}
                stablecoinToken={formData.stablecoinToken}
                onStablecoinChange={handleStablecoinInputChange}
                chainTokenConfigs={formData.chainTokenConfigs}
                onChainTokenChange={handleChainTokenInputChange}
                supportedChains={formData.supportedChains}
                availableChains={AVAILABLE_CHAINS as any}
              />
            </FormSection>

            <FormSection title="Advanced">
              <CollectInfoOption
                variant="digital-product"
                isOpen={formData.collectInfo}
                onToggle={() => {}} // Disabled for digital products
                collectFields={formData.collectFields}
                onFieldChange={handleCollectFieldChange}
                disabled={true}
              />
            </FormSection>
          </div>
        );

      case "fundraiser":
        return (
          <div className="space-y-6">
            <FormSection title="">
              <SelectChainOption
                availableChains={AVAILABLE_CHAINS as any}
                supportedChains={formData.supportedChains}
                onChainToggle={handleChainToggle}
                pricingType={formData.pricingType}
              />
            </FormSection>

            <FormSection title="Fundraiser Name & Style">
              <LinkNameStyleInput
                name={formData.name}
                onNameChange={(value) => handleInputChange("name", value)}
                username={me?.username || undefined}
                generateSlug={generateSlug}
                placeholder="e.g., Help Me Buy a New Laptop"
                selectedEmoji={selectedEmoji}
                selectedColor={selectedColor}
                onOpenEmojiColorPicker={() => setIsEmojiColorPickerOpen(true)}
                useThumbnail={formData.useThumbnail}
                onUseThumbnailChange={(value) =>
                  handleInputChange("useThumbnail", value)
                }
                thumbnail={formData.thumbnail}
                onThumbnailChange={(file) =>
                  handleInputChange("thumbnail", file)
                }
                linkId={linkId as string}
              />
            </FormSection>

            <FormSection
              title="Description (Optional)"
              classNameContent="md:p-4 focus-within:ring-2 focus-within:ring-gray-200 bg-gray-50 border-none rounded-2xl"
            >
              <Textarea
                placeholder="Tell people about your fundraiser and why you need their support..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="resize-none min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-none shadow-none"
              />
            </FormSection>

            <FormSection title="Goal & Amount">
              <AmountOption
                variant="fundraiser"
                pricingType={formData.pricingType}
                onPricingTypeChange={handlePricingTypeChange}
                useCustomTokens={formData.useCustomTokens}
                onUseCustomTokensChange={handleUseCustomTokensChange}
                stablecoinAmount={formData.stablecoinAmount}
                stablecoinToken={formData.stablecoinToken}
                onStablecoinChange={handleStablecoinInputChange}
                chainTokenConfigs={formData.chainTokenConfigs}
                onChainTokenChange={handleChainTokenInputChange}
                supportedChains={formData.supportedChains}
                availableChains={AVAILABLE_CHAINS as any}
                goalAmount={formData.goalAmount}
                onGoalAmountChange={(value: string) =>
                  handleInputChange("goalAmount", value)
                }
              />
            </FormSection>

            <FormSection title="Advanced">
              <CollectInfoOption
                isOpen={formData.collectInfo}
                onToggle={() =>
                  handleInputChange("collectInfo", !formData.collectInfo)
                }
                collectFields={formData.collectFields}
                onFieldChange={handleCollectFieldChange}
              />
            </FormSection>
          </div>
        );

      default:
        return null;
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

      <TypePickerModal
        isOpen={isTypePickerOpen}
        onClose={() => setIsTypePickerOpen(false)}
        onSelect={handleTypeSelect}
        currentTemplate={selectedTemplate}
      />

      <div className="w-full max-w-lg mx-auto relative py-3 ">
        <div className="pb-[12rem]">
          <div className="space-y-6">
            {/* Type Picker Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Link Type</h2>
              <div className="pb-4">
                <MainButton
                  onClick={() => setIsTypePickerOpen(true)}
                  classNameContainer="flex-1"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-5 rounded-2xl justify-between"
                >
                  <div className="flex items-center justify-between w-full px-5">
                    <div className="flex items-center gap-3">
                      {selectedTemplate?.icon && (
                        <img
                          src={selectedTemplate.icon}
                          alt={selectedTemplate.title}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <div className="text-left">
                        <div className="font-medium text-sm">
                          {selectedTemplate?.title || "Select Template"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedTemplate?.description ||
                            "Choose a template for your link"}
                        </div>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </MainButton>
              </div>
            </div>

            {/* Template Form */}
            {renderTemplateForm()}

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-red-700 text-sm font-medium">
                      Error updating link
                    </p>
                    <p className="text-red-600 text-sm mt-1">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <MainButton
              onClick={handleEditSubmit}
              classNameContainer="flex-1"
              disabled={
                !formData.name.trim() ||
                isDuplicateName ||
                !selectedTemplate ||
                isSubmitting
              }
              isLoading={isSubmitting}
              className={cn(
                !formData.name.trim() ||
                  isDuplicateName ||
                  !selectedTemplate ||
                  isSubmitting
                  ? "!bg-gray-50 !text-gray-400 !border-gray-200"
                  : "!bg-primary !text-gray-900",
                "py-4 rounded-2xl w-full"
              )}
            >
              {isSubmitting ? "Updating Link..." : "Update Link"}
            </MainButton>
          </div>
        </div>
      </div>
    </>
  );
}

export default function EditLinkIndex() {
  const { linkId } = useParams();
  const { accessToken } = useAuth();
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!linkId || typeof linkId !== "string" || !accessToken) return;

    const fetchLink = async () => {
      try {
        setLoading(true);
        const response = await linksService.getLink(accessToken, linkId);

        if (response.data) {
          setLink(response.data);
        } else {
          setError(response.error || "Failed to load link details");
        }
      } catch {
        setError("Failed to load link details");
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [linkId, accessToken]);

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto relative py-3 ">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="w-full max-w-lg mx-auto relative py-3 ">
        <div className="pb-[12rem]">
          <div className="bg-white rounded-2xl overflow-hidden border border-black/10 shadow-supa-smooth transition-shadow p-5 sm:p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {error || "Link not found"}
              </h2>
              <p className="text-gray-600">
                The link you&apos;re trying to edit doesn&apos;t exist or you
                don&apos;t have permission to edit it.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find the template for this link
  const currentTemplate = PAYMENT_TEMPLATES.find((t) => t.id === link.template);

  return (
    <LinkFormProvider
      mode="edit"
      initialTemplate={currentTemplate || null}
      linkId={linkId as string}
    >
      <EditLinkContent link={link} />
    </LinkFormProvider>
  );
}
