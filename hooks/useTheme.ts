
import { useState, useEffect } from 'react';

type RGB = { r: number; g: number; b: number };

type HSL = { h: number; s: number; l: number };

const APP_THEME_ACCENTS: Record<string, string> = {
  teal: '#4A857E',
  rose: '#D66F65',
  gold: '#D4A373',
  indigo: '#6B7A8F',
  sage: '#7A9E7E',
  lavender: '#9D8189',
};

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
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return { r, g, b };
};

const rgbToCssValue = (color: RGB) => `${color.r} ${color.g} ${color.b}`;

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

  const sRaw = options.targetSaturation ?? (baseHsl.s * saturationScale + saturationOffset);
  const lRaw = options.targetLightness ?? (baseHsl.l * lightnessScale + lightnessOffset);

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

  if (themeId === 'teal') {
    root.style.setProperty('--accent', rgbToCssValue(accentRgb));
    root.style.setProperty('--brand-teal', rgbToCssValue(toRgb(BASE_BRAND_COLORS.teal)));
    root.style.setProperty('--brand-mint', rgbToCssValue(toRgb(BASE_BRAND_COLORS.mint)));
    root.style.setProperty('--brand-petrol', rgbToCssValue(toRgb(BASE_BRAND_COLORS.petrol)));
    root.style.setProperty('--brand-rust', rgbToCssValue(toRgb(BASE_BRAND_COLORS.rust)));
    root.style.setProperty('--brand-purple', rgbToCssValue(toRgb(BASE_BRAND_COLORS.purple)));
    root.style.setProperty('--brand-dark', rgbToCssValue(toRgb(BASE_BRAND_COLORS.dark)));
    root.style.setProperty('--brand-surface', rgbToCssValue(toRgb(BASE_BRAND_COLORS.surface)));
    root.style.setProperty('--tone-teal', rgbToCssValue(toRgb(BASE_BRAND_COLORS.teal)));
    root.style.setProperty('--tone-purple', rgbToCssValue(toRgb(BASE_BRAND_COLORS.purple)));
    root.style.setProperty('--tone-rust', rgbToCssValue(toRgb(BASE_BRAND_COLORS.rust)));
    return;
  }

  const accentHue = rgbToHsl(accentRgb).h;

  const mint = recolorWithAccentHue(BASE_BRAND_COLORS.mint, accentHue, {
    targetSaturation: 0.16,
    targetLightness: 0.9,
    accentInfluence: 0.75,
  });
  const petrol = recolorWithAccentHue(BASE_BRAND_COLORS.petrol, accentHue, {
    saturationScale: 1.05,
    accentInfluence: 0.35,
  });
  const rust = recolorWithAccentHue(BASE_BRAND_COLORS.rust, accentHue, {
    saturationScale: 1.05,
    accentInfluence: 0.2,
  });
  const purple = recolorWithAccentHue(BASE_BRAND_COLORS.purple, accentHue, {
    saturationScale: 1.05,
    accentInfluence: 0.2,
  });
  const dark = recolorWithAccentHue(BASE_BRAND_COLORS.dark, accentHue, {
    targetSaturation: 0.25,
    targetLightness: 0.12,
    accentInfluence: 0.25,
  });
  const surface = recolorWithAccentHue(BASE_BRAND_COLORS.surface, accentHue, {
    targetSaturation: 0.2,
    targetLightness: 0.18,
    accentInfluence: 0.3,
  });

  root.style.setProperty('--accent', rgbToCssValue(accentRgb));
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
};

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bingoTheme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [appTheme, setAppThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bingoAppTheme') || 'teal';
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
    localStorage.setItem('bingoTheme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-app-theme', appTheme);
    applyAppThemePalette(appTheme);
    localStorage.setItem('bingoAppTheme', appTheme);
  }, [appTheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setAppTheme = (id: string) => {
    setAppThemeState(id);
  };

  return { theme, toggleTheme, appTheme, setAppTheme };
};
