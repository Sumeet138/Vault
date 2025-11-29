import { useMediaQuery } from "usehooks-ts";

export const useIsMobile = () => {
  const isMobile = !useMediaQuery("(min-width: 768px)");
  return isMobile;
};
