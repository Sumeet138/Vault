"use client";

import { UsernameStep } from "./steps/UsernameStep";
import { ProfileImageStep } from "./steps/ProfileImageStep";
import { PinStep } from "./steps/PinStep";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboardingPersistence } from "./hooks/use-onboarding-persistance";
import StepIndicator from "@/components/common/StepIndicator";
import FullscreenLoader from "@/components/common/FullscreenLoader";

const TOTAL_STEPS = 3;

export default function OnboardingIndex() {
  const { me } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isRefetchingMe] = useState(false);

  const highestStepReachedRef = useRef(1);

  const prevMeRef = useRef(me);

  const {
    currentStep,
    stepData,
    goToNextStep,
    updateStepData,
    clearOnboardingState,
    goToStep,
  } = useOnboardingPersistence(TOTAL_STEPS);

  // Check if onboarding guard is disabled
  const isOnboardGuardDisabled =
    process.env.NEXT_PUBLIC_DISABLE_ONBOARD_GUARD === "true";

  // Determine which steps should be skipped based on user data
  const shouldSkipStep1 = me?.username ? true : false; // Skip if username exists
  const shouldSkipStep2 = me?.profileImage ? true : false; // Skip if profileImage exists
  const shouldSkipStep3 =
    me?.wallets &&
    me.wallets.length > 0 &&
    me.wallets.every((wallet) => wallet.metaKeys?.metaSpendPub)
      ? true
      : false; // Skip if all wallets have metaSpendPub

  // Check if all onboarding is complete
  const isOnboardingComplete =
    shouldSkipStep1 && shouldSkipStep2 && shouldSkipStep3;

  // Update highest step reached based on completed steps
  useEffect(() => {
    if (shouldSkipStep1) {
      highestStepReachedRef.current = Math.max(
        highestStepReachedRef.current,
        2
      );
    }
    if (shouldSkipStep1 && shouldSkipStep2) {
      highestStepReachedRef.current = Math.max(
        highestStepReachedRef.current,
        3
      );
    }
  }, [shouldSkipStep1, shouldSkipStep2, shouldSkipStep3]);

  // Effect to clear onboarding state on unmount after completion
  useEffect(() => {
    return () => {
      if (isOnboardingComplete) {
        clearOnboardingState();
      }
    };
  }, [isOnboardingComplete, clearOnboardingState]);

  // Enhanced effect to detect user profile changes and handle step progression
  useEffect(() => {
    const prevMe = prevMeRef.current;

    // Detect significant changes in user profile that affect onboarding
    const usernameChanged = prevMe?.username !== me?.username;
    const profileImageChanged = prevMe?.profileImage !== me?.profileImage;
    const walletsChanged = prevMe?.wallets?.length !== me?.wallets?.length;

    // If there's a significant change, log it for debugging
    if (usernameChanged || profileImageChanged || walletsChanged) {
      console.log("User profile changed:", {
        usernameChanged: usernameChanged
          ? { from: prevMe?.username, to: me?.username }
          : false,
        profileImageChanged: profileImageChanged
          ? { from: !!prevMe?.profileImage, to: !!me?.profileImage }
          : false,
        walletsChanged: walletsChanged
          ? { from: prevMe?.wallets?.length, to: me?.wallets?.length }
          : false,
      });
    }

    prevMeRef.current = me;
  }, [me]);

  // Effect to handle automatic step skipping and redirection
  useEffect(() => {
    if (!me || isOnboardGuardDisabled || isRefetchingMe) {
      return; // Don't auto-skip if user data isn't loaded, guard is disabled, or we're refetching
    }

    // If all onboarding is complete, redirect to app
    if (isOnboardingComplete) {
      console.log("Onboarding complete, redirecting to /app");
      const params = searchParams.toString();
      router.push(params ? `/app?${params}` : "/app");
      return;
    }

    // Determine the first step that needs to be completed
    let targetStep = 1;

    if (shouldSkipStep1) {
      targetStep = 2;
    }
    if (shouldSkipStep1 && shouldSkipStep2) {
      targetStep = 3;
    }

    // Update highest step reached
    highestStepReachedRef.current = Math.max(
      highestStepReachedRef.current,
      targetStep
    );

    // Only navigate if we need to go to a different step
    if (currentStep !== targetStep) {
      console.log(
        `Auto-navigating from step ${currentStep} to step ${targetStep} (highest reached: ${highestStepReachedRef.current})`
      );
      console.log("Step skip reasons:", {
        shouldSkipStep1: shouldSkipStep1 ? "has username" : "no username",
        shouldSkipStep2: shouldSkipStep2
          ? "has profile image"
          : "no profile image",
        shouldSkipStep3: shouldSkipStep3 ? "has meta keys" : "no meta keys",
      });
      goToStep(targetStep);
    }
  }, [
    me,
    currentStep,
    shouldSkipStep1,
    shouldSkipStep2,
    shouldSkipStep3,
    isOnboardingComplete,
    isOnboardGuardDisabled,
    router,
    goToStep,
    isRefetchingMe,
    searchParams,
  ]);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <UsernameStep
            savedUsername={stepData.username}
            onUsernameChange={(username) =>
              updateStepData("username", username)
            }
          />
        );
      case 2:
        return (
          <ProfileImageStep
            onNext={goToNextStep}
            savedProfileImage={stepData.profileImage}
            onProfileImageChange={(profileImage) =>
              updateStepData("profileImage", profileImage)
            }
          />
        );
      case 3:
        return (
          <PinStep
            savedPin={stepData.pin}
            onPinChange={(pin) => updateStepData("pin", pin)}
          />
        );
      default:
        return (
          <UsernameStep
            savedUsername={stepData.username}
            onUsernameChange={(username) =>
              updateStepData("username", username)
            }
          />
        );
    }
  };

  // Show loading if user data isn't loaded yet or we're refetching
  if (!me || isRefetchingMe) {
    return <FullscreenLoader text="Getting to know you" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white ">
      {/* Top Navigation Bar */}
      <div className="px-6 pt-8">
        <div className="w-full max-w-md mx-auto">
          {/* <button
              onClick={goToPrevStep}
              disabled={!canGoToPrevStep}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                canGoToPrevStep
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              Back
            </button> */}

          {/* <button
              onClick={goToNextStep}
              disabled={!canGoToNextStep}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                canGoToNextStep
                  ? "text-blue-600 hover:bg-blue-50"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              {currentStep === TOTAL_STEPS ? "Complete" : "Continue"}
            </button> */}
          <div className="flex justify-center items-center">
            <StepIndicator
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              className="animate-in fade-in-50 duration-700"
              showBackButton={true}
            />
          </div>
        </div>
      </div>

      {/* Main content area - centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">{renderCurrentStep()}</div>
      </div>
    </div>
  );
}
