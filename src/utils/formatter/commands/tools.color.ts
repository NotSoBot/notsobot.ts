import { Command, Interaction } from 'detritus-client';
import { Markup, intToHex } from 'detritus-client/lib/utils';

import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  createColorUrl,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  displayReply,
} from '../../../utils';


export const COMMAND_ID = 'tools.color';

export interface CommandArgs {
  color: string,
}

export interface RGB {
  r: number,
  g: number,
  b: number,
}

const MAX_COLOR = 0xFFFFFF;

// css named colors, the first name wins when two share a value (aqua/cyan, fuchsia/magenta, gray/grey)
export const COLOR_NAMES: ReadonlyArray<[string, number]> = Object.freeze([
  ['Alice Blue', 0xF0F8FF], ['Antique White', 0xFAEBD7], ['Aqua', 0x00FFFF], ['Aquamarine', 0x7FFFD4],
  ['Azure', 0xF0FFFF], ['Beige', 0xF5F5DC], ['Bisque', 0xFFE4C4], ['Black', 0x000000],
  ['Blanched Almond', 0xFFEBCD], ['Blue', 0x0000FF], ['Blue Violet', 0x8A2BE2], ['Brown', 0xA52A2A],
  ['Burly Wood', 0xDEB887], ['Cadet Blue', 0x5F9EA0], ['Chartreuse', 0x7FFF00], ['Chocolate', 0xD2691E],
  ['Coral', 0xFF7F50], ['Cornflower Blue', 0x6495ED], ['Cornsilk', 0xFFF8DC], ['Crimson', 0xDC143C],
  ['Cyan', 0x00FFFF], ['Dark Blue', 0x00008B], ['Dark Cyan', 0x008B8B], ['Dark Golden Rod', 0xB8860B],
  ['Dark Gray', 0xA9A9A9], ['Dark Grey', 0xA9A9A9], ['Dark Green', 0x006400], ['Dark Khaki', 0xBDB76B],
  ['Dark Magenta', 0x8B008B], ['Dark Olive Green', 0x556B2F], ['Dark Orange', 0xFF8C00], ['Dark Orchid', 0x9932CC],
  ['Dark Red', 0x8B0000], ['Dark Salmon', 0xE9967A], ['Dark Sea Green', 0x8FBC8F], ['Dark Slate Blue', 0x483D8B],
  ['Dark Slate Gray', 0x2F4F4F], ['Dark Slate Grey', 0x2F4F4F], ['Dark Turquoise', 0x00CED1], ['Dark Violet', 0x9400D3],
  ['Deep Pink', 0xFF1493], ['Deep Sky Blue', 0x00BFFF], ['Dim Gray', 0x696969], ['Dim Grey', 0x696969],
  ['Dodger Blue', 0x1E90FF], ['Fire Brick', 0xB22222], ['Floral White', 0xFFFAF0], ['Forest Green', 0x228B22],
  ['Fuchsia', 0xFF00FF], ['Gainsboro', 0xDCDCDC], ['Ghost White', 0xF8F8FF], ['Gold', 0xFFD700],
  ['Golden Rod', 0xDAA520], ['Gray', 0x808080], ['Grey', 0x808080], ['Green', 0x008000],
  ['Green Yellow', 0xADFF2F], ['Honey Dew', 0xF0FFF0], ['Hot Pink', 0xFF69B4], ['Indian Red', 0xCD5C5C],
  ['Indigo', 0x4B0082], ['Ivory', 0xFFFFF0], ['Khaki', 0xF0E68C], ['Lavender', 0xE6E6FA],
  ['Lavender Blush', 0xFFF0F5], ['Lawn Green', 0x7CFC00], ['Lemon Chiffon', 0xFFFACD], ['Light Blue', 0xADD8E6],
  ['Light Coral', 0xF08080], ['Light Cyan', 0xE0FFFF], ['Light Golden Rod Yellow', 0xFAFAD2], ['Light Gray', 0xD3D3D3],
  ['Light Grey', 0xD3D3D3], ['Light Green', 0x90EE90], ['Light Pink', 0xFFB6C1], ['Light Salmon', 0xFFA07A],
  ['Light Sea Green', 0x20B2AA], ['Light Sky Blue', 0x87CEFA], ['Light Slate Gray', 0x778899], ['Light Slate Grey', 0x778899],
  ['Light Steel Blue', 0xB0C4DE], ['Light Yellow', 0xFFFFE0], ['Lime', 0x00FF00], ['Lime Green', 0x32CD32],
  ['Linen', 0xFAF0E6], ['Magenta', 0xFF00FF], ['Maroon', 0x800000], ['Medium Aqua Marine', 0x66CDAA],
  ['Medium Blue', 0x0000CD], ['Medium Orchid', 0xBA55D3], ['Medium Purple', 0x9370DB], ['Medium Sea Green', 0x3CB371],
  ['Medium Slate Blue', 0x7B68EE], ['Medium Spring Green', 0x00FA9A], ['Medium Turquoise', 0x48D1CC], ['Medium Violet Red', 0xC71585],
  ['Midnight Blue', 0x191970], ['Mint Cream', 0xF5FFFA], ['Misty Rose', 0xFFE4E1], ['Moccasin', 0xFFE4B5],
  ['Navajo White', 0xFFDEAD], ['Navy', 0x000080], ['Old Lace', 0xFDF5E6], ['Olive', 0x808000],
  ['Olive Drab', 0x6B8E23], ['Orange', 0xFFA500], ['Orange Red', 0xFF4500], ['Orchid', 0xDA70D6],
  ['Pale Golden Rod', 0xEEE8AA], ['Pale Green', 0x98FB98], ['Pale Turquoise', 0xAFEEEE], ['Pale Violet Red', 0xDB7093],
  ['Papaya Whip', 0xFFEFD5], ['Peach Puff', 0xFFDAB9], ['Peru', 0xCD853F], ['Pink', 0xFFC0CB],
  ['Plum', 0xDDA0DD], ['Powder Blue', 0xB0E0E6], ['Purple', 0x800080], ['Rebecca Purple', 0x663399],
  ['Red', 0xFF0000], ['Rosy Brown', 0xBC8F8F], ['Royal Blue', 0x4169E1], ['Saddle Brown', 0x8B4513],
  ['Salmon', 0xFA8072], ['Sandy Brown', 0xF4A460], ['Sea Green', 0x2E8B57], ['Sea Shell', 0xFFF5EE],
  ['Sienna', 0xA0522D], ['Silver', 0xC0C0C0], ['Sky Blue', 0x87CEEB], ['Slate Blue', 0x6A5ACD],
  ['Slate Gray', 0x708090], ['Slate Grey', 0x708090], ['Snow', 0xFFFAFA], ['Spring Green', 0x00FF7F],
  ['Steel Blue', 0x4682B4], ['Tan', 0xD2B48C], ['Teal', 0x008080], ['Thistle', 0xD8BFD8],
  ['Tomato', 0xFF6347], ['Turquoise', 0x40E0D0], ['Violet', 0xEE82EE], ['Wheat', 0xF5DEB3],
  ['White', 0xFFFFFF], ['White Smoke', 0xF5F5F5], ['Yellow', 0xFFFF00], ['Yellow Green', 0x9ACD32],
  // discord's own
  ['Blurple', 0x5865F2], ['Old Blurple', 0x7289DA],
]);

// names are matched without spaces, dashes or underscores ("slate blue", "slate-blue", "SlateBlue")
const COLOR_NAMES_LOOKUP: ReadonlyMap<string, number> = new Map(COLOR_NAMES.map(([name, value]) => [normalizeName(name), value]));

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[\s_-]/g, '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits: number = 0): number {
  const factor = 10 ** digits;
  // avoids showing -0
  return (Math.round(value * factor) / factor) || 0;
}


export function rgbToInt({ r, g, b }: RGB): number {
  return (Math.round(clamp(r, 0, 255)) << 16) + (Math.round(clamp(g, 0, 255)) << 8) + Math.round(clamp(b, 0, 255));
}

export function intToRgb(color: number): RGB {
  return {r: (color >> 16) & 0xFF, g: (color >> 8) & 0xFF, b: color & 0xFF};
}

// h in degrees, the rest are 0..100
export function rgbToHsl({ r, g, b }: RGB): {h: number, s: number, l: number} {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const l = (max + min) / 2;
  const s = (delta) ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  return {h: hue(r, g, b, max, delta), s: s * 100, l: l * 100};
}

export function rgbToHsv({ r, g, b }: RGB): {h: number, s: number, v: number} {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  return {h: hue(r, g, b, max, delta), s: (max) ? (delta / max) * 100 : 0, v: max * 100};
}

function hue(r: number, g: number, b: number, max: number, delta: number): number {
  if (!delta) {
    return 0;
  }
  let h: number;
  if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }
  return (h * 60 + 360) % 360;
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  return chromaToRgb(h, chroma, l - chroma / 2);
}

export function hsvToRgb(h: number, s: number, v: number): RGB {
  s = clamp(s, 0, 100) / 100;
  v = clamp(v, 0, 100) / 100;
  const chroma = v * s;
  return chromaToRgb(h, chroma, v - chroma);
}

function chromaToRgb(h: number, chroma: number, m: number): RGB {
  h = ((h % 360) + 360) % 360 / 60;
  const x = chroma * (1 - Math.abs((h % 2) - 1));
  const [r, g, b] = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][Math.floor(h) % 6];
  return {r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255};
}

// 0..100 each
export function rgbToCmyk({ r, g, b }: RGB): {c: number, m: number, y: number, k: number} {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return {c: 0, m: 0, y: 0, k: 100};
  }
  return {c: (1 - r - k) / (1 - k) * 100, m: (1 - g - k) / (1 - k) * 100, y: (1 - b - k) / (1 - k) * 100, k: k * 100};
}

export function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  const [cc, mm, yy, kk] = [c, m, y, k].map((value) => clamp(value, 0, 100) / 100);
  return {r: 255 * (1 - cc) * (1 - kk), g: 255 * (1 - mm) * (1 - kk), b: 255 * (1 - yy) * (1 - kk)};
}

function linearChannel(value: number): number {
  value /= 255;
  return (value <= 0.04045) ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

// wcag relative luminance, 0..1
export function relativeLuminance({ r, g, b }: RGB): number {
  return 0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b);
}

export function contrastRatio(x: RGB, y: RGB): number {
  const [light, dark] = [relativeLuminance(x), relativeLuminance(y)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

// CIELAB with a D65 white point, distances in it are close to how different two colors look
export function rgbToLab(rgb: RGB): {l: number, a: number, b: number} {
  const r = linearChannel(rgb.r), g = linearChannel(rgb.g), b = linearChannel(rgb.b);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 1.00000;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856) ? Math.cbrt(t) : (7.787 * t) + 16 / 116;
  const fx = f(x), fy = f(y), fz = f(z);
  return {l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz)};
}

export function closestColorName(color: number): {name: string, value: number, exact: boolean} {
  const lab = rgbToLab(intToRgb(color));
  let best = COLOR_NAMES[0];
  let bestDistance = Infinity;
  for (let entry of COLOR_NAMES) {
    if (entry[1] === color) {
      return {name: entry[0], value: entry[1], exact: true};
    }
    const other = rgbToLab(intToRgb(entry[1]));
    const distance = (lab.l - other.l) ** 2 + (lab.a - other.a) ** 2 + (lab.b - other.b) ** 2;
    if (distance < bestDistance) {
      best = entry;
      bestDistance = distance;
    }
  }
  return {name: best[0], value: best[1], exact: false};
}

// rotates the hue while keeping saturation and lightness
export function rotateHue(color: number, degrees: number): number {
  const { h, s, l } = rgbToHsl(intToRgb(color));
  return rgbToInt(hslToRgb(h + degrees, s, l));
}


/*
 * Parses what people usually type for a color, returns null when it isn't one
 * - hex: `#6A5ACD`, `6a5acd`, `#abc`, `0x6A5ACD` (bare 3 or 6 digit numbers are read as hex)
 * - rgb: `106, 90, 205`, `106 90 205`, `rgb(106, 90, 205)`
 * - `hsl(248, 53%, 58%)`, `hsv(248, 56, 80)` (or hsb), `cmyk(48, 56, 0, 20)`
 * - an integer like discord's role colors: `6970061`
 * - a css color name: `slate blue`, `SlateBlue`
 * - `random`
 */
export function parseColor(value: string): number | null {
  const text = value.trim().toLowerCase();
  if (!text) {
    return null;
  }

  if (text === 'random') {
    return Math.floor(Math.random() * (MAX_COLOR + 1));
  }

  {
    const named = COLOR_NAMES_LOOKUP.get(normalizeName(text));
    if (named !== undefined) {
      return named;
    }
  }

  {
    const match = text.match(/^(?:#|0x)?([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (match) {
      let hex = match[1];
      if (hex.length === 3) {
        hex = hex.split('').map((digit) => digit + digit).join('');
      }
      return parseInt(hex, 16);
    }
  }

  if (/^\d+$/.test(text)) {
    const color = parseInt(text, 10);
    return (color <= MAX_COLOR) ? color : null;
  }

  {
    const match = text.match(/^(rgba?|hsla?|hsv|hsb|cmyk)?\s*\(?\s*([^()]*?)\s*\)?$/);
    if (match) {
      const type = (match[1] || 'rgb').replace(/a$/, '');
      // commas, spaces or the css `/ alpha` separator, units are dropped
      const numbers = match[2].split(/[\s,\/]+/).filter(Boolean).map((part) => {
        return (/^-?\d*\.?\d+(?:%|°|deg)?$/.test(part)) ? parseFloat(part) : NaN;
      });
      if (numbers.some(isNaN)) {
        return null;
      }

      switch (type) {
        case 'rgb': {
          // a 4th number is alpha, which a color code can't hold
          if (numbers.length === 3 || numbers.length === 4) {
            const [r, g, b] = numbers;
            if ([r, g, b].every((x) => 0 <= x && x <= 255)) {
              return rgbToInt({r, g, b});
            }
          }
        }; break;
        case 'hsl': {
          if (numbers.length === 3 || numbers.length === 4) {
            return rgbToInt(hslToRgb(numbers[0], numbers[1], numbers[2]));
          }
        }; break;
        case 'hsv':
        case 'hsb': {
          if (numbers.length === 3) {
            return rgbToInt(hsvToRgb(numbers[0], numbers[1], numbers[2]));
          }
        }; break;
        case 'cmyk': {
          if (numbers.length === 4) {
            return rgbToInt(cmykToRgb(numbers[0], numbers[1], numbers[2], numbers[3]));
          }
        }; break;
      }
    }
  }

  return null;
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);

  const color = parseColor(args.color || 'random');
  if (color === null) {
    throw new Error(translate('tools_color.unknown_color', {color: Markup.codestring(args.color.slice(0, 64))}));
  }

  const rgb = intToRgb(color);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const lab = rgbToLab(rgb);
  const hex = intToHex(color, true).toUpperCase();
  const closest = closestColorName(color);

  const toHex = (value: number) => Markup.codestring(intToHex(value, true).toUpperCase());
  const ratio = (other: RGB) => `${round(contrastRatio(rgb, other), 2).toLocaleString(language)}:1`;

  const payload: DisplayPayload = {};
  payload.color = color;
  payload.thumbnail = createColorUrl(color, 128, 128);
  payload.title = (closest.exact) ? `${closest.name} (${hex})` : hex;

  payload.description = displayDetails([
    displayDetailsLine([
      displayDetail('Hex', Markup.codestring(hex)),
      displayDetail('RGB', Markup.codestring(`${rgb.r}, ${rgb.g}, ${rgb.b}`)),
      displayDetail(translate('tools_color.decimal'), Markup.codestring(String(color))),
    ]),
    displayDetailsLine([
      displayDetail('HSL', Markup.codestring(`${round(hsl.h)}°, ${round(hsl.s)}%, ${round(hsl.l)}%`)),
      displayDetail('HSV', Markup.codestring(`${round(hsv.h)}°, ${round(hsv.s)}%, ${round(hsv.v)}%`)),
    ]),
    displayDetailsLine([
      displayDetail('CMYK', Markup.codestring(`${round(cmyk.c)}%, ${round(cmyk.m)}%, ${round(cmyk.y)}%, ${round(cmyk.k)}%`)),
      displayDetail('Lab', Markup.codestring(`${round(lab.l, 1)}, ${round(lab.a, 1)}, ${round(lab.b, 1)}`)),
    ]),
    (!closest.exact) && displayDetail(translate('tools_color.closest'), `${closest.name} ${toHex(closest.value)}`),
    displayDetailsLine([
      displayDetail(translate('tools_color.complement'), toHex(color ^ MAX_COLOR)),
      displayDetail(translate('tools_color.triadic'), `${toHex(rotateHue(color, 120))} ${toHex(rotateHue(color, 240))}`),
    ]),
    displayDetail(translate('tools_color.contrast'), translate('tools_color.contrast_value', {
      white: Markup.codestring(ratio({r: 255, g: 255, b: 255})),
      black: Markup.codestring(ratio({r: 0, g: 0, b: 0})),
    })),
    displayLinks([
      ['Encycolorpedia', `https://encycolorpedia.com/${hex.slice(1).toLowerCase()}`],
      ['color-hex', `https://www.color-hex.com/color/${hex.slice(1).toLowerCase()}`],
    ]),
  ]);

  return displayReply(context, payload);
}
