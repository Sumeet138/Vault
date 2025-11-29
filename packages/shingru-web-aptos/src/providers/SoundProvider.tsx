"use client";

import { Howl } from "howler";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useRef,
} from "react";

export const Sound = {
  SUCCESS: "/assets/sounds/success.wav",
  SUCCESS_2: "/assets/sounds/success-2.wav",
  SUCCESS_POP: "/assets/sounds/success-pop.wav",
  ERROR: "/assets/sounds/error.wav",
}

type SoundOptions = {
  interrupt?: boolean;
};

type SoundKey = typeof Sound[keyof typeof Sound];

type SoundContextType = {
  playSound: (sound: SoundKey, options?: SoundOptions) => void;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
};

export const SoundProvider = ({ children }: PropsWithChildren) => {
  const nowPlayingRef = useRef<Howl | null>(null);

  const playSound = useCallback(
    (sound: SoundKey, options: SoundOptions = {}) => {
      if (options.interrupt && nowPlayingRef.current) {
        nowPlayingRef.current.stop();
      }

      const newSound = new Howl({
        src: [sound],
        html5: true,
      });

      newSound.play();
      nowPlayingRef.current = newSound;
    },
    []
  );

  return (
    <SoundContext.Provider value={{ playSound }}>
      {children}
    </SoundContext.Provider>
  );
};
