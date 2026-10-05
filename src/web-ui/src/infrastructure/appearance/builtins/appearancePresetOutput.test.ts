import { themeCssVariables, themes, type ThemeTokenName } from '@openbitfun/theme-openbitfun';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import avatarPalette from '../../../flow_chat/assets/subagent-avatars/palette.json';
import { APPEARANCE_ROOT_TOKEN_NAMES } from '../appearanceTokenContract';

import { builtinAppearancePalettes } from './palettes';
import {
  getBuiltinAppearance,
  getBuiltinAppearanceThemeTokens,
} from './catalog';
import {
  PLUGIN_APPEARANCE_COLOR_KEYS,
  createPluginAppearanceColorProjection,
} from '../adapters/PluginAppearanceProjection';
import {
  createAccentScale,
  createGitColors,
  createSemanticColors,
  createSecondaryAccentScale,
  overlayBlack,
  overlayWhite,
  rgbFromHex,
  rgbaFromHex,
} from './paletteHelpers';

function hashAppearance(appearance: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(appearance))
    .digest('hex');
}

function statusContrast(content: string, tint: string, background: string): number {
  const parse = (value: string): number[] => value.startsWith('#')
    ? [1, 3, 5].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16))
    : value.match(/[\d.]+/g)!.map(Number);
  const backdrop = parse(background);
  const surface = parse(tint);
  const alpha = surface[3] ?? 1;
  const luminance = (rgb: number[]): number => rgb.map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const first = luminance(parse(content));
  const second = luminance(backdrop.map((channel, index) => surface[index] * alpha + channel * (1 - alpha)));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe('builtin appearance preset output', () => {
  it('keeps subagent hover colors distinct and readable in every conversation theme', () => {
    for (const palette of builtinAppearancePalettes) {
      const tokens = getBuiltinAppearanceThemeTokens(palette.id);
      for (const character of avatarPalette.characters) {
        const name = `--openbitfun-domain-subagent-${character.file.replace('.svg', '')}` as const;
        const accent = tokens[name];
        expect(APPEARANCE_ROOT_TOKEN_NAMES).toContain(name);
        expect(accent).not.toBe(palette.colors.text.primary);
        if (palette.id === 'openbitfun-dark') {
          expect([character.body, character.knob, character.stem, character.face]).toContain(accent);
        }
        const background = palette.colors.background.scene;
        expect(statusContrast(accent!, background, background), `${palette.id}: ${name}`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps published light field states in root and chrome while preserving named palettes', () => {
    const settings = getBuiltinAppearance('openbitfun-light')?.renderers?.['theme-tokens']?.settings;
    for (const tokens of [settings?.tokens, settings?.scopes?.chrome].filter(Boolean)) {
      for (const [name, value] of Object.entries(themes.light)) {
        if (name.startsWith('color.field.') || name === 'color.actionCard.background' || name.startsWith('color.composer.')) expect(tokens?.[themeCssVariables[name as ThemeTokenName]]).toBe(value);
      }
    }
    expect(settings?.tokens['--openbitfun-color-number-badge-background']).toBe(themes.light['color.numberBadge.background']);
    expect(settings?.tokens['--openbitfun-color-key-hint-content']).toBe(themes.light['color.keyHint.content']);
    expect(settings?.tokens['--openbitfun-color-scrollbar-thumb']).toBe(themes.light['color.scrollbar.thumb']);
    expect(settings?.tokens['--openbitfun-color-field-border']).toBe('rgba(42, 38, 34, 0.12)');
    expect(settings?.tokens['--openbitfun-color-field-border-hover']).toBe('rgba(42, 38, 34, 0.24)');
    expect(settings?.tokens['--openbitfun-color-field-border-active']).toBe('rgba(42, 38, 34, 0.24)');
    expect(settings?.tokens['--openbitfun-color-field-border-focus']).toBe(themes.light['color.field.borderFocus']);
    expect(settings?.tokens['--openbitfun-color-field-group-background']).toBe('rgba(42, 38, 34, 0.04)');
    expect(settings?.tokens['--openbitfun-color-field-placeholder']).toBe('rgba(42, 38, 34, 0.68)');
    for (const palette of builtinAppearancePalettes) {
      if (palette.id === 'openbitfun-light') continue;
      const tokens = getBuiltinAppearanceThemeTokens(palette.id);
      expect(tokens['--openbitfun-color-action-card-background']).toBe(palette.colors.element.base);
      expect(tokens['--openbitfun-color-field-border']).toBe(palette.colors.border.base);
      expect(tokens['--openbitfun-color-field-border-focus']).toBe(palette.colors.accent[500]);
      expect(tokens['--openbitfun-color-field-border-active']).toBe(palette.colors.accent[500]);
      expect(tokens['--openbitfun-color-field-group-background']).toBe(palette.colors.background.tertiary);
      expect(tokens['--openbitfun-color-field-placeholder']).toBe(palette.colors.text.muted);
    }
  });
  it('uses the public Button palette in default appearances without changing shared action colors', () => {
    for (const mode of ['light', 'dark'] as const) {
      const appearance = getBuiltinAppearance(`openbitfun-${mode}`);
      const settings = appearance?.renderers?.['theme-tokens']?.settings;
      for (const [name, value] of Object.entries(themes[mode])) {
        if (!name.startsWith('component.button.')) continue;
        expect(settings?.tokens[themeCssVariables[name as ThemeTokenName]]).toBe(value);
      }
    }
    const light = getBuiltinAppearanceThemeTokens('openbitfun-light');
    expect(light['--openbitfun-component-button-content']).toBe('rgba(42, 38, 34, 0.90)');
    expect(light['--openbitfun-component-button-text-content']).toBe('#3F6179');
    expect(light['--openbitfun-color-action-primary-background']).toBe('#14110E');
    expect(light['--openbitfun-color-action-neutral-content']).toBe('rgba(42, 38, 34, 0.90)');
  });

  it('preserves the action colors of branded presets through the Button contract', () => {
    for (const palette of builtinAppearancePalettes) {
      if (palette.id === 'openbitfun-light' || palette.id === 'openbitfun-dark') continue;
      const tokens = getBuiltinAppearanceThemeTokens(palette.id);
      expect(tokens['--openbitfun-component-button-primary-background']).toBe(tokens['--openbitfun-color-action-primary-background']);
      expect(tokens['--openbitfun-component-button-text-content']).toBe(tokens['--openbitfun-color-accent-default']);
      expect(tokens['--openbitfun-component-button-content']).toBe(tokens['--openbitfun-color-action-neutral-content']);
    }
  });

  it('keeps menu label and caption colors consistent between the public light theme and product portals', () => {
    const settings = getBuiltinAppearance('openbitfun-light')!.renderers!['theme-tokens']!.settings;
    for (const tokens of [settings.tokens, ...(settings.scopes?.chrome ? [settings.scopes.chrome] : [])]) {
      expect(tokens['--openbitfun-color-action-neutral-content']).toBe(themes.light['color.action.neutral.content']);
      expect(tokens['--openbitfun-color-content-caption']).toBe(themes.light['color.content.caption']);
    }
    for (const palette of builtinAppearancePalettes.filter(p => p.id !== 'openbitfun-light')) {
      expect(getBuiltinAppearanceThemeTokens(palette.id)['--openbitfun-color-action-neutral-content']).toBe(palette.colors.text.secondary);
    }
  });

  it('formats hex palette references as stable rgb strings', () => {
    expect(rgbFromHex('#00e6ff')).toBe('rgb(0, 230, 255)');
    expect(rgbaFromHex('#00e6ff', 0.12)).toBe('rgba(0, 230, 255, 0.12)');
    expect(rgbaFromHex('#00e6ff', '0.12')).toBe('rgba(0, 230, 255, 0.12)');
    expect(overlayBlack(0.3)).toBe('rgba(0, 0, 0, 0.3)');
    expect(overlayWhite(0.08)).toBe('rgba(255, 255, 255, 0.08)');
  });

  it('uses the shared design-system palette for every builtin status and git lifecycle', () => {
    for (const appearance of builtinAppearancePalettes) {
      const mode = appearance.type;
      const values = themes[mode];
      const tokens = getBuiltinAppearanceThemeTokens(appearance.id);
      for (const [key, tone] of [['success', 'success'], ['warning', 'warning'], ['error', 'danger'], ['info', 'info']] as const) {
        expect(appearance.colors.semantic[key]).toBe(values[`color.status.${tone}.content`]);
        expect(appearance.colors.semantic[`${key}Bg`]).toBe(values[`color.status.${tone}.surface`]);
        expect(appearance.colors.semantic[`${key}Border`]).toBe(values[`color.status.${tone}.border`]);
        for (const role of ['emphasis', 'content', 'surface', 'border'] as const) {
          expect(tokens[`--openbitfun-color-status-${tone}-${role}`]).toBe(values[`color.status.${tone}.${role}`]);
        }
      }
      expect(appearance.colors.git).toMatchObject({
        added: values['color.codeChange.added'],
        staged: values['color.codeChange.added'],
        deleted: values['color.codeChange.removed'],
        changes: values['color.status.warning.emphasis'],
      });
      expect(createGitColors(mode, { branch: 'currentColor', branchBg: 'transparent' })).toMatchObject(
        { ...appearance.colors.git, branch: 'currentColor', branchBg: 'transparent' },
      );
      expect(createSemanticColors(mode)).toEqual(appearance.colors.semantic);
      const chromeTokens = getBuiltinAppearance(appearance.id)?.renderers?.['theme-tokens']?.settings.scopes?.chrome;
      for (const tone of ['info', 'success', 'warning', 'danger'] as const) {
        const contentKey = `--openbitfun-color-status-${tone}-content` as const;
        const surfaceKey = `--openbitfun-color-status-${tone}-surface` as const;
        for (const background of Object.values(appearance.colors.background)) {
          expect(statusContrast(tokens[contentKey], tokens[surfaceKey], background), `${appearance.id} ${tone}`).toBeGreaterThanOrEqual(4.5);
        }
        if (chromeTokens && appearance.colors.chrome) {
          expect(chromeTokens[contentKey]).toBe(themes[appearance.colors.chrome.type ?? mode][`color.status.${tone}.content`]);
          for (const background of Object.values(appearance.colors.chrome.background)) {
            expect(statusContrast(chromeTokens[contentKey], chromeTokens[surfaceKey], background), `${appearance.id} chrome ${tone}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    }
  });

  it('derives repeated palette families from compact authoring inputs', () => {
    expect(createAccentScale({
      base: '#60a5fa',
      hover: '#3b82f6',
    })).toEqual({
      50: 'rgba(96, 165, 250, 0.04)',
      100: 'rgba(96, 165, 250, 0.08)',
      200: 'rgba(96, 165, 250, 0.15)',
      300: 'rgba(96, 165, 250, 0.25)',
      400: 'rgba(96, 165, 250, 0.4)',
      500: '#60a5fa',
      600: '#3b82f6',
      700: 'rgba(59, 130, 246, 0.8)',
    });

    expect(createSecondaryAccentScale({
      base: '#8b5cf6',
      hover: '#7c3aed',
    })).toEqual({
      100: 'rgba(139, 92, 246, 0.08)',
      200: 'rgba(139, 92, 246, 0.15)',
      500: '#8b5cf6',
      600: '#7c3aed',
    });
  });

  it('does not carry retired runtime-only authoring stops in builtin appearance schemas', () => {
    for (const appearance of builtinAppearancePalettes) {
      expect(appearance.colors.accent).not.toHaveProperty('800');
      expect(appearance.colors.purple).not.toHaveProperty('50');
      expect(appearance.colors.purple).not.toHaveProperty('400');
      expect(appearance.colors.purple).not.toHaveProperty('800');
      expect(appearance.colors.background).not.toHaveProperty('quaternary');
      expect(appearance.colors.background).not.toHaveProperty('tooltip');
      expect(appearance.colors.element).not.toHaveProperty('elevated');
    }
  });

  it('keeps approved near-neutral preset stops scoped to their semantic roles', () => {
    const serializedAppearances = JSON.stringify(builtinAppearancePalettes).toLowerCase();
    const lightAppearance = builtinAppearancePalettes.find(appearance => appearance.id === 'openbitfun-light');

    expect(lightAppearance?.colors.background.primary).toBe('#F5EFE4');
    expect(lightAppearance?.monaco?.colors.background).toBe('#ffffff');
    expect(lightAppearance?.monaco?.colors.lineHighlight).toBe('rgba(42, 38, 34, 0.04)');
    // The warm near-neutral backs the xuan-paper canvas and the three primary Button states.
    expect(serializedAppearances.match(/#f5efe4/g)).toHaveLength(4);
    expect(serializedAppearances).not.toContain('#e2e6eb');
    expect(serializedAppearances).not.toContain('#f0f2f5');
  });

  it('keeps the default light appearance on the neutral, navy, and restrained semantic palette', () => {
    const lightAppearance = builtinAppearancePalettes.find(appearance => appearance.id === 'openbitfun-light');
    const tokens = getBuiltinAppearanceThemeTokens('openbitfun-light');

    expect(lightAppearance).toMatchObject({
      description: 'Light appearance - ink and seal: warm xuan-paper surfaces, ink text, seal-blue accents',
      version: '2.5.0',
      colors: {
        background: {
          primary: '#F5EFE4',
          secondary: '#ffffff',
          tertiary: '#EFE8DB',
          elevated: '#ffffff',
          workbench: '#E9E1D1',
          scene: '#ffffff',
          chrome: '#EFE8DB',
        },
        text: {
          primary: 'rgba(42, 38, 34, 0.90)',
          secondary: 'rgba(42, 38, 34, 0.72)',
          muted: '#6B6158',
          disabled: 'rgba(42, 38, 34, 0.32)',
        },
        accent: {
          50: 'rgba(42, 38, 34, 0.04)',
          100: '#E9E1D1',
          500: '#14110E',
          600: '#161310',
          700: '#000000',
        },
        semantic: createSemanticColors('light'),
        border: {
          base: 'rgba(42, 38, 34, 0.18)',
        },
        element: {
          subtle: 'rgba(42, 38, 34, 0.04)',
          soft: '#E9E1D1',
        },
      },
      components: {
        button: {
          primary: {
            default: { background: '#14110E', color: '#FFFDF8' },
            hover: { background: '#161310', color: '#FFFDF8' },
            active: { background: '#000000', color: '#FFFDF8' },
          },
        },
      },
      monaco: {
        colors: {
          background: '#ffffff',
          lineHighlight: 'rgba(42, 38, 34, 0.04)',
        },
      },
    });
    expect(tokens).toMatchObject({
      '--openbitfun-color-surface-chrome': '#EFE8DB',
      '--openbitfun-color-selection-surface': 'rgba(42, 38, 34, 0.09)',
      '--openbitfun-component-config-page-section-background': '#EFE8DB',
      '--openbitfun-component-config-page-section-border': 'rgba(42, 38, 34, 0.10)',
      '--openbitfun-component-config-page-section-border-width': '1px',
      '--openbitfun-component-config-page-divider': 'rgba(42, 38, 34, 0.10)',
    });
  });

  it('keeps settings row hover feedback separated from dark scene surfaces', () => {
    const darkAppearance = builtinAppearancePalettes.find(
      appearance => appearance.id === 'openbitfun-dark',
    );
    const tokens = getBuiltinAppearanceThemeTokens('openbitfun-dark');

    expect(tokens).toMatchObject({
      '--openbitfun-color-surface-scene': '#161310',
      '--openbitfun-color-surface-tertiary': '#0D0B09',
      '--openbitfun-color-action-quiet-hover': 'rgba(240, 232, 216, 0.06)',
      '--openbitfun-color-action-neutral-surface': 'rgba(240, 232, 216, 0.08)',
      '--openbitfun-component-config-page-row-hover-background': 'rgba(240, 232, 216, 0.08)',
    });

    expect(tokens['--openbitfun-component-config-page-row-hover-background'])
      .toBe(darkAppearance?.colors.element.base);
    expect(tokens['--openbitfun-component-config-page-row-hover-background'])
      .not.toBe(darkAppearance?.colors.element.soft);

    for (const appearance of builtinAppearancePalettes.filter(
      entry => entry.type === 'dark' && !entry.components?.configPage?.rowHover,
    )) {
      expect(
        getBuiltinAppearanceThemeTokens(appearance.id)[
          '--openbitfun-component-config-page-row-hover-background'
        ],
        appearance.id,
      ).toBe(appearance.colors.element.base);
    }
  });

  it('keeps monochrome content readable while projecting inverse structural chrome', () => {
    const monochrome = builtinAppearancePalettes.find(
      appearance => appearance.id === 'openbitfun-monochrome',
    );
    const monochromePackage = getBuiltinAppearance('openbitfun-monochrome');
    const tokens = getBuiltinAppearanceThemeTokens('openbitfun-monochrome');
    const chromeTokens = monochromePackage?.renderers?.['theme-tokens']?.settings.scopes?.chrome;

    expect(monochrome).toMatchObject({
      type: 'light',
      description: 'Black-and-white contrast appearance - Deep black chrome, bright white workspace, soft neutral blocks',
      colors: {
        background: {
          primary: '#ffffff',
          scene: '#ffffff',
        },
        text: {
          primary: 'rgba(42, 38, 34, 0.90)',
          secondary: 'rgba(42, 38, 34, 0.72)',
          muted: '#6B6158',
        },
        border: {
          subtle: 'rgba(42, 38, 34, 0.10)',
          base: 'rgba(42, 38, 34, 0.18)',
          prominent: 'rgba(20, 17, 14, 0.48)',
        },
        element: {
          subtle: 'rgba(42, 38, 34, 0.04)',
          soft: '#E9E1D1',
          strong: 'rgba(42, 38, 34, 0.12)',
        },
        accent: {
          500: '#1c1c1f',
          600: '#000000',
        },
        chrome: {
          background: {
            primary: '#1c1c1f',
            secondary: '#262626',
          },
          text: {
            primary: '#E9E1D1',
            secondary: '#C6BBA7',
            muted: '#A1927F',
            disabled: '#3B352F',
          },
          accent: {
            500: '#E9E1D1',
            600: '#ffffff',
          },
        },
      },
      components: {
        button: {
          primary: {
            default: { background: '#1c1c1f', color: '#ffffff' },
            hover: { background: '#000000', color: '#ffffff' },
          },
        },
        configPage: {
          section: {
            background: '#E9E1D1',
            border: 'transparent',
            borderWidth: '0',
            shadow: 'none',
          },
          divider: 'rgba(42, 38, 34, 0.10)',
          rowHover: 'rgba(42, 38, 34, 0.04)',
        },
      },
    });
    expect(tokens).toMatchObject({
      '--openbitfun-color-surface-canvas': '#ffffff',
      '--openbitfun-color-content-primary': 'rgba(42, 38, 34, 0.90)',
      '--openbitfun-color-content-secondary': 'rgba(42, 38, 34, 0.72)',
      '--openbitfun-color-content-disabled': 'rgba(42, 38, 34, 0.32)',
      '--openbitfun-color-border-subtle': 'rgba(42, 38, 34, 0.10)',
      '--openbitfun-color-border-default': 'rgba(42, 38, 34, 0.18)',
      '--openbitfun-color-surface-subtle': 'rgba(42, 38, 34, 0.04)',
      '--openbitfun-color-action-quiet-hover': '#E9E1D1',
      '--openbitfun-color-scrollbar-thumb': 'rgba(0, 0, 0, 0.2)',
      '--openbitfun-component-config-page-section-background': '#E9E1D1',
      '--openbitfun-component-config-page-section-border': 'transparent',
      '--openbitfun-component-config-page-section-border-width': '0',
      '--openbitfun-component-config-page-section-shadow': 'none',
      '--openbitfun-component-config-page-divider': 'rgba(42, 38, 34, 0.10)',
    });
    expect(chromeTokens).toMatchObject({
      '--openbitfun-color-surface-canvas': '#1c1c1f',
      '--openbitfun-color-content-primary': '#E9E1D1',
      '--openbitfun-color-action-quiet-hover': 'rgba(255, 255, 255, 0.06)',
    });
  });

  it('projects builtin appearances to a compact OpenCode-compatible plugin color key set', () => {
    expect(PLUGIN_APPEARANCE_COLOR_KEYS).toEqual([
      'primary',
      'secondary',
      'accent',
      'success',
      'warning',
      'error',
      'info',
    ]);

    for (const appearance of builtinAppearancePalettes) {
      const projection = createPluginAppearanceColorProjection(appearance);

      expect(Object.keys(projection).sort()).toEqual([...PLUGIN_APPEARANCE_COLOR_KEYS].sort());
      expect(projection.primary).toBe(appearance.colors.accent[500]);
      expect(projection.secondary).toBe(appearance.colors.purple?.[500] ?? appearance.colors.accent[600]);
      expect(projection.accent).toBe(appearance.colors.accent[600]);
      expect(projection.success).toBe(appearance.colors.semantic.success);
      expect(projection.warning).toBe(appearance.colors.semantic.warning);
      expect(projection.error).toBe(appearance.colors.semantic.error);
      expect(projection.info).toBe(appearance.colors.semantic.info);
    }
  });

  it('keeps resolved preset objects stable across helper refactors', () => {
    expect(builtinAppearancePalettes.map(appearance => ({
      id: appearance.id,
      type: appearance.type,
      hash: hashAppearance(appearance),
    }))).toMatchInlineSnapshot(`
      [
        {
          "hash": "d3f64b63aeee06f7aa7a47fc3f61d1e96d0c257a94801fc9b8acc581e2f92c3d",
          "id": "openbitfun-light",
          "type": "light",
        },
        {
          "hash": "12ee30b097c00b45d8a404c088a04839bed388922ce2f8142e3c258f6a7d6058",
          "id": "openbitfun-monochrome",
          "type": "light",
        },
        {
          "hash": "768cfd458bdfd3c99851f3ae6b95ab002c03a2d8e3916c6d80f60a3c6988199a",
          "id": "openbitfun-slate",
          "type": "dark",
        },
        {
          "hash": "f634445686603779d817136a0a2444e18c43d320c6ebd6543de5f3cf3c50b960",
          "id": "openbitfun-dark",
          "type": "dark",
        },
        {
          "hash": "3c192a30746d4bd0dd2d24b262d9faa3ae937a45430eb06dccc725a0cfab2743",
          "id": "openbitfun-midnight",
          "type": "dark",
        },
        {
          "hash": "c3b29471f8bf10eaddff014b98288fa4a4d46e0f3fb880cc9247a465bfcbc09f",
          "id": "openbitfun-china-style",
          "type": "light",
        },
        {
          "hash": "a1b293e7790592d5c91494d5f5521c71defbca65f486de1a7f6e6a3da3f77418",
          "id": "openbitfun-china-night",
          "type": "dark",
        },
        {
          "hash": "9b258373fc6c721cbb1437f5d1d86bd5d1ef7b752e023d9f3dcb7936629fa1bf",
          "id": "openbitfun-cyber",
          "type": "dark",
        },
        {
          "hash": "d9d4e41d17902e48b0e988af1cf91f864866e2af1c8ade33ad751e1de44b0840",
          "id": "openbitfun-tokyo-night",
          "type": "dark",
        },
      ]
    `);
  });
});
