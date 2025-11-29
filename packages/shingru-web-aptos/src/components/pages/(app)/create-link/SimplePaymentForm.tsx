import React, { useMemo } from "react";
import { useLinkForm } from "@/providers/LinkFormProvider";
import { useAuth } from "@/providers/AuthProvider";
import { AVAILABLE_CHAINS } from "@/config/chains";
import CollectInfoOption from "./CollectInfoOption";
import AmountOption from "./AmountOption";
import LinkNameStyleInput from "./LinkNameStyleInput";
import SelectChainOption from "./SelectChainOption";
import StatusSelector from "./StatusSelector";
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

export default function SimplePaymentForm() {
  const { me } = useAuth();
  const { availableChains: enabledChains } = useUser();
  const {
    formData,
    handleInputChange,
    handleCollectFieldChange,
    handleChainToggle,
    handleStablecoinInputChange,
    handleChainTokenInputChange,
    handlePricingTypeChange,
    handleUseCustomTokensChange,
    selectedEmoji,
    selectedColor,
    setIsEmojiColorPickerOpen,
    generateSlug,
  } = useLinkForm();

  const availableChainsForForm = useMemo(
    () => AVAILABLE_CHAINS.filter((chain) => enabledChains.includes(chain.id as any)),
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
          onThumbnailChange={(file) => handleInputChange("thumbnail", file)}
        />
      </FormSection>

      <FormSection
        title="Description (Optional)"
        classNameContent="px-1 py-2 md:p-4 focus-within:ring-2 focus-within:ring-primary bg-gray-100 border-none rounded-2xl"
      >
        <Textarea
          placeholder="Tell people what this payment is for..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className="resize-none min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none "
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

      <FormSection title="Payment Status">
        <StatusSelector />
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
}
