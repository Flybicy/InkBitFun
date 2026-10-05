

import { AppearancePalette } from './AppearancePalette';
import {
  createAccentScale,
  createCompactRadius,
  createGitColors,
  createSemanticColors,
  createSecondaryAccentScale,
  createStandardEasing,
  createStandardSpacing,
  rgbFromHex,
  rgbaFromHex,
} from './paletteHelpers';

const CHINA_STYLE_PAPER = '#F8F4ED';
const CHINA_STYLE_CHROME = CHINA_STYLE_PAPER;
const CHINA_STYLE_SURFACE_INSET = CHINA_STYLE_PAPER;
const CHINA_STYLE_CARD = '#FCFAF5';
const CHINA_STYLE_INK = '#3B3D3F';
const CHINA_STYLE_TEXT_SECONDARY = '#6B6F73';
const CHINA_STYLE_TEXT_MUTED = '#8E9196';
const CHINA_STYLE_BLUE = '#537D96';
const CHINA_STYLE_BLUE_HOVER = CHINA_STYLE_BLUE;
const CHINA_STYLE_GREEN = '#EC8F8D';
const CHINA_STYLE_GREEN_HOVER = CHINA_STYLE_GREEN;
const CHINA_STYLE_BORDER = '#7A6058';

const chinaStyleBlue = (alpha: number | string) => rgbaFromHex(CHINA_STYLE_BLUE, alpha);
const chinaStyleBorder = (alpha: number | string) => rgbaFromHex(CHINA_STYLE_BORDER, alpha);
const chinaStyleInk = (alpha: number | string) => rgbaFromHex(CHINA_STYLE_INK, alpha);

export const openBitFunChinaStylePalette: AppearancePalette = {

  id: 'openbitfun-china-style',
  name: 'Warm Paper',
  type: 'light',
  description: 'Warm paper appearance - Soft ivory surfaces, muted ink text, and distant mountain blue',
  author: 'OpenBitFun Team',
  version: '1.2.0',


  colors: {
    background: {
      // Warm paper grounds share one base; brighter cards carry elevation.
      primary: CHINA_STYLE_PAPER,
      secondary: CHINA_STYLE_CARD,
      tertiary: CHINA_STYLE_SURFACE_INSET,
      elevated: CHINA_STYLE_CARD,
      workbench: CHINA_STYLE_SURFACE_INSET,
      scene: CHINA_STYLE_PAPER,
      chrome: CHINA_STYLE_CHROME,
    },

    text: {
      primary: CHINA_STYLE_INK,
      secondary: CHINA_STYLE_TEXT_SECONDARY,
      muted: CHINA_STYLE_TEXT_MUTED,
      disabled: rgbaFromHex(CHINA_STYLE_INK, 0.35),
    },

    accent: createAccentScale({ base: CHINA_STYLE_BLUE, hover: CHINA_STYLE_BLUE_HOVER }),

    purple: createSecondaryAccentScale({ base: CHINA_STYLE_GREEN, hover: CHINA_STYLE_GREEN_HOVER }),

    semantic: createSemanticColors('light'),

    border: {
      subtle: chinaStyleBorder(0.12),
      base: chinaStyleBorder(0.18),
      medium: chinaStyleBorder(0.24),
      strong: chinaStyleBorder(0.32),
      prominent: chinaStyleBorder(0.42),
    },

    element: {
      subtle: chinaStyleBlue(0.03),
      soft: chinaStyleBlue(0.05),
      base: chinaStyleBlue(0.08),
      medium: chinaStyleBlue(0.12),
      strong: chinaStyleBlue(0.18),
    },

    git: createGitColors('light', {
      branch: rgbFromHex(CHINA_STYLE_BLUE),
      branchBg: chinaStyleBlue(0.08),
    }),

    scrollbar: {
      thumb: chinaStyleInk(0.18),
      thumbHover: chinaStyleInk(0.28),
    },
  },


  effects: {
    shadow: {
      xs: `0 1px 2px ${chinaStyleBorder(0.06)}`,
      sm: `0 2px 4px ${chinaStyleBorder(0.08)}`,
      base: `0 4px 8px ${chinaStyleBorder(0.1)}`,
      lg: `0 8px 16px ${chinaStyleBorder(0.12)}`,
      xl: `0 12px 24px ${chinaStyleBorder(0.15)}`,
    },

    blur: {
      subtle: 'blur(4px) saturate(1.03)',
      base: 'blur(8px) saturate(1.05)',
    },

    radius: createCompactRadius(),

    spacing: createStandardSpacing(),

    opacity: {
      disabled: 0.5,
      hover: 0.75,
      focus: 0.9,
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
          background: CHINA_STYLE_BLUE,
          color: CHINA_STYLE_CARD,
          border: 'transparent',
          shadow: 'none',
        },
        hover: {
          background: CHINA_STYLE_BLUE_HOVER,
          color: CHINA_STYLE_CARD,
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
        active: {
          background: CHINA_STYLE_BLUE_HOVER,
          color: CHINA_STYLE_CARD,
          border: 'transparent',
          shadow: 'none',
          transform: 'none',
        },
      },


      ghost: {
        default: {
          color: CHINA_STYLE_TEXT_SECONDARY,
        },
        hover: {
          background: chinaStyleBlue(0.08),
          color: CHINA_STYLE_BLUE_HOVER,
          border: 'transparent',
        },
      },
    },
  },


  monaco: {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8E9196', fontStyle: 'italic' },
      { token: 'keyword', foreground: '8B3A3A' },
      { token: 'string', foreground: '7BAE7F' },
      { token: 'number', foreground: 'EC8F8D' },
      { token: 'type', foreground: '537D96' },
      { token: 'class', foreground: '537D96' },
      { token: 'function', foreground: '456A80' },
      { token: 'variable', foreground: '3B3D3F' },
      { token: 'constant', foreground: '8B3A3A' },
      { token: 'operator', foreground: '456A80' },
      { token: 'tag', foreground: '537D96' },
      { token: 'attribute.name', foreground: '456A80' },
      { token: 'attribute.value', foreground: '7BAE7F' },
    ],
    colors: {
      background: CHINA_STYLE_PAPER,
      foreground: CHINA_STYLE_INK,
      lineHighlight: CHINA_STYLE_SURFACE_INSET,
      selection: chinaStyleBlue(0.28),
      cursor: CHINA_STYLE_BLUE,

      'editor.selectionBackground': chinaStyleBlue(0.24),
      'editor.selectionForeground': CHINA_STYLE_INK,
      'editor.inactiveSelectionBackground': chinaStyleBlue(0.18),
      'editor.selectionHighlightBackground': chinaStyleBlue(0.18),
      'editor.selectionHighlightBorder': chinaStyleBlue(0.34),
      'editorCursor.foreground': CHINA_STYLE_BLUE,
      'editor.wordHighlightBackground': chinaStyleBlue(0.1),
      'editor.wordHighlightStrongBackground': chinaStyleBlue(0.2),
    },
  },
};
