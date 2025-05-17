import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function TriangleWarning({ fill = "currentColor", secondaryfill, ...props }: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M14.4249 16H3.57529C2.73549 16 1.98348 15.5659 1.56358 14.8389C1.14368 14.1114 1.14368 13.2432 1.56358 12.5161L6.98889 3.12012C7.40829 2.39302 8.16029 1.95898 9.00009 1.95898C9.83989 1.95898 10.5919 2.39312 11.0113 3.12012L16.4366 12.5161C16.8565 13.2441 16.8565 14.1124 16.4366 14.8394C16.0167 15.566 15.2647 16 14.4249 16Z"
          fill={secondaryfill}
          opacity="0.3"
        />
        <path
          d="M9.00012 10.75C8.58602 10.75 8.25012 10.4141 8.25012 10V6.5C8.25012 6.0859 8.58602 5.75 9.00012 5.75C9.41422 5.75 9.75012 6.0859 9.75012 6.5V10C9.75012 10.4141 9.41422 10.75 9.00012 10.75Z"
          fill={fill}
        />
        <path
          d="M9.00012 13.569C8.44812 13.569 8.00012 13.12 8.00012 12.569C8.00012 12.018 8.44812 11.569 9.00012 11.569C9.55212 11.569 10.0001 12.018 10.0001 12.569C10.0001 13.12 9.55212 13.569 9.00012 13.569Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default TriangleWarning;
