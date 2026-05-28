const SleepCatIcon = ({ size, width, height, className }: { size?: number; width?: number; height?: number; className?: string }) => {
  const zArray = Array.from({ length: 3 }, (_, index) => index);
  const zXOffset = [0, 3, -3.5];
  return (
    <svg
      className={className}
      width={width ? width : size ? size : 30}
      height={height ? height : size ? size : 30}
      viewBox="0 -7 24 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style>
        {`@keyframes appear0 {
            0%   { opacity: 0; }
            25%  { opacity: 1; }
            50%  { opacity: 1; }
            75%  { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes appear1 {
            0%   { opacity: 0; }
            25%  { opacity: 0; }
            50%  { opacity: 1; }
            75%  { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes appear2 {
            0%   { opacity: 0; }
            25%  { opacity: 0; }
            50%  { opacity: 0; }
            75%  { opacity: 1; }
            100% { opacity: 0; }
          }
        `}
      </style>
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
      <path d="M7.5 14h 1" />
      <path d="M15.5 14h 1" />
      <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
      {zArray.map((index) => {
        const xOffset = index * 3.3 + zXOffset[index];
        const yOffset = -(index * 3) + (index % 2 ? 1 : 0);
        const start = [13 + xOffset, 0 + yOffset];
        const pathD = [
          [2, 0.65],
          [-1, 2],
          [1.4, 2.7],
        ].map((item) => {
          const x = start[0] + item[0];
          const y = start[1] + item[1];
          return `L${x} ${y}`;
        });
        const pathDString = `M${start[0]} ${start[1]} ${pathD.join(" ")}`;
        return (
          <path
            key={`sleep-icon-${index}`}
            strokeWidth="0.75"
            d={pathDString}
            opacity={0}
            style={{
              animation: `appear${index} 4s 0s infinite steps(1)`,
            }}
          />
        );
      })}
    </svg>
  );
};

const CatIcon = ({ size, width, height, className }: { size?: number; width?: number; height?: number; className?: string }) => {
  return (
    <svg
      className={className}
      width={width ? width : size ? size : 24}
      height={height ? height : size ? size : 24}
      viewBox="0 -0.95 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
      <path d="M7 14 L8 13 L9 14" strokeWidth="1" />
      <path d="M15 14 L16 13 L17 14" strokeWidth="1" />
      <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
    </svg>
  );
};

export { CatIcon, SleepCatIcon };
