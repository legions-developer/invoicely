import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function CircleXmark({ fill = "currentColor", secondaryfill, ...props }: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M9.00009 17C13.4184 17 17.0001 13.4183 17.0001 9C17.0001 4.58172 13.4184 1 9.00009 1C4.58181 1 1.00009 4.58172 1.00009 9C1.00009 13.4183 4.58181 17 9.00009 17Z"
          fill={secondaryfill}
          opacity="0.3"
        />
        <path
          d="M10.0606 8.99999L12.2803 6.7803C12.5733 6.4873 12.5733 6.01268 12.2803 5.71978C11.9873 5.42688 11.5127 5.42678 11.2198 5.71978L9.0001 7.93951L6.7804 5.71978C6.4874 5.42678 6.0128 5.42678 5.7199 5.71978C5.427 6.01278 5.4269 6.4874 5.7199 6.7803L7.93961 8.99999L5.7199 11.2197C5.4269 11.5127 5.4269 11.9873 5.7199 12.2802C5.8664 12.4267 6.0583 12.4999 6.2502 12.4999C6.4421 12.4999 6.634 12.4267 6.7805 12.2802L9.0002 10.0605L11.2199 12.2802C11.3664 12.4267 11.5583 12.4999 11.7502 12.4999C11.9421 12.4999 12.134 12.4267 12.2805 12.2802C12.5735 11.9872 12.5735 11.5126 12.2805 11.2197L10.0606 8.99999Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default CircleXmark;
