import React, { useCallback } from "react";
import { usePay } from "@/providers/PayProvider";
import { Input } from "@/components/ui/input";

interface CollectInfoFormData {
  name: string;
  email: string;
  telegram: string;
}

interface CollectInfoFormProps {
  formData: CollectInfoFormData;
  onFormChange: (data: CollectInfoFormData) => void;
  errors?: Partial<CollectInfoFormData>;
}

export default function CollectInfoForm({
  formData,
  onFormChange,
  errors = {},
}: CollectInfoFormProps) {
  const { addressData } = usePay();

  const collectFields = addressData?.linkData?.collectFields;

  const handleInputChange = useCallback(
    (field: keyof CollectInfoFormData, value: string) => {
      onFormChange({ ...formData, [field]: value });
    },
    [formData, onFormChange]
  );

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "name":
        return "Full Name";
      case "email":
        return "Email Address";
      case "telegram":
        return "Telegram Username";
      default:
        return field;
    }
  };

  const getFieldPlaceholder = (field: string) => {
    switch (field) {
      case "name":
        return "Enter your full name";
      case "email":
        return "Enter your email address";
      case "telegram":
        return "Enter your Telegram username";
      default:
        return `Enter your ${field}`;
    }
  };

  if (
    !collectFields ||
    (!collectFields.name && !collectFields.email && !collectFields.telegram)
  ) {
    return null;
  }

  return (
    <div className="bg-white rounded-[1.6rem] p-4 px-2">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Your Information
        </h3>
      </div>

      <div className="space-y-4">
        {/* Name Field */}
        {collectFields.name && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {getFieldLabel("name")} <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={getFieldPlaceholder("name")}
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`bg-gray-100 border-0 rounded-xl h-12 px-5 ${
                errors?.name ? "ring-2 ring-inset ring-red-500" : ""
              }`}
            />
            {errors?.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
        )}

        {/* Email Field */}
        {collectFields.email && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {getFieldLabel("email")} <span className="text-red-500">*</span>
            </label>
            {addressData.template === "digital-product" && (
              <p className="text-xs text-gray-500 mb-2">
                Required for digital file delivery
              </p>
            )}
            <Input
              type="email"
              placeholder={getFieldPlaceholder("email")}
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`bg-gray-100 border-0 rounded-xl h-12 px-5 ${
                errors?.email ? "ring-2 ring-inset ring-red-500" : ""
              }`}
            />
            {errors?.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        )}

        {/* Telegram Field */}
        {collectFields.telegram && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {getFieldLabel("telegram")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={getFieldPlaceholder("telegram")}
              value={formData.telegram}
              onChange={(e) => handleInputChange("telegram", e.target.value)}
              className={`bg-gray-100 border-0 rounded-xl h-12 px-5 ${
                errors?.telegram ? "ring-2 ring-inset ring-red-500" : ""
              }`}
            />
            {errors?.telegram && (
              <p className="text-red-500 text-xs mt-1">{errors.telegram}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
