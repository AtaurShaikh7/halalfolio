export function IslamicPattern() {
  return (
    <div
      className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] overflow-hidden"
      style={{ opacity: 'var(--pattern-opacity)' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 600 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <pattern id="geo" x="0" y="0" width="140" height="140" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="var(--gold)" strokeWidth="0.7">
              <circle cx="70" cy="70" r="55" />
              <circle cx="70" cy="70" r="34" />
              <polygon points="70,15 110,40 110,100 70,125 30,100 30,40" />
              <polygon points="70,30 100,50 100,90 70,110 40,90 40,50" />
              <path d="M70,15 L70,125 M30,40 L110,100 M110,40 L30,100" />
              <path d="M15,70 L125,70 M40,15 L100,125 M100,15 L40,125" />
              <circle cx="70" cy="70" r="6" fill="var(--gold)" />
            </g>
          </pattern>
          <linearGradient id="geo-fade" x1="0" x2="1">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="0.7" />
          </linearGradient>
          <mask id="geo-mask">
            <rect width="600" height="800" fill="url(#geo-fade)" />
          </mask>
        </defs>
        <rect width="600" height="800" fill="url(#geo)" mask="url(#geo-mask)" />
      </svg>
    </div>
  );
}
