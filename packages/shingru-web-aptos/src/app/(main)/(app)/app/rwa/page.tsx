import RWAIndex from "@/components/pages/(app)/rwa/RWAIndex";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real World Assets - Vault",
};

export default function RWAPage() {
  return <RWAIndex />;
}

