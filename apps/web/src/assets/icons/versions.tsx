import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function Versions2({ fill = "currentColor", secondaryfill, ...props }: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M10.7501 14.5H7.25009C5.73349 14.5 4.50009 13.2666 4.50009 11.75V6.25C4.50009 4.7334 5.73349 3.5 7.25009 3.5H10.7501C12.2667 3.5 13.5001 4.7334 13.5001 6.25V11.75C13.5001 13.2666 12.2667 14.5 10.7501 14.5Z"
          fill={secondaryfill}
          opacity="0.4"
        />
        <path
          d="M4.50009 11.75V6.25C4.50009 4.7334 5.73349 3.5 7.25009 3.5H9.97479C9.84619 2.1021 8.68099 1 7.25009 1H3.75009C2.23349 1 1.00009 2.2334 1.00009 3.75V9.25C1.00009 10.7666 2.23349 12 3.75009 12H4.52539C4.51769 11.9165 4.50009 11.8354 4.50009 11.75Z"
          fill={secondaryfill}
          opacity="0.2"
        />
        <path
          d="M14.2501 17H10.7501C9.23349 17 8.00009 15.7666 8.00009 14.25V8.75C8.00009 7.2334 9.23349 6 10.7501 6H14.2501C15.7667 6 17.0001 7.2334 17.0001 8.75V14.25C17.0001 15.7666 15.7667 17 14.2501 17Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default Versions2;
