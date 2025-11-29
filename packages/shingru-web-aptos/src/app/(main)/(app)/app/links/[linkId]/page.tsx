import LinkDetailIndex from "@/components/pages/(app)/links/link-detail/LinkDetailIndex";

export const dynamic = "force-dynamic";

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;

  return <LinkDetailIndex linkId={linkId} />;
}
