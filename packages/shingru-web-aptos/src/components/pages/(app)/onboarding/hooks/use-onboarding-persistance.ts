import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";

interface OnboardingData {
  currentStep: number;
  stepData: {
    username?: string;
    profileImage?: string;
    pin?: string;
  };
  userId: string;
  timestamp: number;
}

const ONBOARDING_STORAGE_KEY = "shingru-onboarding-state";
const MAX_STORAGE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function useOnboardingPersistence(totalSteps: number) {
  const { me, isSignedIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<OnboardingData["stepData"]>({});

  // Generate user-specific storage key
  const getStorageKey = useCallback(() => {
    if (!me?.id) return null;
    return `${ONBOARDING_STORAGE_KEY}-${me.id}`;
  }, [me?.id]);

  // Load onboarding state from localStorage
  const loadOnboardingState = useCallback(() => {
    if (!isSignedIn || !me?.id) return;

    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;

      const data: OnboardingData = JSON.parse(stored);

      // Validate stored data
      if (
        !data ||
        typeof data !== "object" ||
        typeof data.currentStep !== "number" ||
        typeof data.userId !== "string" ||
        typeof data.timestamp !== "number" ||
        !data.stepData
      ) {
        console.warn("Invalid onboarding data structure, clearing...");
        localStorage.removeItem(storageKey);
        return;
      }

      // Check if data is too old
      if (Date.now() - data.timestamp > MAX_STORAGE_AGE) {
        console.log("Onboarding data expired, clearing...");
        localStorage.removeItem(storageKey);
        return;
      }

      // Check if data belongs to current user
      if (data.userId !== me.id) {
        console.log("Onboarding data belongs to different user, clearing...");
        localStorage.removeItem(storageKey);
        return;
      }

      // Validate step range
      if (data.currentStep < 1 || data.currentStep > totalSteps) {
        console.warn("Invalid step number, resetting to step 1");
        setCurrentStep(1);
        return;
      }

      // Restore state
      setCurrentStep(data.currentStep);
      setStepData(data.stepData);
      console.log("Onboarding state restored:", {
        step: data.currentStep,
        userId: data.userId,
      });
    } catch (error) {
      console.error("Error loading onboarding state:", error);
      // Clear corrupted data
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
    }
  }, [isSignedIn, me?.id, getStorageKey, totalSteps]);

  // Save onboarding state to localStorage
  const saveOnboardingState = useCallback(() => {
    if (!isSignedIn || !me?.id) return;

    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const data: OnboardingData = {
        currentStep,
        stepData,
        userId: me.id,
        timestamp: Date.now(),
      };

      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log("Onboarding state saved:", {
        step: currentStep,
        userId: me.id,
      });
    } catch (error) {
      console.error("Error saving onboarding state:", error);
    }
  }, [isSignedIn, me?.id, getStorageKey, currentStep, stepData]);

  // Clear onboarding state
  const clearOnboardingState = useCallback(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
      console.log("Onboarding state cleared");
    }
    setCurrentStep(1);
    setStepData({});
  }, [getStorageKey]);

  // Clear onboarding state for all users (useful for logout)
  const clearAllOnboardingStates = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(ONBOARDING_STORAGE_KEY)) {
          localStorage.removeItem(key);
        }
      });
      console.log("All onboarding states cleared");
    } catch (error) {
      console.error("Error clearing all onboarding states:", error);
    }
    setCurrentStep(1);
    setStepData({});
  }, []);

  // Step navigation helpers
  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  // Update step data helpers
  const updateStepData = useCallback(
    (key: keyof OnboardingData["stepData"], value: string) => {
      setStepData((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // Load state when user signs in
  useEffect(() => {
    if (isSignedIn && me?.id) {
      loadOnboardingState();
    } else {
      // Reset local state when not signed in
      setCurrentStep(1);
      setStepData({});
    }
  }, [isSignedIn, me?.id, loadOnboardingState]);

  // Save state whenever it changes
  useEffect(() => {
    if (isSignedIn && me?.id) {
      saveOnboardingState();
    }
  }, [currentStep, stepData, saveOnboardingState, isSignedIn, me?.id]);

  // Computed values
  const canGoToPrevStep = currentStep > 1;
  const canGoToNextStep = currentStep < totalSteps;

  return {
    currentStep,
    stepData,
    canGoToPrevStep,
    canGoToNextStep,
    goToNextStep,
    goToPrevStep,
    goToStep,
    updateStepData,
    clearOnboardingState,
    clearAllOnboardingStates,
  };
}
