import CreateLinkIndex from "@/components/pages/(app)/create-link/CreateLinkIndex";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Link - SHINGRU",
};

export default function CreateLinkPage() {
  return <CreateLinkIndex />;
}
