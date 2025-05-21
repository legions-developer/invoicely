import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function PriorityMedium({ fill = "currentColor", secondaryfill, ...props }: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M12.5 3.75C12.5 2.7835 13.2835 2 14.25 2H14.75C15.7165 2 16.5 2.7835 16.5 3.75V14.25C16.5 15.2165 15.7165 16 14.75 16H14.25C13.2835 16 12.5 15.2165 12.5 14.25V3.75Z"
          fill={secondaryfill}
          fillOpacity="0.4"
          fillRule="evenodd"
        />
        <path
          d="M7 8.75C7 7.7835 7.7835 7 8.75 7H9.25C10.2165 7 11 7.7835 11 8.75V14.25C11 15.2165 10.2165 16 9.25 16H8.75C7.7835 16 7 15.2165 7 14.25V8.75Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M1.5 12.75C1.5 11.7835 2.2835 11 3.25 11H3.75C4.7165 11 5.5 11.7835 5.5 12.75V14.25C5.5 15.2165 4.7165 16 3.75 16H3.25C2.2835 16 1.5 15.2165 1.5 14.25V12.75Z"
          fill={fill}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export default PriorityMedium;
