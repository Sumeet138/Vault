import React from "react";
import { redirect } from "next/navigation";
import { backend } from "@/lib/api";
import TagIndex from "@/components/pages/tag/TagIndex";
import AppProvider from "@/providers/AppProvider";

type TagPageProps = {
  params: Promise<{
    tagId: string;
  }>;
};

async function getTagData(tagId: string) {
  try {
    const response = await backend.nfcTag.getTag(tagId);
    return response;
  } catch (error) {
    console.error("Error fetching tag data:", error);
    return { error: "Failed to fetch tag data" };
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagId } = await params;
  const response = await getTagData(tagId);

  // If tag is claimed, redirect immediately to user's profile
  if (
    response.data?.success &&
    response.data.data?.status === "CLAIMED" &&
    response.data.data.user?.username
  ) {
    redirect(`/${response.data.data.user.username}`);
  }

  return (
    <AppProvider>
      <TagIndex tagId={tagId} response={response} />
    </AppProvider>
  );
}
