import { create } from "zustand";

type ModalStore = {
  isOpen: boolean;
  setOpen: (s: boolean) => void;
};

export const useModalStore = create<ModalStore>()((set) => ({
  isOpen: false,
  setOpen: (s) => set({ isOpen: s }),
}));
