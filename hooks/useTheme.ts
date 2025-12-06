import { useState, useEffect } from 'react';
import storage from '../utils/storage';

type RGB = { r: number; g: number; b: number };

type HSL = { h: number; s: number; l: number };

export const APP_THEME_ACCENTS: Record<string, string> = {
  teal: '#4A857E',
  rose: '#D66F65',
  gold: '#D4A373',
  indigo: '#6B7A8F',
  sage: '#7A9E7E',
  lavender: '#9D8189',
  midnight: '#1E2A44',
  chocolate: '#8B5A3C',
  ink: '#2B2732',
};

const APP_THEME_LABELS: Record<string, string> = {
  teal: '沈穩綠',
  rose: '陶玫瑰',
  gold: '麥穗金',
  indigo: '岩板藍',
  sage: '鼠尾草',
  lavender: '薰衣草',
  midnight: '午夜藍',
  chocolate: '巧克力',
  ink: '墨黑',
};

export const APP_THEME_OPTIONS = [
  { id: 'teal', label: APP_THEME_LABELS.teal, swatch: APP_THEME_ACCENTS.teal },
  { id: 'rose', label: APP_THEME_LABELS.rose, swatch: APP_THEME_ACCENTS.rose },
  { id: 'gold', label: APP_THEME_LABELS.gold, swatch: APP_THEME_ACCENTS.gold },
  { id: 'indigo', label: APP_THEME_LABELS.indigo, swatch: APP_THEME_ACCENTS.indigo },
  { id: 'sage', label: APP_THEME_LABELS.sage, swatch: APP_THEME_ACCENTS.sage },
  { id: 'lavender', label: APP_THEME_LABELS.lavender, swatch: APP_THEME_ACCENTS.lavender },
  { id: 'midnight', label: APP_THEME_LABELS.midnight, swatch: APP_THEME_ACCENTS.midnight },
  { id: 'chocolate', label: APP_THEME_LABELS.chocolate, swatch: APP_THEME_ACCENTS.chocolate },
  { id: 'ink', label: APP_THEME_LABELS.ink, swatch: APP_THEME_ACCENTS.ink },
];

const BASE_BRAND_COLORS: Record<string, string> = {
  mint: '#B7E5CD',
  teal: '#4A857E',
  petrol: '#1F3E4D',
  rust: '#B04A2E',
  purple: '#6A4C78',
  dark: '#152B36',
  surface: '#1F3E4D',
};

const toRgb = (hex: string): RGB => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return { r, g, b };
};

const rgbToCssValue = (color: RGB) => `${color.r} ${color.g} ${color.b}`;

const rgbToHex = (color: RGB): string => {
  const r = color.r.toString(16).padStart(2, '0');
  const g = color.g.toString(16).padStart(2, '0');
  const b = color.b.toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
};

const darkenForLightMode = (color: RGB): RGB => {
  const hsl = rgbToHsl(color);
  const lightness = Math.max(0.25, hsl.l - 0.15);
  // For warm tones (especially rose/red), reduce saturation for Morandi aesthetic
  // For cool tones, keep or slightly increase saturation
  const isWarm = hsl.h <= 60 || hsl.h >= 330;
  const saturation = isWarm
    ? Math.max(0.3, hsl.s * 0.7) // Reduce saturation for warmer, softer feel
    : Math.min(0.7, hsl.s * 1.1); // Enhance for cool tones
  return hslToRgb({ h: hsl.h, s: saturation, l: lightness });
};

const brightenForDarkMode = (color: RGB): RGB => {
  const hsl = rgbToHsl(color);
  // Brighten more aggressively for better contrast in dark mode
  const lightness = Math.min(0.9, hsl.l + 0.4);
  // For dark tones, reduce saturation to avoid color cast (e.g., purple/blue dominance)
  const saturation = Math.max(0.15, hsl.s * 0.6);
  return hslToRgb({ h: hsl.h, s: saturation, l: lightness });
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta) % 6;
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }
  }

  h *= 60;
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h, s, l };
};

const hslToRgb = ({ h, s, l }: HSL): RGB => {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h < 60) {
    rPrime = chroma;
    gPrime = x;
  } else if (h < 120) {
    rPrime = x;
    gPrime = chroma;
  } else if (h < 180) {
    gPrime = chroma;
    bPrime = x;
  } else if (h < 240) {
    gPrime = x;
    bPrime = chroma;
  } else if (h < 300) {
    rPrime = x;
    bPrime = chroma;
  } else {
    rPrime = chroma;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
};

const deltaHue = (base: number, target: number) => {
  const difference = ((target - base + 540) % 360) - 180;
  return difference;
};

const recolorWithAccentHue = (
  baseHex: string,
  accentHue: number,
  options: {
    saturationScale?: number;
    saturationOffset?: number;
    lightnessScale?: number;
    lightnessOffset?: number;
    targetSaturation?: number;
    targetLightness?: number;
    accentInfluence?: number;
  } = {}
): RGB => {
  const baseHsl = rgbToHsl(toRgb(baseHex));
  const saturationScale = options.saturationScale ?? 1;
  const saturationOffset = options.saturationOffset ?? 0;
  const lightnessScale = options.lightnessScale ?? 1;
  const lightnessOffset = options.lightnessOffset ?? 0;

  const sRaw = options.targetSaturation ?? baseHsl.s * saturationScale + saturationOffset;
  const lRaw = options.targetLightness ?? baseHsl.l * lightnessScale + lightnessOffset;

  const s = clamp01(sRaw);
  const l = clamp01(lRaw);
  const influence = clamp01(options.accentInfluence ?? 1);
  const hue = (baseHsl.h + deltaHue(baseHsl.h, accentHue) * influence + 360) % 360;

  return hslToRgb({ h: hue, s, l });
};

const applyAppThemePalette = (themeId: string) => {
  if (typeof window === 'undefined') return;

  const root = window.document.documentElement;
  const accentHex = APP_THEME_ACCENTS[themeId] || APP_THEME_ACCENTS.teal;
  const accentRgb = toRgb(accentHex);
  const textAccentLight = darkenForLightMode(accentRgb);
  const textAccentDark = brightenForDarkMode(accentRgb);

  const accentHue = rgbToHsl(accentRgb).h;

  // For warm tones (reds/roses/golds/oranges/browns), use completely different color palettes
  // For cool/neutral tones (teals/blues/purples/grays), rotate the default palette
  // Warm range: 0-60° (reds to yellows) + 330-360° (magentas/deep reds)
  const isWarmAccent = accentHue <= 60 || accentHue >= 330;

  let mint: RGB;
  let petrol: RGB;
  let rust: RGB;
  let purple: RGB;
  let dark: RGB;
  let surface: RGB;

  if (isWarmAccent) {
    // For warm themes (reds/roses/golds/browns)
    // Strategy: Use neutral/cool tones for backgrounds, adapt accent-specific roles

    // Normalize hue to 0-360 range
    const normalizedHue = accentHue < 0 ? accentHue + 360 : accentHue;

    // Mint: Light tint of the accent (slightly desaturated and very light)
    const mintHue = normalizedHue; // Same hue as accent

    // Deep colors (petrol/dark): Use brown/neutral zone to avoid green
    // Map warm hues to neutral brown zone (160-210°) that never clashes
    const deepHue = 200; // Safe neutral blue-teal that works with all warm tones

    // Rust: If accent is red/rose (0-30°), use yellow/orange (45-55°) for warning
    //       Otherwise keep warm orange-red (15-25°)
    const rustHue =
      normalizedHue >= 330 || normalizedHue <= 30
        ? 50 // Yellow-orange for rose/red themes
        : 20; // Warm red-orange for gold/chocolate

    // Purple: Use accent's true complement, but shift away from green zone
    // For red (5°): +210° = 215° (safe blue)
    // For gold (40°): +240° = 280° (purple)
    const purpleHue = (normalizedHue + 240) % 360;

    // Create palette
    mint = hslToRgb({
      h: mintHue,
      s: 0.25, // Medium saturation for tinted feel
      l: 0.88, // Very light
    });

    petrol = hslToRgb({
      h: deepHue,
      s: 0.25, // Low saturation, neutral
      l: 0.28, // Dark
    });

    rust = hslToRgb({
      h: rustHue,
      s: 0.65, // High saturation for warning/accent
      l: 0.5, // Medium
    });

    purple = hslToRgb({
      h: purpleHue,
      s: 0.35, // Medium saturation
      l: 0.45, // Medium dark
    });

    dark = hslToRgb({
      h: deepHue,
      s: 0.2, // Very low saturation
      l: 0.12, // Very dark
    });

    surface = hslToRgb({
      h: deepHue,
      s: 0.2, // Very low saturation
      l: 0.22, // Dark
    });
  } else {
    // For cool/neutral themes (60-330°), use the rotating approach
    const accentSat = rgbToHsl(accentRgb).s;
    const targetSat = Math.min(0.5, accentSat * 0.8);

    // Simple approach: use accent hue to directly color each brand element
    const accentInfluenceValues = {
      mint: 0.15, // Mint should be close to accent
      petrol: 0.4, // Petrol gets strong accent influence
      rust: 0.3, // Rust gets moderate influence
      purple: 0.25, // Purple gets balanced influence
      dark: 0.2, // Dark should be mostly neutral
      surface: 0.25, // Surface gets moderate influence
    };

    const applyAccentToColor = (baseHex: string, influence: number): RGB => {
      const baseHsl = rgbToHsl(toRgb(baseHex));
      const hueShift = deltaHue(baseHsl.h, accentHue) * influence;
      return hslToRgb({
        h: (baseHsl.h + hueShift + 360) % 360,
        s: baseHsl.s,
        l: baseHsl.l,
      });
    };

    mint = applyAccentToColor(BASE_BRAND_COLORS.mint, accentInfluenceValues.mint);
    petrol = applyAccentToColor(BASE_BRAND_COLORS.petrol, accentInfluenceValues.petrol);
    rust = applyAccentToColor(BASE_BRAND_COLORS.rust, accentInfluenceValues.rust);
    purple = applyAccentToColor(BASE_BRAND_COLORS.purple, accentInfluenceValues.purple);
    dark = applyAccentToColor(BASE_BRAND_COLORS.dark, accentInfluenceValues.dark);
    surface = applyAccentToColor(BASE_BRAND_COLORS.surface, accentInfluenceValues.surface);
  }

  root.style.setProperty('--accent', rgbToCssValue(accentRgb));
  root.style.setProperty('--text-accent-light', rgbToCssValue(textAccentLight));
  root.style.setProperty('--text-accent-dark', rgbToCssValue(textAccentDark));
  root.style.setProperty('--brand-teal', rgbToCssValue(accentRgb));
  root.style.setProperty('--brand-mint', rgbToCssValue(mint));
  root.style.setProperty('--brand-petrol', rgbToCssValue(petrol));
  root.style.setProperty('--brand-rust', rgbToCssValue(rust));
  root.style.setProperty('--brand-purple', rgbToCssValue(purple));
  root.style.setProperty('--brand-dark', rgbToCssValue(dark));
  root.style.setProperty('--brand-surface', rgbToCssValue(surface));
  root.style.setProperty('--tone-teal', rgbToCssValue(toRgb(BASE_BRAND_COLORS.teal)));
  root.style.setProperty('--tone-purple', rgbToCssValue(toRgb(BASE_BRAND_COLORS.purple)));
  root.style.setProperty('--tone-rust', rgbToCssValue(toRgb(BASE_BRAND_COLORS.rust)));

  // Update browser theme-color meta tag for better platform integration
  // Use petrol (deep color) for visual consistency with app
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.setAttribute('name', 'theme-color');
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.setAttribute('content', rgbToHex(petrol));
};

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = storage.getTheme();
      if (saved === 'dark' || saved === 'light') return saved as 'dark' | 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [appTheme, setAppThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return storage.getAppTheme() || 'teal';
    }
    return 'teal';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      storage.setTheme(theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-app-theme', appTheme);
    applyAppThemePalette(appTheme);
    try {
      storage.setAppTheme(appTheme);
    } catch (e) {
      // ignore
    }
  }, [appTheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setAppTheme = (id: string) => {
    setAppThemeState(id);
  };

  return { theme, toggleTheme, appTheme, setAppTheme };
};
