"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  XMarkIcon,
  ArrowPathIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { EASE_OUT_QUART } from "@/config/animation";
import { useIsMounted } from "@/hooks/use-is-mounted";
import jsQR from "jsqr";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeSolved?: (code: string) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onCodeSolved,
}: QRScannerModalProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const startingRef = React.useRef<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const scanningRef = React.useRef<boolean>(false);
  const isMounted = useIsMounted();

  // Use a ref to store the latest onCodeSolved callback to prevent scanner restarts
  const onCodeSolvedRef = React.useRef(onCodeSolved);
  React.useEffect(() => {
    onCodeSolvedRef.current = onCodeSolved;
  }, [onCodeSolved]);

  const stopStream = React.useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {}
      // Clear the srcObject to fully detach the stream
      (video as any).srcObject = null;
    }
  }, []);

  const startScanner = React.useCallback(async () => {
    if (startingRef.current) return; // prevent concurrent starts
    startingRef.current = true;
    setError(null);
    setPermissionDenied(false);
    setResult(null);

    try {
      // Prefer environment camera on mobile
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        // Ensure autoplay compatibility
        video.muted = true;
        (video as any).playsInline = true;
        (video as any).srcObject = stream;
        // Wait for metadata to be ready before playing to avoid interruption errors
        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) {
            resolve();
          } else {
            const handler = () => {
              video.removeEventListener("loadedmetadata", handler);
              resolve();
            };
            video.addEventListener("loadedmetadata", handler, { once: true });
          }
        });
        try {
          await video.play();
        } catch {
          // Autoplay can still be blocked in some environments; ignore here
        }
      }
      scanningRef.current = true;

      const detect = () => {
        if (!scanningRef.current || !videoRef.current || !canvasRef.current)
          return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          requestAnimationFrame(detect);
          return;
        }

        // Set canvas size to match video
        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Skip if video not ready
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          requestAnimationFrame(detect);
          return;
        }

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            setResult(code.data);
            try {
              onCodeSolvedRef.current?.(code.data);
            } catch {}
            scanningRef.current = false;
            stopStream();
            return;
          }
        } catch {
          // Swallow intermittent detection errors
        }

        requestAnimationFrame(detect);
      };

      requestAnimationFrame(detect);
    } catch (e: any) {
      const name = e?.name as string | undefined;
      const message =
        (e?.message as string | undefined) || "Failed to access camera";
      const normalized = message.toLowerCase();

      if (
        name === "NotAllowedError" ||
        name === "SecurityError" ||
        normalized.includes("denied") ||
        normalized.includes("permission")
      ) {
        setPermissionDenied(true);
        setError(
          "Camera access was blocked. Please enable camera permissions in your browser settings and try again."
        );
      } else if (name === "NotFoundError") {
        setError("No camera was found on this device.");
      } else {
        setError(message);
      }
      stopStream();
    }
    startingRef.current = false;
  }, [stopStream]);

  React.useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      scanningRef.current = false;
      stopStream();
      setPermissionDenied(false);
      setError(null);
      setResult(null);
    }
    return () => {
      scanningRef.current = false;
      stopStream();
      setPermissionDenied(false);
    };
  }, [isOpen, startScanner, stopStream]);

  const handleTryAgain = React.useCallback(() => {
    if (startingRef.current) return;
    setPermissionDenied(false);
    setError(null);
    setResult(null);
    scanningRef.current = true;
    void startScanner();
  }, [startScanner]);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="flex-1 px-4 pt-4 pb-4">
              <div className="relative w-full h-full overflow-hidden rounded-[2rem] bg-gray-100">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />
                {permissionDenied && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                      <ShieldExclamationIcon className="h-7 w-7 text-amber-300" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">
                        Camera access is blocked
                      </h3>
                      <p className="text-sm text-white/70 max-w-sm mx-auto">
                        Please enable camera permissions for SHINGRU in your
                        browser settings, then choose “Try again”.
                      </p>
                    </div>
                    <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleTryAgain}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100"
                      >
                        <ArrowPathIcon className="mr-2 h-4 w-4" />
                        Try again
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          scanningRef.current = false;
                          stopStream();
                          onClose();
                        }}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    scanningRef.current = false;
                    stopStream();
                    onClose();
                  }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-700" />
                </button>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[72%] max-w-[520px] aspect-square rounded-[2rem]">
                    <div className="absolute inset-0 rounded-[2rem] ring-2 ring-primary-400/80 shadow-[0_0_40px_-4px] shadow-primary-500/60" />
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-primary-300/70 to-transparent animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-1">
              {permissionDenied ? null : result ? (
                <div className="bg-white rounded-[1.6rem] p-4 shadow-supa-smooth">
                  <div className="text-xs text-gray-500 mb-1">
                    Scanned content
                  </div>
                  <div className="text-sm break-all p-3 rounded-xl bg-gray-50">
                    {result}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      className="px-4 py-2 rounded-xl bg-gray-950 text-white text-sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(result);
                        } catch {}
                      }}
                    >
                      Copy
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm"
                      onClick={() => {
                        scanningRef.current = true;
                        setResult(null);
                        startScanner();
                      }}
                    >
                      Scan again
                    </button>
                    <button
                      className="ml-auto px-4 py-2 rounded-xl bg-primary-500 text-white text-sm"
                      onClick={() => {
                        onClose();
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600 w-full justify-center font-semibold">
                  Point your camera at a QR code
                </div>
              )}
              {!permissionDenied && error && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body!
  );
}
