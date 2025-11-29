"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { ApiResponse } from "@/lib/api/client";
import { NfcTagApiResponse } from "@/lib/api/nfcTag";
import { useAuth } from "@/providers/AuthProvider";
import MainButton from "@/components/common/MainButton";
import EmojiRain from "@/components/common/EmojiRain";
import { storePendingNfcTag } from "@/utils/nfc-storage";

type TagIndexProps = {
  tagId: string;
  response: ApiResponse<NfcTagApiResponse>;
};

const TagError = ({ errorMessage }: { errorMessage: string }) => (
  <main className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-lg p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Tag Not Found
            </h1>
            <p className="text-gray-600 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-4">
        <span>❌</span>
        <span>Invalid NFC tag</span>
      </div>
    </div>
  </main>
);

const TagAvailable = ({ tagId }: { tagId: string }) => {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Store tagId in localStorage for claiming
    storePendingNfcTag(tagId);

    // If signed in, immediately redirect without showing loading UI
    if (isSignedIn) {
      router.replace("/app");
    }
  }, [isSignedIn, tagId, router]);

  const handleSignIn = () => {
    // Store tagId before redirecting to login
    storePendingNfcTag(tagId);
    router.push("/login");
  };

  // Don't render anything for signed-in users - just redirect
  if (isSignedIn) {
    return null;
  }

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      <EmojiRain />
      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-3xl shadow-supa-smooth p-8">
          <div className="flex flex-col items-center space-y-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="text-4xl font-bold text-gray-900">shingru</div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Claim this NFC tag! 🏷️
                </h1>
                <p className="text-gray-600">
                  Sign in to link it to your SHINGRU username and share your
                  personal payment link with just a tap ✨
                </p>
              </div>
            </div>

            <div className="w-full">
              <MainButton
                onClick={handleSignIn}
                className="w-full px-4"
                color="primary"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>Sign In to Claim</span>
                </span>
              </MainButton>
            </div>
          </div>
        </div>

        {/* <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-4">
          <span>Tag ID: {tagId}</span>
        </div> */}
      </div>
    </main>
  );
};

const TagFallback = () => (
  <main className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
      <div className="flex flex-col items-center space-y-4">
        <p className="text-gray-600">Processing...</p>
      </div>
    </div>
  </main>
);

export default function TagIndex({ tagId, response }: TagIndexProps) {
  if (response.error || !response.data?.success) {
    const errorMessage = response.error || "NFC tag not found";
    return <TagError errorMessage={errorMessage} />;
  }

  if (response.data?.data?.status === "AVAILABLE") {
    return <TagAvailable tagId={tagId} />;
  }

  return <TagFallback />;
}
