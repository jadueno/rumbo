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

export function TipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.3.2.5.6.5 1V16h6v-1.1c0-.4.2-.8.5-1A6 6 0 0 0 12 3Z" />
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
