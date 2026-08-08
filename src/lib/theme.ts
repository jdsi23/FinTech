import type { AppearancePrefs, LayoutMode } from '../types/firestore'

// Tailwind v4 compiles every utility class to reference a CSS custom
// property (verified against the actual build output: `.bg-indigo-600{
// background-color:var(--color-indigo-600)}`), and `indigo` is this app's
// one consistent brand/accent color throughout. Overriding these variables
// on :root (inline style beats any stylesheet rule) re-themes every
// existing indigo-colored element app-wide with zero changes to the
// components that use it.
export const THEME_SHADES = [50, 300, 400, 500, 600, 700, 800, 950] as const

// Calibrated against Tailwind's real indigo-600 (oklch 51.1% lightness,
// confirmed via the compiled CSS) so the "600" step lines up with what the
// app already looked like before any customization.
const SHADE_LIGHTNESS: Record<(typeof THEME_SHADES)[number], number> = {
  50: 97,
  300: 80,
  400: 70,
  500: 62,
  600: 52,
  700: 43,
  800: 35,
  950: 18,
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim()
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6)
  const num = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let [r, g, b] = hexToRgb(hex)
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const light = l / 100
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = light - c / 2
  let [r, g, b] = [0, 0, 0]
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

/** The 8 indigo shades this app actually uses, derived from one base color
 * by keeping its hue/saturation and stepping lightness per shade. */
export function buildColorRamp(baseHex: string): Record<(typeof THEME_SHADES)[number], string> {
  const { h, s } = hexToHsl(baseHex)
  const ramp = {} as Record<(typeof THEME_SHADES)[number], string>
  for (const shade of THEME_SHADES) {
    ramp[shade] = hslToHex(h, s, SHADE_LIGHTNESS[shade])
  }
  return ramp
}

/** Applies a base color's ramp to :root, live-reskinning every indigo-*
 * element app-wide. Call with DEFAULT_APPEARANCE.primaryColor to restore
 * the app's original look. */
export function applyColorRamp(baseHex: string) {
  const ramp = buildColorRamp(baseHex)
  const root = document.documentElement.style
  for (const shade of THEME_SHADES) {
    root.setProperty(`--color-indigo-${shade}`, ramp[shade])
  }
}

export interface AppearancePreset {
  id: string
  label: string
  description: string
  primaryColor: string
  layoutMode: LayoutMode
}

export const PRESETS: AppearancePreset[] = [
  {
    id: 'default',
    label: 'Default',
    description: "ForecastFlow's original indigo look.",
    primaryColor: '#6366f1',
    layoutMode: 'default',
  },
  {
    id: 'simple',
    label: 'Simple',
    description: 'A compact, bookmark-bar-style nav with no branding.',
    primaryColor: '#6366f1',
    layoutMode: 'simple',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'A moody deep-violet accent.',
    primaryColor: '#7c3aed',
    layoutMode: 'default',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'A cool teal accent.',
    primaryColor: '#0d9488',
    layoutMode: 'default',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'A warm amber accent.',
    primaryColor: '#ea580c',
    layoutMode: 'default',
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'A grounded green accent.',
    primaryColor: '#16a34a',
    layoutMode: 'default',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Pick your own color and layout below.',
    primaryColor: '#6366f1',
    layoutMode: 'custom',
  },
]

export const DEFAULT_APPEARANCE: AppearancePrefs = {
  presetId: 'default',
  primaryColor: '#6366f1',
  layoutMode: 'default',
  showBranding: true,
  compactNav: false,
  updatedAt: 0,
}
