import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function IncomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v13" />
      <path d="m7 12 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function ExpenseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20V7" />
      <path d="m7 12 5-5 5 5" />
      <path d="M5 3h14" />
    </svg>
  );
}

export function DebtIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10.5h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function SavingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 13c0-3.5 3-6.5 7-6.5 3 0 4.5 1.2 5.3 2.2.2.3.6.4 1 .3.6-.2 1.2 0 1.5.6.3.6-.2 1.4-.9 1.6-.3.1-.6.4-.6.8V15a2 2 0 0 1-2 2h-1v2.5h-2V17H9v2.5H7V16.7C5.2 15.9 4 14.6 4 13Z" />
      <circle cx="15.5" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12" />
      <path d="m7 10.5 5 5 5-5" />
      <path d="M4.5 19.5h15" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15V3" />
      <path d="m7 7.5 5-5 5 5" />
      <path d="M4.5 19.5h15" />
    </svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-3.5 4.2-5.5 7.5-5.5s6.3 2 7.5 5.5" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function FlowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="6" r="2.5" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <path d="M7.3 7.1 15.7 11" />
      <path d="M7.3 16.9 15.7 13" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 8v.01" />
    </svg>
  );
}
