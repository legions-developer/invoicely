import { IconProps } from "@/types";
import React from "react";

function Receipt2({ fill = "currentColor", secondaryfill, ...props }: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M2.5 2.97739H15.5V16.25C15.5 16.5147 15.3605 16.7598 15.1328 16.8949C14.9052 17.0301 14.6232 17.0352 14.3909 16.9084L11.9849 15.5961L9.33541 16.9208C9.12426 17.0264 8.87574 17.0264 8.66459 16.9208L6.0151 15.5961L3.60914 16.9084C3.37676 17.0352 3.09477 17.0301 2.86715 16.8949C2.63953 16.7598 2.5 16.5147 2.5 16.25V2.97739Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
        <path
          d="M11 11.25C11 10.8358 11.3358 10.5 11.75 10.5H12.25C12.6642 10.5 13 10.8358 13 11.25C13 11.6642 12.6642 12 12.25 12H11.75C11.3358 12 11 11.6642 11 11.25Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M1 2.75C1 2.33579 1.33579 2 1.75 2H16.25C16.6642 2 17 2.33579 17 2.75C17 3.16421 16.6642 3.5 16.25 3.5H1.75C1.33579 3.5 1 3.16421 1 2.75Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M5 11.25C5 10.8358 5.33579 10.5 5.75 10.5H9.25C9.66421 10.5 10 10.8358 10 11.25C10 11.6642 9.66421 12 9.25 12H5.75C5.33579 12 5 11.6642 5 11.25Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M5 8.25C5 7.83579 5.33579 7.5 5.75 7.5H9.25C9.66421 7.5 10 7.83579 10 8.25C10 8.66421 9.66421 9 9.25 9H5.75C5.33579 9 5 8.66421 5 8.25Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M11 8.25C11 7.83579 11.3358 7.5 11.75 7.5H12.25C12.6642 7.5 13 7.83579 13 8.25C13 8.66421 12.6642 9 12.25 9H11.75C11.3358 9 11 8.66421 11 8.25Z"
          fill={fill}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export default Receipt2;
