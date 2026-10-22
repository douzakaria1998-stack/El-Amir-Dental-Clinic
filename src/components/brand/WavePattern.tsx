import { useMemo, type CSSProperties } from 'react';
import { brand } from '../../theme/brandTokens';

/**
 * Fine flowing lines, echoing the side band of the letterhead (Image 2).
 * Purely decorative.
 */
export function WavePattern({
  color = brand.line,
  opacity = 0.5,
  lines = 26,
  style,
  className,
}: {
  color?: string;
  opacity?: number;
  lines?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const paths = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < lines; i++) {
      const o = i * 9;
      out.push(`M ${-40 + o * 0.2} ${420 - o} C ${60 + o * 0.4} ${300 - o * 0.6}, ${120 - o * 0.2} ${160 - o * 0.3}, ${260} ${-20 + o * 0.7}`);
    }
    return out;
  }, [lines]);

  return (
    <svg
      className={className}
      viewBox="0 0 240 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    >
      <g fill="none" stroke={color} strokeWidth="0.8" opacity={opacity}>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
