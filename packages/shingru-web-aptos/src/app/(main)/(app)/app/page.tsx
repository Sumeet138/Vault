import AppIndex from "@/components/pages/(app)/app/AppIndex";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - SHINGRU",
};

export default function AppPage() {
  return <AppIndex />;
}
