import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function LabelInfo({ fill = "currentColor", secondaryfill, ...props }: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M7.5 13C7.5 9.9673 9.9678 7.5 13 7.5C13.3419 7.5 13.6752 7.5356 14 7.5957V7.0405C14 6.2646 13.6699 5.521 13.0947 5.0009L9.17429 1.454C8.50439 0.848503 7.4951 0.848503 6.8262 1.454L2.9053 5.0009C2.3301 5.5209 2 6.2646 2 7.0405V14.25C2 15.7661 3.2334 17 4.75 17H9.23691C8.17061 15.9963 7.5 14.5767 7.5 13Z"
          fill={secondaryfill}
          opacity="0.3"
        />
        <path
          d="M8 8C8.69036 8 9.25 7.44036 9.25 6.75C9.25 6.05964 8.69036 5.5 8 5.5C7.30964 5.5 6.75 6.05964 6.75 6.75C6.75 7.44036 7.30964 8 8 8Z"
          fill={fill}
        />
        <path
          d="M13 9C10.7939 9 9 10.7944 9 13C9 15.2056 10.7939 17 13 17C15.2061 17 17 15.2056 17 13C17 10.7944 15.2061 9 13 9ZM13.75 15C13.75 15.4141 13.4141 15.75 13 15.75C12.5859 15.75 12.25 15.4141 12.25 15V13.5C12.25 13.0859 12.5859 12.75 13 12.75C13.4141 12.75 13.75 13.0859 13.75 13.5V15ZM13 12C12.5168 12 12.125 11.6082 12.125 11.125C12.125 10.6418 12.5168 10.25 13 10.25C13.4832 10.25 13.875 10.6417 13.875 11.125C13.875 11.6083 13.4832 12 13 12Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default LabelInfo;
