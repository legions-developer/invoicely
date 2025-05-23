import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function FolderFeather({ fill = "currentColor", secondaryfill, ...props }: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M4.25 2C2.73079 2 1.5 3.23079 1.5 4.75V6.5H16.5V6.25C16.5 4.73079 15.2692 3.5 13.75 3.5H8.72395L8.34569 3.02827C7.82347 2.37825 7.03552 2 6.201 2H4.25Z"
          fill={fill}
        />
        <path
          d="M17.916 10.4048C17.7764 10.1353 17.499 9.9766 17.1846 10.0029C10.8301 10.5591 10.0127 17.0991 10.0049 17.165C9.95805 17.5766 10.2539 17.9482 10.6651 17.9951C10.6944 17.9985 10.7227 18 10.751 18C11.127 18 11.4512 17.7178 11.4951 17.335C11.4995 17.2963 11.5237 17.1037 11.5877 16.8113C11.675 16.3891 12.0312 15.0156 12.8281 14.1094C12.8281 14.1094 12.5 15.3906 12.7034 16.5H13.5C16.5498 16.5 16.9189 14.5146 17.1885 13.0649C17.3213 12.352 17.4463 11.6792 17.8223 11.2343C18.0186 11.0024 18.0556 10.6748 17.916 10.4048Z"
          fill={fill}
        />
        <path
          d="M16.5 6.5H1.5V13.25C1.5 14.7692 2.73079 16 4.25 16H8.71013C8.90018 15.2425 9.2603 14.1408 9.91929 13.0117C11.04 11.0916 13.0604 9.05376 16.5 8.57149V6.5Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
      </g>
    </svg>
  );
}

export default FolderFeather;
