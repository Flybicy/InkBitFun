

import { AppearancePalette } from './AppearancePalette';
import {
  createAccentScale,
  createCompactRadius,
  createGitColors,
  createSemanticColors,
  createSecondaryAccentScale,
  createStandardEasing,
  createStandardSpacing,
  overlayBlack,
  rgbFromHex,
  rgbaFromHex,
} from './paletteHelpers';

const CHINA_NIGHT_BACKGROUND = '#26343D';
const CHINA_NIGHT_BACKGROUND_SECONDARY = '#30414B';
const CHINA_NIGHT_NOTE = CHINA_NIGHT_BACKGROUND_SECONDARY;
const CHINA_NIGHT_TEXT_PRIMARY = '#F0F6FA';
const CHINA_NIGHT_TEXT_SECONDARY = '#D3E0E8';
const CHINA_NIGHT_TEXT_MUTED = '#B7C8D3';
const CHINA_NIGHT_CHROME = CHINA_NIGHT_BACKGROUND;
const CHINA_NIGHT_ACCENT = '#E6B1C4';
const CHINA_NIGHT_ACCENT_HOVER = CHINA_NIGHT_ACCENT;
const CHINA_NIGHT_GREEN = '#B9E2FF';
const CHINA_NIGHT_GREEN_HOVER = CHINA_NIGHT_GREEN;

const chinaNightAccent = (alpha: number | string) => rgbaFromHex(CHINA_NIGHT_ACCENT, alpha);
const chinaNightLink = (alpha: number | string) => rgbaFromHex(CHINA_NIGHT_GREEN, alpha);

export const openBitFunChinaNightPalette: AppearancePalette = {

  id: 'openbitfun-china-night',
  name: 'Aoi Night Contrast',
  type: 'dark',
  description: 'Aoi night high-contrast appearance - Deep teal night, bright rose accents, and clear blue links',
  author: 'OpenBitFun Team',
  version: '1.2.0',


  colors: {
    background: {
      // A deep teal base pairs with brighter card surfaces.
      primary: CHINA_NIGHT_BACKGROUND,
      secondary: CHINA_NIGHT_BACKGROUND_SECONDARY,
      tertiary: CHINA_NIGHT_CHROME,
      elevated: CHINA_NIGHT_BACKGROUND_SECONDARY,
      workbench: CHINA_NIGHT_CHROME,
      scene: CHINA_NIGHT_BACKGROUND,
      chrome: CHINA_NIGHT_CHROME,
    },

    text: {
      primary: CHINA_NIGHT_TEXT_PRIMARY,
      secondary: CHINA_NIGHT_TEXT_SECONDARY,
      muted: CHINA_NIGHT_TEXT_MUTED,
      disabled: rgbaFromHex(CHINA_NIGHT_TEXT_PRIMARY, 0.38),
    },

    accent: createAccentScale({ base: CHINA_NIGHT_ACCENT, hover: CHINA_NIGHT_ACCENT_HOVER }),

    purple: createSecondaryAccentScale({ base: CHINA_NIGHT_GREEN, hover: CHINA_NIGHT_GREEN_HOVER }),

    semantic: createSemanticColors('dark'),

    border: {
      subtle: chinaNightAccent(0.16),
      base: chinaNightAccent(0.26),
      medium: chinaNightAccent(0.34),
      strong: chinaNightAccent(0.42),
      prominent: chinaNightAccent(0.52),
    },

    element: {
      subtle: chinaNightAccent(0.04),
      soft: chinaNightAccent(0.08),
      base: chinaNightAccent(0.12),
      medium: chinaNightAccent(0.18),
      strong: chinaNightAccent(0.26),
    },

    git: createGitColors('dark', {
      branch: rgbFromHex(CHINA_NIGHT_GREEN),
      branchBg: chinaNightLink(0.12),
    }),

    scrollbar: {
      thumb: chinaNightLink(0.2),
      thumbHover: chinaNightLink(0.32),
    },
  },


  effects: {
    shadow: {
      xs: `0 1px 2px ${overlayBlack(0.5)}`,
      sm: `0 2px 4px ${overlayBlack(0.6)}`,
      base: `0 4px 8px ${overlayBlack(0.65)}`,
      lg: `0 8px 16px ${overlayBlack(0.7)}`,
      xl: `0 12px 24px ${overlayBlack(0.75)}`,
    },

    blur: {
      subtle: 'blur(4px) saturate(1.1)',
      base: 'blur(8px) saturate(1.15)',
    },

    radius: createCompactRadius(),

    spacing: createStandardSpacing(),

    opacity: {
      disabled: 0.45,
      hover: 0.78,
      focus: 0.92,
    },
  },


  motion: {
    duration: {
      instant: '0.08s',
      fast: '0.14s',
      base: '0.24s',
      slow: '0.44s',
    },

    easing: createStandardEasing(),
  },



  components: {
    button: {



      primary: {
        default: {
          background: CHINA_NIGHT_ACCENT,
          color: CHINA_NIGHT_CHROME,
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: CHINA_NIGHT_ACCENT_HOVER,
          color: CHINA_NIGHT_CHROME,
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: CHINA_NIGHT_ACCENT_HOVER,
          color: CHINA_NIGHT_CHROME,
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },


      ghost: {
        default: {
          color: CHINA_NIGHT_TEXT_MUTED,
        },
        hover: {
          background: chinaNightAccent(0.14),
          color: CHINA_NIGHT_TEXT_PRIMARY,
          border: 'transparent',
        },
      },
    },
  },


  monaco: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'B7C8D3', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'E28B8B' },
      { token: 'string', foreground: 'A8DDAA' },
      { token: 'number', foreground: 'F1BEAD' },
      { token: 'type', foreground: 'B9E2FF' },
      { token: 'class', foreground: 'B9E2FF' },
      { token: 'function', foreground: 'E6B1C4' },
      { token: 'variable', foreground: 'D3E0E8' },
      { token: 'constant', foreground: 'F1BEAD' },
      { token: 'operator', foreground: 'E28B8B' },
      { token: 'tag', foreground: 'B9E2FF' },
      { token: 'attribute.name', foreground: 'E6B1C4' },
      { token: 'attribute.value', foreground: 'A8DDAA' },
    ],
    colors: {
      background: CHINA_NIGHT_BACKGROUND,
      foreground: CHINA_NIGHT_TEXT_PRIMARY,
      lineHighlight: CHINA_NIGHT_NOTE,
      selection: chinaNightAccent(0.25),
      cursor: CHINA_NIGHT_ACCENT,
      'editor.selectionBackground': chinaNightAccent(0.25),
      'editorCursor.foreground': CHINA_NIGHT_ACCENT,
      'editor.selectionForeground': CHINA_NIGHT_TEXT_PRIMARY,
      'editor.inactiveSelectionBackground': chinaNightAccent(0.18),
      'editor.selectionHighlightBackground': chinaNightAccent(0.2),
      'editor.selectionHighlightBorder': chinaNightAccent(0.34),
      'editor.wordHighlightBackground': chinaNightLink(0.12),
      'editor.wordHighlightStrongBackground': chinaNightLink(0.2),
    },
  },
};
