'use client';

import { useEffect, useRef, ReactNode, useMemo } from 'react';
import QRCode from 'qrcode';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import FinderPattern from './FinderPattern';

interface CuteQrCodeProps {
  value: string;
  size: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  bgColor?: string;
  fgColor?: string;
  logo?: ReactNode;
  logoSize?: number;
}

const CuteQrCode = ({
  value,
  size,
  level = 'H',
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  logo,
  logoSize = 50,
}: CuteQrCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: logoRef });

  const handleMouseDown = contextSafe(() => {
    gsap.to(logoRef.current, { scale: 0.9, duration: 0.2, ease: 'power3.out' });
  });

  const handleMouseUp = contextSafe(() => {
    gsap
      .timeline()
      .to(logoRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'power3.inOut',
      })
      .to(logoRef.current, {
        rotationY: '+=360',
        duration: 0.8,
        ease: 'power3.out',
      });
  });

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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!qrData) {
      ctx.clearRect(0, 0, size, size);
      return;
    }

    const moduleCount = qrData.modules.size;
    const moduleSize = size / moduleCount;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Draw the dots
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrData.modules.get(row, col)) {
          // Check if the module is part of the finder patterns
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
            ctx.fillStyle = fgColor;
            ctx.beginPath();
            ctx.arc(
              col * moduleSize + moduleSize / 2,
              row * moduleSize + moduleSize / 2,
              (moduleSize / 2) * 0.7,
              0,
              2 * Math.PI,
            );
            ctx.fill();
          }
        }
      }
    }
  }, [size, bgColor, fgColor, qrData]);

  if (!qrData) {
    return (
      <div style={{ width: size, height: size, position: 'relative' }}>
        <canvas ref={canvasRef} width={size} height={size} />
      </div>
    );
  }

  const finderPatternSize = 7 * (size / qrData.modules.size);

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <canvas ref={canvasRef} width={size} height={size} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
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
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: logoSize,
            height: logoSize,
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '8px',
            padding: '4px',
            cursor: 'pointer',
            transformStyle: 'preserve-3d',
            perspective: '1000px',
          }}
        >
          {logo}
        </div>
      )}
    </div>
  );
};

export default CuteQrCode;
