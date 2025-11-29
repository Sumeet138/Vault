import CuteButton from "@/components/common/CuteButton";
import { useState } from "react";
import { AddProfileImageButton } from "./AddProfileImageButton";
import { useAuth } from "@/providers/AuthProvider";
import EmojiColorPicker from "@/components/common/EmojiColorPicker";
import MainButton from "@/components/common/MainButton";
import { updateProfileImage, getUserByWallet } from "@/lib/supabase/users";

interface ProfileImageStepProps {
  onNext?: () => void;
  savedProfileImage?: string;
  onProfileImageChange?: (profileImage: string) => void;
}

export function ProfileImageStep({
  onNext,
  savedProfileImage,
  onProfileImageChange,
}: ProfileImageStepProps) {
  const { backendToken, fetchMe, me, wallets, updateMeProfile } = useAuth();

  // Emoji Color picker modal
  const [isEmojiColorPickerOpen, setIsEmojiColorPickerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<{
    id: string;
    emoji: string;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{
    id: string;
    value: string;
    light: string;
  } | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedEmoji || !selectedColor) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get wallet address from multiple sources
      let walletAddress: string | null = null;

      // First, try from wallets state
      const aptosWallet = wallets?.find((w) => w.chain === "APTOS");
      if (aptosWallet) {
        walletAddress = aptosWallet.address;
      }

      // If not found, try localStorage
      if (!walletAddress) {
        try {
          const storedWallets = localStorage.getItem("shingru-wallets");
          if (storedWallets) {
            const parsed = JSON.parse(storedWallets);
            const storedAptosWallet = Array.isArray(parsed)
              ? parsed.find((w: any) => w.chain === "APTOS")
              : null;
            if (storedAptosWallet) {
              walletAddress = storedAptosWallet.address;
            }
          }
        } catch (error) {
          console.error("Error reading wallets from localStorage:", error);
        }
      }

      // If still not found, try directly from Petra wallet
      if (!walletAddress && typeof window !== "undefined" && (window as any).aptos) {
        try {
          const response = await (window as any).aptos.account();
          if (response?.address) {
            walletAddress = response.address;
          }
        } catch (error) {
          console.error("Error getting wallet from Petra:", error);
        }
      }

      if (!walletAddress) {
        throw new Error("Wallet not found. Please reconnect your wallet.");
      }

      // Get user from Supabase using wallet address (more reliable than me.id)
      const user = await getUserByWallet(walletAddress, "APTOS");

      if (!user) {
        throw new Error("User not found in database. Please complete the username step first.");
      }

      const profileImageData = {
        emoji: selectedEmoji.id,
        backgroundColor: selectedColor.id,
      };

      console.log('Updating profile image for user:', user.id, 'with data:', profileImageData);

      // Update profile image in Supabase
      const updatedUser = await updateProfileImage(
        user.id,
        "EMOJI_AND_COLOR",
        profileImageData
      );

      console.log('Update profile image result:', updatedUser);

      if (!updatedUser) {
        throw new Error("Failed to update profile image. Please check the console for details.");
      }

      const profileImage = {
        type: "EMOJI_AND_COLOR",
        data: profileImageData,
      };

      // Update the profile image in the parent component
      if (onProfileImageChange) {
        onProfileImageChange(JSON.stringify(profileImage));
      }

      // Update me state directly with the new profile image
      if (updateMeProfile && me) {
        updateMeProfile({
          profileImage: profileImage,
        });
      }

      // Refresh user profile to get updated data (this might fail if wallets are not loaded, but that's OK)
      try {
        await fetchMe();
      } catch (error) {
        console.warn("fetchMe failed, but profile image is already updated:", error);
      }

      // Continue to next step
      if (onNext) {
        console.log("Calling onNext callback");
        onNext();
      } else {
        console.warn("onNext callback is not provided");
      }
    } catch (err) {
      console.error("Error setting profile image:", err);
      setError(
        err instanceof Error ? err.message : "Failed to set profile image"
      );
    } finally {
      setIsLoading(false);
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
      <div className="w-full">
        {/* Main content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Choose your profile
          </h1>
          <p className="text-gray-500 text-lg leading-tight max-w-sm mx-auto">
            Pick an emoji and color that represents you best.
          </p>
        </div>

        <div className="mb-12 w-fit mx-auto">
          <AddProfileImageButton
            onPress={() => setIsEmojiColorPickerOpen(true)}
            type="emoji-and-color"
            emoji={selectedEmoji?.emoji}
            backgroundColor={selectedColor?.value}
            className="size-48 text-[7rem] hover:bg-primary-200"
          />
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Continue button - now part of regular flow */}
        <div>
          <MainButton
            onClick={onNext}
            className="w-full h-14 rounded-2xl text-lg font-semibold bg-green-600 hover:bg-green-400 text-white"
          >
            Continue
          </MainButton>
        </div>
      </div>
    </>
  );
}
