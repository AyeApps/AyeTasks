/**
 * AyeTasks Neo-Brutalist Cyber Design System
 * 100% Shared Theme DNA with AyeVideoDownloader/frontend
 */

export interface ThemeColors {
  bgBase: string;
  bgSecondary: string;
  bgSurface: string;
  bgCard: string;
  bgInvert: string;

  borderColor: string;
  borderMuted: string;
  borderAccent: string;

  accent: string;
  accentHover: string;
  accentSubtle: string;

  accentSuccess: string;
  accentSuccessHover: string;
  accentSuccessSubtle: string;

  accentDanger: string;
  accentDangerSubtle: string;
  accentWarning: string;
  accentWarningSubtle: string;

  textPrimary: string;
  textInvert: string;
  textSecondary: string;
  textMuted: string;

  shadowColor: string;
  gridDotColor: string;
}

export const DARK_THEME: ThemeColors = {
  bgBase: '#000000',
  bgSecondary: '#080808',
  bgSurface: '#101010',
  bgCard: '#141414',
  bgInvert: '#ffffff',

  borderColor: '#ffffff',
  borderMuted: '#2a2a2a',
  borderAccent: '#FE9D01',

  accent: '#FE9D01',
  accentHover: '#FFAF20',
  accentSubtle: '#2D1A00',

  accentSuccess: '#00e676',
  accentSuccessHover: '#00c853',
  accentSuccessSubtle: '#0a2e16',

  accentDanger: '#ff1744',
  accentDangerSubtle: '#2d0a0f',
  accentWarning: '#FFD600',
  accentWarningSubtle: '#2A2405',

  textPrimary: '#ffffff',
  textInvert: '#000000',
  textSecondary: '#aaaaaa',
  textMuted: '#666666',

  shadowColor: '#ffffff',
  gridDotColor: 'rgba(255, 255, 255, 0.15)',
};

export const LIGHT_THEME: ThemeColors = {
  bgBase: '#ffffff',
  bgSecondary: '#f7f7f7',
  bgSurface: '#eeeeee',
  bgCard: '#e6e6e6',
  bgInvert: '#000000',

  borderColor: '#000000',
  borderMuted: '#cccccc',
  borderAccent: '#E68A00',

  accent: '#E68A00',
  accentHover: '#D47D00',
  accentSubtle: '#FFF3E0',

  accentSuccess: '#00c853',
  accentSuccessHover: '#00b248',
  accentSuccessSubtle: '#e8f8ee',

  accentDanger: '#d50000',
  accentDangerSubtle: '#fee2e2',
  accentWarning: '#e65100',
  accentWarningSubtle: '#fef3c7',

  textPrimary: '#000000',
  textInvert: '#ffffff',
  textSecondary: '#555555',
  textMuted: '#888888',

  shadowColor: '#000000',
  gridDotColor: 'rgba(0, 0, 0, 0.12)',
};

export const THEME = {
  colors: DARK_THEME,
  borders: {
    thick: 2,
    thin: 1,
  },
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  fonts: {
    regular: 'System',
    bold: 'System',
    mono: 'Courier',
  },
} as const;

export function getThemeColors(mode: 'dark' | 'light'): ThemeColors {
  return mode === 'light' ? LIGHT_THEME : DARK_THEME;
}
