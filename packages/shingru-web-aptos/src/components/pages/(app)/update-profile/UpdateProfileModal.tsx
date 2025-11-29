"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useUser } from "@/providers/UserProvider";
import { backend } from "@/lib/api";
import { useDebounce } from "@uidotdev/usehooks";
import { RESTRICTED_USERNAME } from "@/config/restricted-username";
import { EMOJI_PICKS, COLOR_PICKS } from "@/config/styling";
import axios from "axios";
import { sleep } from "@/utils/process";
import EmojiColorPicker from "@/components/common/EmojiColorPicker";
import { AddProfileImageButton } from "../onboarding/steps/AddProfileImageButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CuteModal from "@/components/common/CuteModal";
import MainButton from "@/components/common/MainButton";
import UsernameAvailStatusPill from "@/components/common/UsernameAvailStatusPill";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

export default function UpdateProfileModal({
  isOpen,
  onClose,
  onUpdateSuccess,
}: UpdateProfileModalProps) {
  const { backendToken, fetchMe, me } = useAuth();
  const { refetchPersonalLink, refreshActivities } = useUser();

  // Username states
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Profile image states
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

  // Initialize with current user data when modal opens
  useEffect(() => {
    if (isOpen && me) {
      setUsername(me.username || "");

      // Set current profile image if exists
      if (me.profileImage?.type === "EMOJI_AND_COLOR") {
        const profileData = me.profileImage.data;
        const emojiData = EMOJI_PICKS.find(
          (pick) => pick.id === profileData.emoji
        );
        if (emojiData) {
          setSelectedEmoji({ id: emojiData.id, emoji: emojiData.emoji });
        }
        const colorData = COLOR_PICKS.find(
          (pick) => pick.id === profileData.backgroundColor
        );
        if (colorData) {
          setSelectedColor(colorData);
        }
      }

      // Reset validation states
      setIsAvailable(null);
      setValidationError(null);
      setIsChecking(false);
    }
  }, [isOpen, me]);

  // Force lowercase and validate input
  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase();
    if (lowercaseValue !== "" && !/^[a-z0-9]+$/.test(lowercaseValue)) {
      setValidationError("Only letters and numbers are allowed");
    } else {
      setValidationError(null);
    }
    setUsername(lowercaseValue);
  };

  const debouncedUsername = useDebounce(username, 500);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (
        !debouncedUsername ||
        debouncedUsername === me?.username ||
        validationError
      ) {
        setIsAvailable(null);
        return;
      }

      if (RESTRICTED_USERNAME.includes(debouncedUsername)) {
        setIsAvailable(false);
        return;
      }

      try {
        setIsChecking(true);
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/username/check`,
          { params: { username: debouncedUsername } }
        );
        setIsAvailable(data.isAvailable);
      } catch (err) {
        console.error("Error checking username:", err);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkUsername();
  }, [debouncedUsername, me?.username, validationError]);

  const handleUpdateProfile = async () => {
    if (!backendToken) return;

    setIsSubmitting(true);

    try {
      // Update username if changed
      if (username && username !== me?.username) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/username/set`,
          { username },
          { headers: { Authorization: `Bearer ${backendToken}` } }
        );
      }

      // Update profile image if changed
      if (selectedEmoji && selectedColor) {
        const profileResult = await backend.auth.setProfileImage(backendToken, {
          type: "EMOJI_AND_COLOR",
          data: {
            emoji: selectedEmoji.id,
            backgroundColor: selectedColor.id,
          },
        });
        if (profileResult.error) throw new Error(profileResult.error);
      }

      await fetchMe();
      await refetchPersonalLink();
      await refreshActivities();
      await sleep(100);
      onUpdateSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    const isUsernameChanged = username && username !== me?.username;
    const isProfileImageChanged =
      (selectedEmoji && selectedEmoji.id !== me?.profileImage?.data?.emoji) ||
      (selectedColor &&
        selectedColor.id !== me?.profileImage?.data?.backgroundColor);

    if (!isUsernameChanged && !isProfileImageChanged) return false;

    if (isUsernameChanged) {
      return !validationError && isAvailable === true && !isChecking;
    }

    return isProfileImageChanged;
  };

  const getCurrentEmoji = () => {
    if (selectedEmoji) return selectedEmoji.emoji;
    const emojiData = EMOJI_PICKS.find(
      (pick) => pick.id === me?.profileImage?.data?.emoji
    );
    return emojiData?.emoji;
  };

  const getCurrentColor = () => {
    if (selectedColor) return selectedColor.value;
    const colorData = COLOR_PICKS.find(
      (pick) => pick.id === me?.profileImage?.data?.backgroundColor
    );
    return colorData?.value;
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
      <CuteModal
        isOpen={isOpen}
        onClose={onClose}
        title="Update your profile"
        size="lg"
        withHandle
      >
        <div className="font-geist">
          <div className="flex justify-center relative">
            <AddProfileImageButton
              onPress={() => setIsEmojiColorPickerOpen(true)}
              type="emoji-and-color"
              emoji={getCurrentEmoji()}
              backgroundColor={getCurrentColor()}
              className="size-32 text-[4rem] hover:bg-primary-200"
            />
          </div>
          <div className="space-y-3">
            <div className="w-full space-y-2">
              <Label htmlFor="username" className="text-sm">
                Username
              </Label>
              <div className="relative flex items-center">
                <span className="absolute left-5 z-10 font-semibold text-sm text-gray-500 rounded-full top-1/2 -translate-y-1/2">
                  vault-aptos.vercel.app/
                </span>
                <Input
                  id="username"
                  placeholder="enter-your-username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="pl-[5rem] h-12 w-full text-sm border-none bg-gray-100 rounded-xl font-medium"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* --- USE THE NEW COMPONENT HERE --- */}
            <UsernameAvailStatusPill
              username={username}
              debouncedUsername={debouncedUsername}
              isAvailable={isAvailable}
              isChecking={isChecking}
              validationError={validationError}
              originalUsername={me?.username || ""}
              restrictedUsernames={RESTRICTED_USERNAME}
            />
            {/* --- END --- */}

            <p className="text-xs text-gray-500 leading-relaxed text-center">
              Heads up! Changing your username will update all your link URLs
            </p>
          </div>
          <div className="mt-8">
            <MainButton
              onClick={handleUpdateProfile}
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl text-lg font-semibold bg-green-600 hover:bg-green-400 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </MainButton>
          </div>
        </div>
      </CuteModal>
    </>
  );
}
