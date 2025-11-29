import SettingsIndex from "@/components/pages/(app)/settings/SettingsIndex";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Vault",
};

export default function SettingsPage() {
  return <SettingsIndex />;
}
