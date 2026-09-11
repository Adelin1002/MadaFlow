export function TopoLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 400"
      fill="none"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M-20 80 C 120 40, 220 140, 340 90 S 560 20, 700 70 S 900 130, 1000 90"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M-20 150 C 100 190, 240 100, 360 160 S 580 220, 700 150 S 880 90, 1000 150"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d="M-20 230 C 140 190, 260 280, 380 230 S 600 160, 720 220 S 900 270, 1000 230"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
      />
      <path
        d="M-20 310 C 110 340, 250 260, 380 310 S 590 360, 710 300 S 890 260, 1000 310"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
      />
    </svg>
  );
}
