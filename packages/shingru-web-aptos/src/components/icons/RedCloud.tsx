import * as React from "react";
import { SVGProps } from "react";
const RedCloud = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={47}
    height={45}
    fill="none"
    {...props}
  >
    <g filter="url(#a)">
      <path
        fill="#FF392B"
        fillRule="evenodd"
        d="M19.619 8.44c1.87-.29 3.67.35 4.928 1.576a4.339 4.339 0 0 1 7.31 4.103 6.51 6.51 0 0 1 3.551 11.258 5.785 5.785 0 0 1-6.583 6.26 5.767 5.767 0 0 1-3.784 2.305 5.781 5.781 0 0 1-5.278-1.949c-1.693 1.123-3.653 1.317-5.031.317-1.573-1.142-1.904-3.486-.973-5.71-2.533-1.269-4.16-3.456-4.02-5.844.148-2.51 2.208-4.572 5.093-5.473a5.785 5.785 0 0 1 4.787-6.844Z"
        clipRule="evenodd"
      />
      <path
        stroke="#fff"
        strokeWidth={1.025}
        d="M19.54 7.933a6.295 6.295 0 0 0-5.28 7.004c-2.797 1.006-4.876 3.124-5.032 5.789-.148 2.52 1.47 4.758 3.892 6.113-.774 2.23-.414 4.633 1.31 5.885 1.501 1.09 3.517.92 5.244-.075a6.288 6.288 0 0 0 5.445 1.8 6.276 6.276 0 0 0 3.936-2.27 6.297 6.297 0 0 0 6.88-6.602 7.008 7.008 0 0 0 2.018-6.079 7.024 7.024 0 0 0-5.495-5.796 4.852 4.852 0 0 0-7.917-4.378 6.281 6.281 0 0 0-5-1.391Z"
      />
    </g>
    <path
      fill="#fff"
      d="M23.316 24.146c.84.142 3.01.078 5.322-.826 1.614-.63 1.65 1.82.936 3.4-.465 1.03-1.29 1.875-2.724 1.72-1.31-.142-2.276-.574-2.958-1.076-1.072-.79-1.889-3.44-.576-3.218Z"
    />
    <path
      fill="#FFC545"
      stroke="#FFC545"
      strokeLinecap="round"
      strokeWidth={0.106}
      d="m29.385 16.583 1.524.502a.106.106 0 0 1 .037.18l-1.287 1.14a.104.104 0 0 0-.027.036l-.702 1.586a.106.106 0 0 1-.178.025l-1.049-1.241a.106.106 0 0 0-.037-.029l-1.682-.75a.106.106 0 0 1-.022-.181l1.386-1.072a.107.107 0 0 0 .035-.047l.597-1.634a.106.106 0 0 1 .183-.03l1.172 1.48c.013.016.03.028.05.035ZM22.46 18.257l1.524.502a.106.106 0 0 1 .037.18l-1.287 1.14a.104.104 0 0 0-.027.036l-.702 1.586a.106.106 0 0 1-.178.025l-1.049-1.241a.106.106 0 0 0-.037-.029l-1.682-.75a.106.106 0 0 1-.021-.181l1.385-1.072a.106.106 0 0 0 .035-.047l.597-1.634a.106.106 0 0 1 .183-.03l1.172 1.48c.013.016.03.028.05.035Z"
    />
    <defs>
      <filter
        id="a"
        width={46.651}
        height={44.498}
        x={0.302}
        y={0.308}
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dy={1.366} />
        <feGaussianBlur stdDeviation={4.202} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
        <feBlend
          in2="BackgroundImageFix"
          result="effect1_dropShadow_2592_493"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_2592_493"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);
export default RedCloud;
