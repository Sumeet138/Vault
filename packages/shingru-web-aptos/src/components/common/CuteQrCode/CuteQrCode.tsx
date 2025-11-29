"use client";

import { useEffect, useRef, ReactNode, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import FinderPattern from "./FinderPattern";
import { COLOR_PICKS } from "@/config/styling";

interface CuteQrCodeProps {
  value: string;
  size: number;
  level?: "L" | "M" | "Q" | "H";
  bgColor?: string;
  fgColor?: string;
  color?: string;
  logo?: ReactNode;
  logoSize?: number;
}

const CuteQrCode = ({
  value,
  size,
  level = "H",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  color = "blue",
  logo,
  logoSize = 50,
}: CuteQrCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<
    { x: number; y: number; hoverIntensity: number; scaleIntensity: number }[]
  >([]);
  const ripple = useRef({ radius: Infinity, intensity: 0 });
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const isRippling = useRef(false);
  const lastMoveTime = useRef(0);

  const { contextSafe } = useGSAP({ scope: wrapperRef });

  const hoverColor = COLOR_PICKS.find((c) => c.id === color)?.value || "#ffffff";

  const handleMouseEnter = contextSafe(() => {
    gsap.to(logoRef.current, {
      scale: 0.95,
      duration: 0.3,
      ease: "power3.out",
    });
  });

  const handleMouseLeave = contextSafe(() => {
    gsap.to(logoRef.current, { scale: 1, duration: 0.3, ease: "power3.out" });
  });

  const handleMouseDown = contextSafe(() => {
    gsap.to(logoRef.current, { scale: 0.9, duration: 0.2, ease: "power3.out" });
  });

  const handleMouseUp = contextSafe(() => {
    if (isRippling.current) return;

    isRippling.current = true;

    // Logo scale and rotation
    gsap
      .timeline()
      .to(logoRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power3.inOut",
      })
      .to(logoRef.current, {
        rotationY: "+=360",
        duration: 0.8,
        ease: "power3.out",
      });

    // Ripple animation
    const maxRadius = (Math.sqrt(2) * size) / 2;
    const rippleWidth = size * 0.35;
    ripple.current = { radius: 0, intensity: 1 }; // Reset state

    gsap
      .timeline({
        onComplete: () => {
          isRippling.current = false;
        },
      })
      .to(
        ripple.current,
        {
          radius: maxRadius + rippleWidth,
          duration: 1.5,
          ease: "power2.out",
        },
        0,
      )
      .to(
        ripple.current,
        {
          intensity: 0,
          duration: 0.8,
          ease: "power1.inOut",
        },
        "-=0.8",
      );
  });

  const handleWrapperMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    lastMoveTime.current = Date.now();
  };

  const handleWrapperMouseLeave = () => {
    mousePos.current = null;
  };

  const qrData = useMemo(() => {
    if (!value) return null;
    try {
      return QRCode.create(value, { errorCorrectionLevel: level });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [value, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [size]);

  useEffect(() => {
    if (!qrData) {
      dotsRef.current = [];
      return;
    }

    const newDots: {
      x: number;
      y: number;
      hoverIntensity: number;
      scaleIntensity: number;
    }[] = [];
    const moduleCount = qrData.modules.size;
    const moduleSize = size / moduleCount;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrData.modules.get(row, col)) {
          const isFinder =
            (row <= 6 && col <= 6) ||
            (row >= moduleCount - 7 && col <= 6) ||
            (row <= 6 && col >= moduleCount - 7);

          const centerSize = Math.floor(moduleCount * 0.3);
          const isCenter =
            row >= (moduleCount - centerSize) / 2 &&
            row < (moduleCount + centerSize) / 2 &&
            col >= (moduleCount - centerSize) / 2 &&
            col < (moduleCount + centerSize) / 2;

          if (!isFinder && !isCenter) {
            newDots.push({
              x: col * moduleSize + moduleSize / 2,
              y: row * moduleSize + moduleSize / 2,
              hoverIntensity: 0,
              scaleIntensity: 0,
            });
          }
        }
      }
    }
    dotsRef.current = newDots;
  }, [qrData, size]);

  useEffect(() => {
    const colorInterpolator = gsap.utils.interpolate(
      fgColor,
      hoverColor || fgColor,
    );

    const animationLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas || !qrData) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const moduleSize = size / qrData.modules.size;
      const rippleWidth = size * 0.35;
      const maxDisplacement = size * 0.05;

      // Parameters for the color trail
      const colorHoverRadius = size * 0.25;
      const colorDecayFactor = 0.97;

      // Parameters for the scale trail (tighter and faster)
      const scaleHoverRadius = size * 0.06;
      const scaleDecayFactor = 0.89;

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);

      dotsRef.current.forEach((dot) => {
        // --- Update State ---
        if (mousePos.current) {
          const dist = Math.sqrt(
            (dot.x - mousePos.current.x) ** 2 +
              (dot.y - mousePos.current.y) ** 2,
          );

          // Update color intensity based on its own radius
          if (dist < colorHoverRadius) {
            dot.hoverIntensity = 1;
          }

          // Only update scale if mouse is not idle
          if (Date.now() - lastMoveTime.current < 1500) {
            if (dist < scaleHoverRadius) {
              dot.scaleIntensity = 1;
            }
          }
        }
        dot.hoverIntensity *= colorDecayFactor;
        dot.scaleIntensity *= scaleDecayFactor;

        // --- Calculate Animation Properties ---
        let rippleOpacity = 1;
        let rippleDx = 0;
        let rippleDy = 0;
        let rippleColorIntensity = 0;

        const distanceToCenter = Math.sqrt(
          (dot.x - size / 2) ** 2 + (dot.y - size / 2) ** 2,
        );
        const diff = ripple.current.radius - distanceToCenter;

        if (diff > 0 && diff < rippleWidth) {
          const midPoint = rippleWidth / 2;
          const proximityToMid = Math.abs(diff - midPoint);
          rippleOpacity = (proximityToMid / midPoint) * 0.9 + 0.1;

          const waveProgress = diff / rippleWidth;
          const displacementMagnitude =
            maxDisplacement * Math.sin(waveProgress * Math.PI);
          rippleColorIntensity = Math.sin(waveProgress * Math.PI);

          if (distanceToCenter > 0) {
            rippleDx =
              ((dot.x - size / 2) / distanceToCenter) * displacementMagnitude;
            rippleDy =
              ((dot.y - size / 2) / distanceToCenter) * displacementMagnitude;
          }
        }

        // --- Blend Effects ---
        const { intensity: rippleIntensity } = ripple.current;

        const finalDx = rippleDx * rippleIntensity;
        const finalDy = rippleDy * rippleIntensity;

        const finalOpacity = 1 - (1 - rippleOpacity) * rippleIntensity;

        const finalColorIntensity =
          dot.hoverIntensity * (1 - rippleIntensity) +
          rippleColorIntensity * rippleIntensity;

        const hoverScale = 1 - dot.scaleIntensity;
        const finalScale =
          hoverScale * (1 - rippleIntensity) + 1 * rippleIntensity;

        // --- Draw Dot ---
        const color = colorInterpolator(finalColorIntensity);
        ctx.fillStyle = color;
        ctx.globalAlpha = finalOpacity;
        ctx.beginPath();
        ctx.arc(
          dot.x + finalDx,
          dot.y + finalDy,
          (moduleSize / 2) * 0.7 * finalScale,
          0,
          2 * Math.PI,
        );
        ctx.fill();
        ctx.globalAlpha = 1; // Reset global alpha
      });
    };

    gsap.ticker.add(animationLoop);
    return () => {
      gsap.ticker.remove(animationLoop);
    };
  }, [qrData, size, bgColor, fgColor, hoverColor]);

  if (!qrData) {
    return (
      <div style={{ width: size, height: size, position: "relative" }}>
        <canvas ref={canvasRef} />
      </div>
    );
  }

  const finderPatternSize = 7 * (size / qrData.modules.size);

  return (
    <div
      ref={wrapperRef}
      style={{ width: size, height: size, position: "relative" }}
      onMouseMove={handleWrapperMouseMove}
      onMouseLeave={handleWrapperMouseLeave}
    >
      <canvas ref={canvasRef} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <FinderPattern x={0} y={0} size={finderPatternSize} color={fgColor} />
        <FinderPattern
          x={size - finderPatternSize}
          y={0}
          size={finderPatternSize}
          color={fgColor}
        />
        <FinderPattern
          x={0}
          y={size - finderPatternSize}
          size={finderPatternSize}
          color={fgColor}
        />
      </div>
      {logo && (
        <div
          ref={logoRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: logoSize,
            height: logoSize,
            backgroundColor: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "8px",
            padding: "4px",
            cursor: "pointer",
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}
        >
          {logo}
        </div>
      )}
    </div>
  );
};

export default CuteQrCode;
