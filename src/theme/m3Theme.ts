import { createTheme, alpha, type Theme } from '@mui/material/styles';
import { argbFromHex, hexFromArgb, Hct, TonalPalette } from '@material/material-color-utilities';
import { brand, brandFontFamily, uiFontFamily } from './brandTokens';

/* ------------------------------------------------------------------ */
/* Material 3 colour scheme generated from the brand seeds             */
/* ------------------------------------------------------------------ */

const palette = (hex: string) => TonalPalette.fromInt(argbFromHex(hex));
const tone = (p: TonalPalette, t: number) => hexFromArgb(p.tone(t));

const primaryHct = Hct.fromInt(argbFromHex(brand.blue));
const P = palette(brand.blue);
const S = palette(brand.sky);
// Tertiary: analogous teal (M3 recommends ~+60° hue shift from primary)
const T = TonalPalette.fromHueAndChroma((primaryHct.hue + 300) % 360, 36);
const N = TonalPalette.fromHueAndChroma(primaryHct.hue, 4);
const NV = TonalPalette.fromHueAndChroma(primaryHct.hue, 10);
const E = TonalPalette.fromHueAndChroma(25, 84);

export const m3 = {
  primary: brand.blue, // exact brand colour (tone ≈ 45, 5.5:1 on white → AA)
  onPrimary: '#FFFFFF',
  primaryContainer: tone(P, 90),
  onPrimaryContainer: tone(P, 10),
  primaryFixedDim: tone(P, 80),
  secondary: tone(S, 40),
  onSecondary: '#FFFFFF',
  secondaryContainer: tone(S, 90),
  onSecondaryContainer: tone(S, 10),
  tertiary: tone(T, 40),
  onTertiary: '#FFFFFF',
  tertiaryContainer: tone(T, 90),
  onTertiaryContainer: tone(T, 10),
  error: tone(E, 40),
  onError: '#FFFFFF',
  errorContainer: tone(E, 90),
  onErrorContainer: tone(E, 10),
  surface: tone(N, 98),
  surfaceDim: tone(N, 87),
  surfaceBright: tone(N, 98),
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: tone(N, 96),
  surfaceContainer: tone(N, 94),
  surfaceContainerHigh: tone(N, 92),
  surfaceContainerHighest: tone(N, 90),
  onSurface: tone(N, 10),
  onSurfaceVariant: tone(NV, 30),
  outline: tone(NV, 50),
  outlineVariant: tone(NV, 80),
  inverseSurface: tone(N, 20),
  inverseOnSurface: tone(N, 95),
  inversePrimary: tone(P, 80),
  scrim: '#000000',
} as const;

export type M3Scheme = typeof m3;

declare module '@mui/material/styles' {
  interface Theme {
    m3: M3Scheme;
  }
  interface ThemeOptions {
    m3?: M3Scheme;
  }
  interface TypographyVariants {
    brand: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    brand?: React.CSSProperties;
  }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    brand: true;
  }
}
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    tonal: true;
  }
}

/* M3 elevation levels (shadow tokens) */
const elevation = [
  'none',
  '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
  '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
  '0px 1px 3px rgba(0,0,0,0.3), 0px 4px 8px 3px rgba(0,0,0,0.15)',
  '0px 2px 3px rgba(0,0,0,0.3), 0px 6px 10px 4px rgba(0,0,0,0.15)',
  '0px 4px 4px rgba(0,0,0,0.3), 0px 8px 12px 6px rgba(0,0,0,0.15)',
];

const shadows = Array.from({ length: 25 }, (_, i) => elevation[Math.min(i, 5)]) as Theme['shadows'];

const focusRing = {
  outline: `3px solid ${m3.primary}`,
  outlineOffset: 2,
};

export const theme = createTheme({
  m3,
  palette: {
    mode: 'light',
    primary: { main: m3.primary, contrastText: m3.onPrimary, light: m3.primaryContainer, dark: tone(P, 30) },
    secondary: { main: m3.secondary, contrastText: m3.onSecondary, light: m3.secondaryContainer, dark: tone(S, 30) },
    error: { main: m3.error, contrastText: m3.onError, light: m3.errorContainer },
    info: { main: m3.secondary },
    background: { default: m3.surface, paper: m3.surfaceContainerLowest },
    text: { primary: m3.onSurface, secondary: m3.onSurfaceVariant },
    divider: m3.outlineVariant,
    action: {
      hover: alpha(m3.onSurface, 0.08),
      selected: alpha(m3.primary, 0.12),
      focus: alpha(m3.onSurface, 0.12),
    },
  },
  shape: { borderRadius: 12 },
  shadows,
  typography: {
    fontFamily: uiFontFamily,
    // Material 3 type scale
    h1: { fontSize: 57, lineHeight: '64px', fontWeight: 400, letterSpacing: -0.25 },
    h2: { fontSize: 45, lineHeight: '52px', fontWeight: 400 },
    h3: { fontSize: 36, lineHeight: '44px', fontWeight: 400 },
    h4: { fontSize: 28, lineHeight: '36px', fontWeight: 400 }, // headline medium
    h5: { fontSize: 24, lineHeight: '32px', fontWeight: 400 }, // headline small
    h6: { fontSize: 22, lineHeight: '28px', fontWeight: 400 }, // title large
    subtitle1: { fontSize: 16, lineHeight: '24px', fontWeight: 500, letterSpacing: 0.15 }, // title medium
    subtitle2: { fontSize: 14, lineHeight: '20px', fontWeight: 500, letterSpacing: 0.1 }, // title small
    body1: { fontSize: 16, lineHeight: '24px', letterSpacing: 0.5 },
    body2: { fontSize: 14, lineHeight: '20px', letterSpacing: 0.25 },
    caption: { fontSize: 12, lineHeight: '16px', letterSpacing: 0.4 },
    overline: { fontSize: 11, lineHeight: '16px', fontWeight: 500, letterSpacing: 0.5, textTransform: 'none' },
    button: { fontSize: 14, lineHeight: '20px', fontWeight: 500, letterSpacing: 0.1, textTransform: 'none' },
    brand: { fontFamily: brandFontFamily, fontWeight: 700, lineHeight: 1.1 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: m3.surface },
        '*:focus-visible': focusRing,
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: false },
      styleOverrides: { root: { '&.Mui-focusVisible': focusRing } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 100,
          minHeight: 40,
          paddingInline: 24,
          whiteSpace: 'nowrap',
          variants: [
            {
              props: { variant: 'tonal' },
              style: {
                backgroundColor: m3.secondaryContainer,
                color: m3.onSecondaryContainer,
                '&:hover': { backgroundColor: alpha(m3.onSecondaryContainer, 0.08), boxShadow: elevation[1] },
                '&:hover:not(.Mui-disabled)': { backgroundColor: `color-mix(in srgb, ${m3.secondaryContainer} 92%, ${m3.onSecondaryContainer})` },
                '&.Mui-disabled': { backgroundColor: alpha(m3.onSurface, 0.12), color: alpha(m3.onSurface, 0.38) },
              },
            },
          ],
        },
        contained: {
          '&:hover': { boxShadow: elevation[1] },
        },
        outlined: {
          borderColor: m3.outline,
          '&:hover': { borderColor: m3.outline },
        },
        sizeSmall: { minHeight: 32, paddingInline: 16 },
        sizeLarge: { minHeight: 48, paddingInline: 28, fontSize: 15 },
        startIcon: { marginRight: 8, '& > *:nth-of-type(1)': { fontSize: 18 } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 100 } },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'none',
          boxShadow: elevation[3],
          backgroundColor: m3.primaryContainer,
          color: m3.onPrimaryContainer,
          '&:hover': { backgroundColor: `color-mix(in srgb, ${m3.primaryContainer} 92%, ${m3.onPrimaryContainer})`, boxShadow: elevation[4] },
        },
        extended: { height: 56, paddingInline: 20, gap: 12, fontSize: 14, fontWeight: 500, borderRadius: 16 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: m3.surfaceContainerLowest,
          border: `1px solid ${m3.outlineVariant}`,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { paddingBottom: 4 },
        title: { fontSize: 16, lineHeight: '24px', fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: m3.surfaceContainerLowest,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: m3.outline },
          '&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: m3.onSurface },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
        },
      },
    },
    MuiFilledInput: {
      defaultProps: { disableUnderline: false },
      styleOverrides: {
        root: {
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          backgroundColor: m3.surfaceContainerHighest,
          '&:hover': { backgroundColor: `color-mix(in srgb, ${m3.surfaceContainerHighest} 92%, ${m3.onSurface})` },
          '&.Mui-focused': { backgroundColor: m3.surfaceContainerHighest },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: m3.onSurfaceVariant } },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginInline: 16, lineHeight: '16px' } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 28, backgroundColor: m3.surfaceContainerHigh, boxShadow: elevation[3] },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: 24, lineHeight: '32px', padding: '24px 24px 16px' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '8px 24px 24px', gap: 8 } },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: m3.inverseSurface,
          color: m3.inverseOnSurface,
          borderRadius: 8,
          boxShadow: elevation[3],
          fontSize: 14,
        },
        action: { color: m3.inversePrimary },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: m3.inverseSurface, color: m3.inverseOnSurface, borderRadius: 4, fontSize: 12, padding: '4px 8px' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        outlined: { borderColor: m3.outlineVariant },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { borderRadius: 100, backgroundColor: 'transparent' },
        grouped: {
          borderColor: m3.outline,
          '&:first-of-type': { borderTopLeftRadius: 100, borderBottomLeftRadius: 100 },
          '&:last-of-type': { borderTopRightRadius: 100, borderBottomRightRadius: 100 },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: m3.onSurface,
          borderColor: m3.outline,
          paddingInline: 14,
          gap: 6,
          '&.Mui-selected': {
            backgroundColor: m3.secondaryContainer,
            color: m3.onSecondaryContainer,
            '&:hover': { backgroundColor: `color-mix(in srgb, ${m3.secondaryContainer} 92%, ${m3.onSecondaryContainer})` },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: m3.outlineVariant },
        head: { fontWeight: 500, color: m3.onSurfaceVariant, backgroundColor: m3.surfaceContainerLow, whiteSpace: 'nowrap' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&.MuiTableRow-hover:hover': { backgroundColor: alpha(m3.primary, 0.04) } },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: { root: { backgroundColor: m3.surface, color: m3.onSurface } },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { width: 64, height: 44, padding: 6 },
        switchBase: {
          padding: 10,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            color: m3.onPrimary,
            '& + .MuiSwitch-track': { backgroundColor: m3.primary, opacity: 1, borderColor: m3.primary },
          },
        },
        thumb: { width: 24, height: 24, boxShadow: 'none' },
        track: {
          borderRadius: 16,
          backgroundColor: m3.surfaceContainerHighest,
          border: `2px solid ${m3.outline}`,
          opacity: 1,
          boxSizing: 'border-box',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 4, backgroundColor: m3.surfaceContainer, boxShadow: elevation[2] },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 4, backgroundColor: m3.secondaryContainer } },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { borderRadius: 8, backgroundColor: m3.surfaceContainer, boxShadow: elevation[2] },
        groupLabel: { backgroundColor: m3.surfaceContainer, color: m3.primary, fontWeight: 500 },
      },
    },
  },
});
