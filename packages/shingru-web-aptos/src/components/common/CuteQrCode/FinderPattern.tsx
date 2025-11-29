'use client';

import { useState } from 'react';

interface FinderPatternProps {
  x: number;
  y: number;
  size: number;
  color: string;
}

const FinderPattern = ({ x, y, size, color }: FinderPatternProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: 'absolute',
        top: y,
        left: x,
        transition: 'transform 0.3s ease-out, filter 0.3s ease-out',
        transform: isHovered ? 'scale(0.95)' : 'scale(1)',
        filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <defs>
        <clipPath id="clip">
          <rect width={size} height={size} rx={size * 0.3} />
        </clipPath>
      </defs>
      <g clipPath="url(#clip)">
        <rect width={size} height={size} fill={color} />
        <rect
          x={size * 0.15}
          y={size * 0.15}
          width={size * 0.7}
          height={size * 0.7}
          fill="white"
          rx={size * 0.2}
        />
        <rect
          x={size * 0.3}
          y={size * 0.3}
          width={size * 0.4}
          height={size * 0.4}
          fill={color}
          rx={size * 0.1}
        />
      </g>
    </svg>
  );
};

export default FinderPattern;
