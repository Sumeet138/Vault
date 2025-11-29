import React, { useMemo } from "react";
import { useLinkForm } from "@/providers/LinkFormProvider";
import { useAuth } from "@/providers/AuthProvider";
import { AVAILABLE_CHAINS } from "@/config/chains";
import CollectInfoOption from "./CollectInfoOption";
import AmountOption from "./AmountOption";
import LinkNameStyleInput from "./LinkNameStyleInput";
import SelectChainOption from "./SelectChainOption";
import DeliverablesOption from "./DeliverablesOption";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserProvider";

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

export default function DigitalProductForm() {
  const { me } = useAuth();
  const {
    formData,
    handleInputChange,
    handleChainToggle,
    handleStablecoinInputChange,
    handleChainTokenInputChange,
    handlePricingTypeChange,
    handleUseCustomTokensChange,
    handleDeliverableFilesChange,
    handleDeliveryUrlChange,
    handleThankYouMessageChange,
    handleCollectFieldChange,
    selectedEmoji,
    selectedColor,
    setIsEmojiColorPickerOpen,
    generateSlug,
  } = useLinkForm();

  const { availableChains: enabledChains } = useUser();

  const availableChainsForForm = useMemo(
    () =>
      AVAILABLE_CHAINS.filter((chain) => enabledChains.includes(chain.id as any)),
    [enabledChains]
  );

  return (
    <div className="space-y-6">
      {availableChainsForForm.length > 1 && (
      <FormSection title="">
        <SelectChainOption
          availableChains={availableChainsForForm as any}
          supportedChains={formData.supportedChains}
          onChainToggle={handleChainToggle}
          pricingType={formData.pricingType}
        />
      </FormSection>
      )}

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
          onThumbnailChange={(file) => handleInputChange("thumbnail", file)}
        />
      </FormSection>

      <FormSection
        title="Description (Optional)"
        classNameContent="md:p-4 focus-within:ring-2 focus-within:ring-gray-200 bg-gray-50 border-none rounded-2xl"
      >
        <Textarea
          placeholder="Describe your digital product, what's included, and any important details..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
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
          isOpen={true}
          onToggle={() => {}}
          collectFields={formData.collectFields}
          onFieldChange={handleCollectFieldChange}
          disabled={true}
        />
      </FormSection>
    </div>
  );
}
