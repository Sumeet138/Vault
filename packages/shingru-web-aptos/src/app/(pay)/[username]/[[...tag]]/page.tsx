import UsernamePayIndex from "@/components/pages/(app)/username-pay/UsernamePayIndex";
import { addressService } from "@/lib/api/address";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ username: string; tag: string[] }>;
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { username, tag: _tag } = await params;
  const tag = _tag && _tag.length > 0 ? _tag[0] : undefined;

  const response = await addressService.getAddressByUserTag(username, tag);

  if (response.error || !response.data) {
    return {
      title: "Page Not Found - SHINGRU",
    };
  }

  const { userData, linkData } = response.data;

  const pageTitle = linkData
    ? `"${linkData.label}" by @${userData.username}`
    : `Pay @${userData.username} with crypto`;
  const title = `${pageTitle} | SHINGRU`;

  const description = linkData
    ? linkData.description ||
      `Make a payment for "${linkData.label}" to @${userData.username} through a SHINGRU link.`
    : `Send cryptocurrency to @${userData.username} quickly and securely with SHINGRU.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${username}${tag ? `/${tag}` : ""}`,
      siteName: "SHINGRU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: `@${userData.username}`,
    },
  };
};

export default async function UsernamePay({ params }: Props) {
  const { username, tag: _tag } = await params;

  const tag = _tag && _tag.length > 0 ? _tag[0] : "";
  
  // Try to get data from backend
  const response = await addressService.getAddressByUserTag(username, tag);

  // If backend fails (backend-less mode), pass null and let client-side handle it
  if (response.error || !response.data) {
    console.log("Backend not available, using client-side data fetching");
    // Don't return notFound() - let the client component handle it
    return (
      <UsernamePayIndex
        username={username}
        tag={tag}
        initialData={null}
      />
    );
  }

  return (
    <UsernamePayIndex
      username={username}
      tag={tag}
      initialData={response.data}
    />
  );
}
