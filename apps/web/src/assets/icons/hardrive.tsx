import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function HardDrive({ fill = "currentColor", secondaryfill, ...props }: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M1 11.75C1 10.2312 2.23119 9 3.75 9H14.25C15.7688 9 17 10.2312 17 11.75V12.75C17 14.2688 15.7688 15.5 14.25 15.5H3.75C2.23119 15.5 1 14.2688 1 12.75V11.75Z"
          fill={secondaryfill}
          fillOpacity="0.4"
          fillRule="evenodd"
        />
        <path
          d="M3.31907 3.82034C3.71135 2.72833 4.74684 2 5.9072 2H12.093C13.2534 2 14.2889 2.72833 14.6811 3.82034L16.6435 9.28341C16.7906 9.69289 16.8836 10.1198 16.9201 10.5534L17 11.5V11.75C17 10.2312 15.7688 9 14.25 9H3.75C2.23119 9 1 10.2312 1 11.75V11.5L1.08001 10.553C1.11662 10.1197 1.20961 9.693 1.35662 9.28372L3.31907 3.82034Z"
          fill={fill}
        />
        <path
          d="M4 12.25C4 11.8358 4.33579 11.5 4.75 11.5H7.5C7.91421 11.5 8.25 11.8358 8.25 12.25C8.25 12.6642 7.91421 13 7.5 13H4.75C4.33579 13 4 12.6642 4 12.25Z"
          fill={fill}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export default HardDrive;
