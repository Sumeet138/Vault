"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CuteButton from "@/components/common/CuteButton";

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSeed = async () => {
    setIsSeeding(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/rwa/seed-now", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        // Redirect to RWA page after 2 seconds
        setTimeout(() => {
          router.push("/app/rwa");
        }, 2000);
      } else {
        setError(data.error || "Failed to seed database");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Seed RWA Database</h1>
          <p className="text-gray-600">
            This will populate the database with sample assets
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-medium mb-2">
              ✅ {result.message}
            </p>
            <div className="space-y-1">
              {result.assets?.map((asset: any, idx: number) => (
                <p key={idx} className="text-green-700 text-sm">
                  • {asset.name} - {asset.availableShares}/{asset.totalShares} shares @ {asset.pricePerShare} APT
                </p>
              ))}
            </div>
            <p className="text-green-600 text-xs mt-2">
              Redirecting to RWA page...
            </p>
          </div>
        )}

        <CuteButton
          color="primary"
          variant="solid"
          size="lg"
          fullWidth
          isDisabled={isSeeding}
          isLoading={isSeeding}
          onPress={handleSeed}
        >
          {isSeeding ? "Seeding Database..." : "Seed Database Now"}
        </CuteButton>

        <CuteButton
          color="gray"
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.push("/app/rwa")}
        >
          Back to RWA
        </CuteButton>
      </div>
    </div>
  );
}

