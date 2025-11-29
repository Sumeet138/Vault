import { create } from "zustand";
import type { ReactNode } from "react";

interface AppHeaderOverride {
  title?: string | null;
  showBackButton?: boolean;
  onBack?: (() => void) | null;
  rightButton?: {
    icon: ReactNode;
    onPress: () => void;
    ariaLabel?: string;
  } | null;
}

interface AppHeaderStore {
  override: AppHeaderOverride | null;
  setOverride: (override: AppHeaderOverride | null) => void;
}

export const useAppHeaderStore = create<AppHeaderStore>()((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}));
