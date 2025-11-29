import AppProvider from "@/providers/AppProvider";
import { PropsWithChildren } from "react";

export default function MainAppLayout({ children }: PropsWithChildren) {
  return <AppProvider>{children}</AppProvider>;
}
