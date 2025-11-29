import { Transition } from "motion/react";

export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;
export const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_SNAPPY_OUT = [0.19, 1, 0.22, 1] as const;

export const SPRING_SMOOTH_ONE = {
  type: "spring",
  duration: 0.45,
  bounce: 0,
} as Transition;

export const SPRING_BOUNCE_ONE = {
  type: "spring",
  duration: 0.6,
  bounce: 0.45,
} as Transition;

export const SPRING_SMOOTH_TWO = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as Transition;

type TransitionName =
  | "SPRING_SMOOTH_ONE"
  | "SPRING_BOUNCE_ONE"
  | "SPRING_SMOOTH_TWO";

export const getTransitionConfig = (type: TransitionName) => {
  switch (type) {
    case "SPRING_SMOOTH_ONE":
      return SPRING_SMOOTH_ONE;
    case "SPRING_BOUNCE_ONE":
      return SPRING_BOUNCE_ONE;
    case "SPRING_SMOOTH_TWO":
      return SPRING_SMOOTH_TWO;
  }
};
