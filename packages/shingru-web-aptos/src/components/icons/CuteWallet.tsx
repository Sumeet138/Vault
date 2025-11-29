import * as React from "react";
import { SVGProps } from "react";

const CuteWallet = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path fill="#fff" fillOpacity={0.01} d="M24 0v24H0V0h24Z" />
    <path
      fill="#F7F9FC"
      fillRule="evenodd"
      d="M5.5 6a.5.5 0 0 0 0 1h9.058c1.575 0 3.544-.196 4.877.827.908.696 1.354 1.695 1.481 2.821a26.264 26.264 0 0 1 0 5.704c-.127 1.126-.573 2.125-1.481 2.821-1.332 1.023-3.302.827-4.877.827H9.93c-1.85 0-4.321.265-5.757-1.172C2.735 17.392 3 14.92 3 13.071V6.5A2.5 2.5 0 0 1 5.5 4H16a1 1 0 0 1 0 2H5.5Zm8.5 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
      clipRule="evenodd"
    />
  </svg>
);
export default CuteWallet;
