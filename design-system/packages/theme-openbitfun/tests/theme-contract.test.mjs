import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  collectTokenDefinitions,
  mergeTokenDocuments,
  resolveTokens,
} from "@openbitfun/token-engine";
import {
  referenceColorCatalog,
  referenceColorScales,
} from "../dist/authoring.js";
import {
  themeModes,
  themeTokenCatalog,
  themes,
} from "../dist/index.js";
import { resolveStatusColors } from "../scripts/resolve-status-colors.mjs";

const packageDirectory = fileURLToPath(new URL("../", import.meta.url));

async function readSource(fileName) {
  return JSON.parse(
    await readFile(path.join(packageDirectory, "src", fileName), "utf8"),
  );
}

function channelToLinear(channel) {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function parseColor(value, backdrop = [255, 255, 255]) {
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return [
      Number.parseInt(value.slice(1, 3), 16),
      Number.parseInt(value.slice(3, 5), 16),
      Number.parseInt(value.slice(5, 7), 16),
    ];
  }
  const rgba = /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i.exec(value);
  if (!rgba) throw new Error(`Unsupported test color: ${value}`);
  const alpha = Number(rgba[4]);
  return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])]
    .map((channel, index) => channel * alpha + backdrop[index] * (1 - alpha));
}

function luminance(value, backdrop) {
  const channels = parseColor(value, backdrop).map(channelToLinear);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second, backdrop) {
  const lighter = Math.max(luminance(first, backdrop), luminance(second, backdrop));
  const darker = Math.min(luminance(first, backdrop), luminance(second, backdrop));
  return (lighter + 0.05) / (darker + 0.05);
}

test("reference colors expose ordered name-plus-number scales for authoring", () => {
  assert.deepEqual(Object.keys(referenceColorScales), [
    "neutral",
    "gray",
    "navy",
    "blue",
    "cyan",
    "purple",
    "pink",
    "green",
    "amber",
    "red",
  ]);
  assert.equal(
    referenceColorCatalog.length,
    Object.values(referenceColorScales).reduce((total, entries) => total + entries.length, 0),
  );

  for (const [scale, entries] of Object.entries(referenceColorScales)) {
    assert.ok(entries.length >= 11, `${scale} must expose a useful tonal range`);
    assert.deepEqual(
      entries.map((entry) => entry.step),
      entries.map((entry) => entry.step).toSorted((left, right) => left - right),
    );
    for (const [index, entry] of entries.entries()) {
      assert.equal(entry.name, `ref.color.${scale}.${entry.step}`);
      assert.match(entry.value, /^#[0-9a-f]{6}$/);
      assert.equal("cssVariable" in entry, false);
      if (index > 0) {
        assert.ok(
          luminance(entries[index - 1].value) >= luminance(entry.value),
          `${entry.name} must be no lighter than the previous step`,
        );
      }
    }
  }
});

test("reference colors retain the global-search action identity anchors", () => {
  const valueAt = (scale, step) => referenceColorScales[scale]
    .find((entry) => entry.step === step)?.value;

  assert.equal(valueAt("red", 650), "#6b2315");
  assert.equal(valueAt("amber", 550), "#8f712a");
  assert.equal(valueAt("cyan", 500), "#537d96");
  assert.equal(valueAt("blue", 575), "#3f5878");
  assert.equal(valueAt("purple", 450), "#7a6c99");
});

// 书墨印章: paper modes keep the deep 墨绿/深朱 anchors, ink modes lift them so diff
// text stays AA-legible on the dark canvas (see the AA sweep in the work log).
const codeChangeAnchors = {
  light: ["#3F5C3F", "#6B2315"],
  dark: ["#6B8A69", "#C98173"],
  highContrastLight: ["#3F5C3F", "#6B2315"],
  highContrastDark: ["#6B8A69", "#C98173"],
};

test("code-change semantics retain the requested addition and removal accents", () => {
  for (const mode of themeModes) {
    const [added, removed] = codeChangeAnchors[mode];
    assert.equal(themes[mode]["color.codeChange.added"], added);
    assert.equal(themes[mode]["color.codeChange.removed"], removed);
  }
});

test("read-only diffs own reference colors without changing status semantics", () => {
  const light = themes.light;
  assert.equal(light["color.codeDiff.added.marker"], "#4A6B4A");
  assert.equal(light["color.codeDiff.removed.marker"], "#A94838");
  assert.equal(light["color.codeDiff.added.line"], "#ECF1EA");
  assert.equal(light["color.codeDiff.removed.line"], "#F5E7E3");
  assert.equal(light["color.codeDiff.added.word"], "#CBD8C6");
  assert.equal(light["color.codeDiff.removed.word"], "#E7C2BB");
  assert.equal(light["color.codeDiff.syntax.keyword"], "#9A5460");
  assert.equal(light["color.codeDiff.syntax.declaration"], "#695E88");
  assert.equal(light["color.codeDiff.syntax.function"], "#4A4063");
  for (const mode of themeModes) {
    const values = themes[mode];
    for (const side of ["added", "removed"]) {
      assert.notEqual(values[`color.codeDiff.${side}.marker`], values[`color.codeChange.${side}`]);
      assert.notEqual(values[`color.codeDiff.${side}.gutter`], values[`color.codeDiff.${side}.line`]);
      assert.notEqual(values[`color.codeDiff.${side}.word`], values[`color.codeDiff.${side}.line`]);
    }
  }
});

test("status families derive from the code-change and product emphasis anchors", async () => {
  for (const mode of themeModes) {
    const values = themes[mode];
    assert.equal(values["color.status.success.emphasis"], values["color.codeChange.added"]);
    assert.equal(values["color.status.danger.emphasis"], values["color.codeChange.removed"]);
    assert.equal(values["color.status.info.emphasis"], values["color.identity.harness.creative"]);
  }

  // Editing the canonical addition anchor must reach every derived status role.
  const source = mergeTokenDocuments(await readSource("reference.tokens.json"), await readSource("light.tokens.json"));
  source.color.codeChange.added.$value = "#123456";
  const updated = resolveStatusColors(resolveTokens(source));
  assert.equal(updated["color.status.success.emphasis"].value, "#123456");
  assert.equal(updated["color.status.success.content"].value, "#0c233a");
  assert.equal(updated["color.status.success.surface"].value, "rgba(18, 52, 86, 0.1)");
  assert.equal(updated["color.status.success.border"].value, "rgba(18, 52, 86, 0.3)");
  assert.equal(updated["color.status.success.content"].sourceValue, source.color.status.success.content.$value);
});

const warningEmphasisAnchors = {
  light: "#755B22",
  dark: "#A68235",
  highContrastLight: "#755B22",
  highContrastDark: "#A68235",
};

test("warning emphasis retains the product ochre anchor in every theme", () => {
  for (const mode of themeModes) {
    assert.equal(themes[mode]["color.status.warning.emphasis"], warningEmphasisAnchors[mode]);
  }
});

test("semantic theme documents route solid colors through reference scales", async () => {
  for (const fileName of [
    "light.tokens.json",
    "dark.tokens.json",
    "high-contrast-light.tokens.json",
    "high-contrast-dark.tokens.json",
  ]) {
    const definitions = collectTokenDefinitions(await readSource(fileName));
    for (const [name, definition] of definitions) {
      if (definition.type === "color" && typeof definition.value === "string") {
        assert.equal(
          /^#[0-9a-f]{6}$/i.test(definition.value),
          false,
          `${fileName} token ${name} bypasses the reference palette`,
        );
      }
    }
  }
});

test("all theme variants expose the same semantic theme contract", async () => {
  const [reference, light, dark, highContrastLight, highContrastDark] = await Promise.all([
    readSource("reference.tokens.json"),
    readSource("light.tokens.json"),
    readSource("dark.tokens.json"),
    readSource("high-contrast-light.tokens.json"),
    readSource("high-contrast-dark.tokens.json"),
  ]);
  const variants = [
    resolveTokens(mergeTokenDocuments(reference, light)),
    resolveTokens(mergeTokenDocuments(reference, dark)),
    resolveTokens(mergeTokenDocuments(reference, light, highContrastLight)),
    resolveTokens(mergeTokenDocuments(reference, dark, highContrastDark)),
  ];
  const expectedNames = Object.keys(variants[0]).filter((name) => name.startsWith("color."));

  for (const variant of variants.slice(1)) {
    assert.deepEqual(
      Object.keys(variant).filter((name) => name.startsWith("color.")),
      expectedNames,
    );
  }
});

test("text, action, and field focus pairs meet their contrast requirements", () => {
  const variants = Object.entries(themes).map(([mode, values]) => [
    mode, Object.fromEntries(Object.entries(values).map(([name, value]) => [name, { value }])),
  ]);

  for (const [mode, variant] of variants) {
    const backdrop = parseColor(variant["color.surface.canvas"].value);
    assert.ok(
      contrastRatio(
        variant["color.field.background"].value,
        variant["color.field.borderFocus"].value,
        backdrop,
      ) >= 3,
      `${mode} field focus contrast fell below 3:1`,
    );
    assert.ok(
      contrastRatio(
        variant["color.surface.canvas"].value,
        variant["color.content.primary"].value,
        backdrop,
      ) >= 4.5,
    );
    assert.ok(
      contrastRatio(
        variant["color.action.primary.background"].value,
        variant["color.action.primary.content"].value,
        backdrop,
      ) >= 4.5,
    );
    assert.ok(
      contrastRatio(
        variant["color.surface.panel"].value,
        variant["color.action.neutral.content"].value,
        backdrop,
      ) >= 4.5,
    );
    assert.ok(
      contrastRatio(
        variant["color.action.neutral.surface"].value,
        variant["color.action.neutral.content"].value,
        backdrop,
      ) >= 4.5,
    );
    assert.ok(
      contrastRatio(
        variant["color.control.highlight.background"].value,
        variant["color.control.highlight.content"].value,
        backdrop,
      ) >= 4.5,
      `${mode} control highlight contrast fell below 4.5:1`,
    );
    // 书墨印章: the marker is text (asterisks), so it must clear 4.5:1 on the canvas
    // instead of blindly copying the highlight fill colour.
    assert.ok(
      contrastRatio(
        variant["color.surface.canvas"].value,
        variant["color.content.requiredIndicator"].value,
        backdrop,
      ) >= 4.5,
      `${mode} required indicator contrast fell below 4.5:1`,
    );
    for (const status of ["info", "success", "warning", "danger"]) {
      const minimumContrast = 4.5;
      assert.ok(
        contrastRatio(
          variant[`color.status.${status}.surface`].value,
          variant[`color.status.${status}.content`].value,
          backdrop,
        ) >= minimumContrast,
        `${mode} ${status} contrast fell below ${minimumContrast}:1`,
      );
    }
  }
});

test("Button states have a mode-complete palette independent from shared actions", () => {
  const light = themes.light;
  assert.equal(light["component.button.outlineBorder"], "rgba(42, 38, 34, 0.09)");
  assert.equal(
    light["component.button.outlineBorderInteractive"],
    light["component.button.outlineBorder"],
  );
  for (const suffix of ["", "Hover", "Pressed"]) {
    assert.equal(light[`component.button.fillBackground${suffix}`], "rgba(42, 38, 34, 0.09)");
  }
  assert.equal(light["component.button.primaryBackground"], "rgba(20, 17, 14, 0.92)");
  assert.equal(light["component.button.primaryBackgroundHover"], "rgba(42, 38, 34, 0.72)");
  assert.equal(light["component.button.primaryBackgroundPressed"], "rgba(20, 17, 14, 1)");
  assert.equal(light["component.button.primaryContentDisabled"], "rgba(255, 253, 248, 0.35)");
  assert.equal(light["component.button.textContent"], "#3F6179");
  assert.equal(light["component.button.textContentDisabled"], "rgba(83, 125, 150, 0.32)");
  for (const [mode, values] of Object.entries(themes)) {
    assert.notEqual(
      values["component.button.textContent"],
      values["component.button.textContentHover"],
      `${mode} text button hover must stay a distinct step`,
    );
    assert.equal(
      values["component.button.textContent"],
      values["color.link.default"],
      `${mode} text button labels share the link accent step`,
    );
    assert.equal(
      values["component.button.textContentHover"],
      values["color.link.hover"],
    );
  }
  const names = Object.keys(light).filter(name => name.startsWith("component.button."));
  for (const [mode, values] of Object.entries(themes)) {
    assert.deepEqual(Object.keys(values).filter(name => name.startsWith("component.button.")), names);
    if (mode === "light") continue;
    assert.equal(values["component.button.primaryBackground"], values["color.action.primary.background"]);
    assert.equal(values["component.button.outlineBorderInteractive"], values["color.action.neutral.border"]);
    assert.equal(values["component.button.fillBackgroundPressed"], values["color.action.neutral.surfacePressed"]);
  }
});

test("Empty artwork uses a mode-complete opaque component color", () => {
  assert.equal(themes.light["component.empty.media"], "color-mix(in srgb, #6B6158 35%, #EFE8DB)");
  assert.equal(themes.dark["component.empty.media"], "color-mix(in srgb, #A1927F 35%, #0D0B09)");
  for (const values of Object.values(themes)) {
    assert.match(values["component.empty.media"], /^color-mix\(in srgb, #[0-9a-f]{6} 35%, #[0-9a-f]{6}\)$/i);
  }
});

test("default modes preserve the built-in Appearance anchor values", () => {
  assert.equal(themes.light["color.surface.canvas"], "#F5EFE4");
  assert.equal(themes.light["color.content.primary"], "rgba(42, 38, 34, 0.90)");
  assert.equal(themes.light["color.content.secondary"], "rgba(42, 38, 34, 0.72)");
  assert.equal(themes.light["color.content.disabled"], "rgba(42, 38, 34, 0.32)");
  assert.equal(themes.light["color.action.primary.background"], "#14110E");
  assert.equal(themes.light["color.action.neutral.border"], "rgba(42, 38, 34, 0.06)");
  assert.equal(themes.light["color.action.neutral.content"], "rgba(42, 38, 34, 0.90)");
  assert.equal(themes.light["color.action.neutral.contentDisabled"], "rgba(42, 38, 34, 0.32)");
  assert.equal(themes.light["color.action.secondary.content"], "rgba(42, 38, 34, 0.90)");
  assert.equal(themes.light["color.action.quiet.content"], "rgba(42, 38, 34, 0.72)");
  assert.equal(themes.light["color.action.neutral.surface"], "rgba(42, 38, 34, 0.06)");
  assert.equal(themes.light["color.action.neutral.surfaceHover"], "rgba(42, 38, 34, 0.09)");
  assert.equal(themes.light["color.action.neutral.surfacePressed"], "rgba(42, 38, 34, 0.12)");
  assert.equal(themes.light["color.selection.surface"], "rgba(42, 38, 34, 0.09)");
  assert.equal(themes.light["color.surface.chrome"], "#EFE8DB");
  assert.equal(themes.light["color.surface.tertiary"], "#EFE8DB");
  assert.equal(themes.light["color.scrollbar.thumb"], "rgba(42, 38, 34, 0.22)");
  assert.equal(themes.light["color.scrollbar.thumbHover"], "rgba(42, 38, 34, 0.32)");
  assert.equal(themes.light["color.keyHint.background"], "rgba(42, 38, 34, 0.09)");
  assert.equal(themes.light["color.control.highlight.background"], "#537D96");
  assert.equal(themes.light["color.control.highlight.content"], "#000000");
  assert.equal(themes.light["color.content.requiredIndicator"], "#3F6179");
  assert.equal(themes.light["color.control.launcher.background"], "rgba(42, 38, 34, 0.09)");
  assert.equal(
    themes.light["color.control.launcher.backgroundHover"],
    "color-mix(in srgb, #537D96 20%, transparent)",
  );
  assert.equal(
    themes.light["color.control.launcher.backgroundPressed"],
    "color-mix(in srgb, #537D96 30%, transparent)",
  );
  assert.equal(themes.light["color.control.launcher.content"], "rgba(42, 38, 34, 0.90)");
  assert.equal(themes.light["color.control.launcher.contentHover"], "#3F6179");
  assert.equal(themes.light["color.control.launcher.contentPressed"], "#3F6179");
  assert.equal(themes.light["color.control.switch.track"], "rgba(42, 38, 34, 0.12)");
  assert.equal(themes.light["color.control.switch.trackChecked"], "#537D96");
  assert.equal(themes.light["color.control.switch.thumb"], "#FFFDF8");
  assert.equal(themes.light["color.identity.harness.minimal"], "#5F547C");
  assert.equal(themes.light["color.identity.harness.standard"], "#3F5C3F");
  assert.equal(themes.light["color.identity.harness.ultimate"], "#8F712A");
  assert.equal(themes.light["color.identity.harness.creative"], "#47617F");
  assert.equal(themes.light["color.identity.globalSearch.newSession"], "#6B2315");
  assert.equal(themes.light["color.identity.globalSearch.openBrowser"], "#8F712A");
  assert.equal(themes.light["color.identity.globalSearch.openTerminal"], "rgba(42, 38, 34, 0.90)");
  assert.equal(themes.light["color.identity.globalSearch.openProject"], "#537D96");
  assert.equal(themes.light["color.identity.globalSearch.newProject"], "#3F5878");
  assert.equal(themes.light["color.identity.globalSearch.openFiles"], "#7A6C99");
  assert.equal(themes.light["color.status.warning.surface"], "rgba(117, 91, 34, 0.1)");
  assert.equal(themes.light["shadow.base"], "0 4px 8px rgba(42, 38, 34, 0.08)");
  assert.equal(themes.light["shadow.composer"], "0 2px 12px rgba(42, 38, 34, 0.08)");
  assert.equal(themes.light["shadow.menu"], "0 4px 20px rgba(42, 38, 34, 0.12)");
  assert.equal(themes.light["shadow.overlay"], "0 4px 20px rgba(42, 38, 34, 0.12)");
  assert.equal(themes.light["opacity.disabled"], 0.55);
  assert.equal(themes.dark["color.surface.canvas"], "#0D0B09");
  assert.equal(themes.dark["color.content.primary"], "#E9E1D1");
  assert.equal(themes.dark["color.keyHint.background"], "rgba(240, 232, 216, 0.08)");
  assert.equal(themes.dark["color.action.primary.background"], "rgba(240, 232, 216, 0.14)");
  assert.equal(themes.dark["color.action.neutral.surface"], "rgba(240, 232, 216, 0.08)");
  assert.equal(themes.dark["color.control.highlight.background"], "#537D96");
  assert.equal(themes.dark["color.control.highlight.content"], "#000000");
  assert.equal(themes.dark["color.content.requiredIndicator"], "#6489A0");
  assert.equal(themes.dark["color.control.launcher.background"], "rgba(240, 232, 216, 0.14)");
  assert.equal(
    themes.dark["color.control.launcher.backgroundHover"],
    "color-mix(in srgb, #537D96 20%, transparent)",
  );
  assert.equal(
    themes.dark["color.control.launcher.backgroundPressed"],
    "color-mix(in srgb, #537D96 30%, transparent)",
  );
  assert.equal(themes.dark["color.control.launcher.contentHover"], "#93B0BD");
  assert.equal(themes.dark["color.control.launcher.contentPressed"], "#93B0BD");
  assert.equal(themes.dark["color.control.switch.trackChecked"], "#537D96");
  assert.equal(themes.dark["color.identity.harness.minimal"], "#5F547C");
  assert.equal(themes.dark["color.identity.harness.standard"], "#3F5C3F");
  assert.equal(themes.dark["color.identity.harness.ultimate"], "#8F712A");
  assert.equal(themes.dark["color.identity.harness.creative"], "#6C87A3");
  assert.equal(themes.dark["color.identity.globalSearch.newSession"], "#6B2315");
  assert.equal(themes.dark["color.identity.globalSearch.openBrowser"], "#8F712A");
  assert.equal(themes.dark["color.identity.globalSearch.openTerminal"], "#C6BBA7");
  assert.equal(themes.dark["color.identity.globalSearch.openProject"], "#537D96");
  assert.equal(themes.dark["color.identity.globalSearch.newProject"], "#3F5878");
  assert.equal(themes.dark["color.identity.globalSearch.openFiles"], "#7A6C99");
  assert.equal(themes.dark["color.scrollbar.thumb"], "rgba(240, 232, 216, 0.22)");
  assert.equal(themes.dark["color.scrollbar.thumbHover"], "rgba(240, 232, 216, 0.32)");
  assert.equal(themes.dark["shadow.base"], "0 4px 8px rgba(13, 11, 9, 0.7)");
  assert.equal(themes.dark["shadow.composer"], "0 2px 6px rgba(13, 11, 9, 0.32)");
  assert.equal(themes.dark["shadow.menu"], "0 4px 10px rgba(13, 11, 9, 0.48)");
  assert.equal(themes.dark["shadow.overlay"], "0 4px 20px rgba(13, 11, 9, 0.48)");
  assert.equal(themes.dark["opacity.disabled"], 0.6);
});

test("public theme catalog contains only semantic theme tokens for every mode", () => {
  assert.deepEqual(themeModes, [
    "light",
    "dark",
    "highContrastLight",
    "highContrastDark",
  ]);
  assert.equal(themeTokenCatalog.length, Object.keys(themes.light).length);
  for (const token of themeTokenCatalog) {
    assert.equal(
      ["color.", "component.button.", "component.empty.", "effect.", "opacity.", "shadow."].some((prefix) => token.name.startsWith(prefix)),
      true,
    );
    assert.equal(token.name.startsWith("ref."), false);
    if (
      token.name.startsWith("color.")
      || token.name.startsWith("component.button.")
      || token.name.startsWith("component.empty.")
    ) {
      assert.equal(token.type, "color");
    }
    assert.deepEqual(Object.keys(token.values), themeModes);
  }
});
