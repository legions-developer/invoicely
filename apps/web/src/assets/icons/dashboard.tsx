import type { IconProps } from "@/types";

function DashboardIcon({ fill = "currentColor", secondaryfill = fill, ...props }: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g fill={secondaryfill} opacity="0.4">
        <path d="M5.75.75a3.5 3.5 0 0 1 3.5 3.5h-3.5V.75Z" />
        <rect x="11" y="2" width="5.75" height="2" rx="1" />
        <rect x="1.25" y="10" width="15.5" height="6.75" rx="1.75" />
      </g>
      <g fill={fill}>
        <path d="M4.75 1.25v3.5h3.5a3.5 3.5 0 1 1-3.5-3.5Z" />
        <rect x="11" y="5.5" width="4.25" height="2" rx="1" />
        <rect x="3.25" y="13.5" width="2.25" height="1.5" rx=".6" />
        <rect x="7.75" y="12.25" width="2.25" height="2.75" rx=".6" />
        <rect x="12.25" y="11" width="2.25" height="4" rx=".6" />
      </g>
    </svg>
  );
}

export { DashboardIcon };
