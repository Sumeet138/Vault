import * as React from "react";
import { SVGProps } from "react";
const GreenCloud = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={54}
    height={53}
    fill="none"
    {...props}
  >
    <g filter="url(#a)">
      <path
        fill="#7EFE9F"
        fillRule="evenodd"
        d="M27.32 10.13a6.63 6.63 0 0 1 4.688 3.648 4.948 4.948 0 0 1 3.125-.393 4.989 4.989 0 0 1 3.91 5.869 4.978 4.978 0 0 1-.775 1.844 7.492 7.492 0 0 1-.61 13.56c-.886 3.374-4.253 5.515-7.714 4.824a6.631 6.631 0 0 1-1.848-.663 6.606 6.606 0 0 1-4.986.994 6.638 6.638 0 0 1-4.92-4.19c-2.267.545-4.456-.02-5.547-1.645-1.245-1.854-.678-4.516 1.204-6.55-2.231-2.372-3.122-5.377-2.03-7.9 1.149-2.652 4.182-4.065 7.645-3.898.015-.092.03-.184.05-.277.716-3.603 4.212-5.941 7.807-5.223Zm3.132 11.478a6.676 6.676 0 0 1-.589.47l.02.042c.192-.17.393-.329.6-.478l-.031-.034Z"
        clipRule="evenodd"
      />
      <path
        stroke="#fff"
        strokeWidth={1.208}
        d="M18.969 15.013c.879-3.803 4.62-6.245 8.468-5.476l.43.1a7.224 7.224 0 0 1 4.414 3.374 5.552 5.552 0 0 1 2.971-.218 5.593 5.593 0 0 1 3.85 8.087 8.097 8.097 0 0 1 3.632 8.437 8.071 8.071 0 0 1-4.573 5.777c-1.077 3.516-4.656 5.715-8.336 4.98a7.241 7.241 0 0 1-1.695-.563 7.205 7.205 0 0 1-5.139.894 7.235 7.235 0 0 1-5.166-4.092c-2.253.39-4.493-.226-5.683-1.998-1.369-2.038-.81-4.776.899-6.881-2.073-2.423-2.932-5.48-1.778-8.146 1.22-2.82 4.296-4.29 7.706-4.275Z"
      />
    </g>
    <path
      stroke="#000"
      strokeLinecap="round"
      strokeWidth={1.663}
      d="M23.208 21.18c.574 1.529 2.355 3.863 4.883.976m2.441.487c.574 1.528 2.355 3.862 4.883.976m-8.135 2.614c.317 1.064 1.58 2.067 3.255.65"
    />
    <defs>
      <filter
        id="a"
        width={53.172}
        height={52.175}
        x={0.232}
        y={0.494}
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dy={1.611} />
        <feGaussianBlur stdDeviation={4.954} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
        <feBlend
          in2="BackgroundImageFix"
          result="effect1_dropShadow_2592_490"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_2592_490"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);
export default GreenCloud;
