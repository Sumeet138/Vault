import { useState } from "react";
import { DollarSign } from "lucide-react";
import CuteModal from "@/components/common/CuteModal";

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
}

const currencyOptions = [{ id: "usd", label: "USD", icon: DollarSign }];

export default function CurrencyModal({
  isOpen,
  onClose,
  currentValue,
}: CurrencyModalProps) {
  const [selectedValue, setSelectedValue] = useState(
    currentValue.toLowerCase()
  );

  const handleOptionSelect = (optionId: string) => {
    setSelectedValue(optionId);
    // Note: For now this is just UI, no actual state changes
  };

  return (
    <CuteModal isOpen={isOpen} onClose={onClose} title="Currency" size="sm">
      <div className="space-y-4">
        <div className="flex justify-center">
          {currencyOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedValue === option.id;

            return (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all duration-200 min-w-[80px] font-semibold
                  ${
                    isSelected
                      ? "bg-gray-50 border-2 border-primary-500"
                      : "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100"
                  }
                `}
              >
                <Icon className={`w-6 h-6 mb-2 text-gray-600 stroke-2`} />
                <span className={`text-sm font-semibold text-gray-600`}>
                  {option.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-xs text-gray-400 text-center">
          Additional currencies coming soon
        </div>
      </div>
    </CuteModal>
  );
}
