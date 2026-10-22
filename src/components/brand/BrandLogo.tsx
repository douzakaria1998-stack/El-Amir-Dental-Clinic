import type { CSSProperties } from 'react';
import { OFFICIAL_EMBLEM_SVG, OFFICIAL_LOGO_SVG, OFFICIAL_LOGO_DATA_URL } from './officialLogoSvg';

export { OFFICIAL_EMBLEM_SVG, OFFICIAL_LOGO_SVG, OFFICIAL_LOGO_DATA_URL };

/**
 * Official vector emblem of El Amir Dental Clinic (tooth + 3 heads)
 * with the exact two-tone blue palette (#1f9ed9 and #93c5ea).
 */
export function LogoMark({
  size = 48,
  style,
  title = 'El Amir Logo',
}: {
  size?: number;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <div
      role={title ? 'img' : undefined}
      aria-label={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        ...style,
      }}
      dangerouslySetInnerHTML={{
        __html: OFFICIAL_EMBLEM_SVG.replace(
          '<svg ',
          `<svg width="${size}" height="${size}" style="max-width:100%;max-height:100%;" `
        ),
      }}
    />
  );
}

/**
 * Full official logo with emblem + "EL AMIR DENTAL CLINIC" lettering.
 */
export function OfficialFullLogo({
  height = 42,
  style,
  title = 'El Amir Dental Clinic',
}: {
  height?: number;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <div
      role={title ? 'img' : undefined}
      aria-label={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height,
        ...style,
      }}
      dangerouslySetInnerHTML={{
        __html: OFFICIAL_LOGO_SVG.replace(
          '<svg ',
          `<svg height="${height}" width="auto" style="max-height:100%;width:auto;" `
        ),
      }}
    />
  );
}

/** Logo tile: official emblem on clean white or branded background. */
export function LogoTile({ size = 40, radius, title }: { size?: number; radius?: number; title?: string }) {
  const r = radius ?? Math.round(size * 0.22);
  return (
    <div
      role={title ? 'img' : undefined}
      aria-label={title}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(31, 158, 217, 0.25)',
        border: '1px solid rgba(31, 158, 217, 0.15)',
        padding: Math.round(size * 0.1),
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <LogoMark size={size * 0.8} />
    </div>
  );
}

/** Data URL of the official logo SVG */
export function defaultLogoSvgString(): string {
  return OFFICIAL_LOGO_DATA_URL;
}
