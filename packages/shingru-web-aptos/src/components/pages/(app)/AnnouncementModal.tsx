import CuteModal from "@/components/common/CuteModal";
import {
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  return (
    <CuteModal
      isOpen={isOpen}
      onClose={onClose}
      title="VAULT × APTOS"
      withHandle={true}
      size="lg"
      fullscreen={true}
      className="!max-h-screen h-screen !rounded-none md:!rounded-[2rem] md:!max-h-[90vh] md:h-auto"
    >
      <div className="space-y-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 text-center border border-primary-200">
          <div className="inline-flex items-center justify-center w-16 h-16 b-4">
            <div className="text-3xl font-bold text-gray-900">vault</div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            VAULT × APTOS
          </h3>
          <p className="text-gray-700 font-medium">
            Private payments on APTOS
          </p>
        </div>

        {/* Features Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            What&apos;s New
          </h4>

          <div className="space-y-2">
            <div className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                <RocketLaunchIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">
                  First Stealth Addresses on APTOS & MOVE
                </h5>
                <p className="text-sm text-gray-600">
                  The first implementation of stealth addresses on APTOS and the entire MOVE ecosystem. Send and receive payments without revealing your wallet balance or transaction history.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">
                  Privacy by Default
                </h5>
                <p className="text-sm text-gray-600">
                  We believe privacy is a fundamental right. VAULT makes on-chain privacy simple and accessible for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-900">About:</span>{" "}
            VAULT builds privacy infrastructure for APTOS. We use stealth addresses to keep your transactions private while maintaining the simplicity you expect from modern payments.
          </p>
        </div>
      </div>
    </CuteModal>
  );
}
