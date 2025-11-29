import LinksIndex from "@/components/pages/(app)/links/LinksIndex";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Links - Vault",
};

export default function LinksPage() {
  return <LinksIndex />;
}
