import { useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import CuteModal from "@/components/common/CuteModal";

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
}

const appearanceOptions = [
  // { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

export default function AppearanceModal({
  isOpen,
  onClose,
  currentValue,
}: AppearanceModalProps) {
  const [selectedValue, setSelectedValue] = useState(
    currentValue.toLowerCase()
  );

  const handleOptionSelect = (optionId: string) => {
    setSelectedValue(optionId);
    // Note: For now this is just UI, no actual state changes
  };

  return (
    <CuteModal isOpen={isOpen} onClose={onClose} title="Appearance" size="lg">
      <div className="space-y-4">
        <div className="flex gap-3">
          {appearanceOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedValue === option.id;

            return (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center p-4 py-8 rounded-3xl cursor-pointer transition-all duration-200
                  ${
                    isSelected
                      ? "bg-gray-50 border-2 border-primary-500"
                      : "bg-gray-50 border-2 border-transparent"
                  }
                `}
              >
                <Icon
                  className={`w-12 h-12 mb-2 ${
                    isSelected ? "text-black" : "text-black/50"
                  }`}
                />
                <span
                  className={`text-md font-semibold ${
                    isSelected ? "text-black" : "text-black/50"
                  }`}
                >
                  {option.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-xs text-gray-400 text-center">
          Theme changes are currently in development
        </div>
      </div>
    </CuteModal>
  );
}
