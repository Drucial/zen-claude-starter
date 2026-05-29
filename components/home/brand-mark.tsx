// A minimal ensō — the zen circle drawn in a single breath, left open.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 4.2a8.5 8.5 0 1 0 5 6.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.1"
      />
    </svg>
  );
}
