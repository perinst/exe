/**
 * Color Conversion Utilities
 * This file provides functions to convert between different color models:
 * - RGB to/from HEX
 * - RGB to/from HSL (Hue, Saturation, Lightness)
 * - RGB to/from HSV/HSB (Hue, Saturation, Value/Brightness)
 * - RGB to/from CMYK (Cyan, Magenta, Yellow, Key/Black)
 * - RGB to/from YUV (Luminance, Chrominance)
 * - RGB to/from Lab (CIELAB color space)
 */

// Types for different color models
export type RGB = { r: number; g: number; b: number };
export type RGBA = RGB & { a: number };
export type HSL = { h: number; s: number; l: number };
export type HSLA = HSL & { a: number };
export type HSV = { h: number; s: number; v: number };
export type HSVA = HSV & { a: number };
export type CMYK = { c: number; m: number; y: number; k: number };
export type YUV = { y: number; u: number; v: number };
export type Lab = { l: number; a: number; b: number };
export type RYB = { r: number; y: number; b: number };

/**
 * Convert a hex color string to RGB
 * @param hex - Hex color string (e.g., "#FF0000" or "#F00")
 * @returns RGB object with values between 0-255
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Handle shorthand form (e.g. "#F00")
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB to a hex color string
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string (e.g., "#FF0000")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Convert an RGB object to a hex color string
 * @param rgb - RGB object with values between 0-255
 * @returns Hex color string (e.g., "#FF0000")
 */
export function rgbObjToHex(rgb: RGB): string {
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert RGB to CMYK
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns CMYK object with values between 0-1
 */
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  // Normalize RGB values
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  // Calculate Key (Black)
  const k = 1 - Math.max(normalizedR, normalizedG, normalizedB);

  // Edge case: if k is 1, then c, m, y should all be 0
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }

  // Calculate CMY values
  const c = (1 - normalizedR - k) / (1 - k);
  const m = (1 - normalizedG - k) / (1 - k);
  const y = (1 - normalizedB - k) / (1 - k);

  return {
    c: Math.round(c * 100) / 100,
    m: Math.round(m * 100) / 100,
    y: Math.round(y * 100) / 100,
    k: Math.round(k * 100) / 100,
  };
}

/**
 * Convert CMYK to RGB
 * @param c - Cyan component (0-1)
 * @param m - Magenta component (0-1)
 * @param y - Yellow component (0-1)
 * @param k - Key/Black component (0-1)
 * @returns RGB object with values between 0-255
 */
export function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  // Normalize values between 0-1 if they aren't already
  c = Math.min(1, Math.max(0, c));
  m = Math.min(1, Math.max(0, m));
  y = Math.min(1, Math.max(0, y));
  k = Math.min(1, Math.max(0, k));

  // Calculate RGB values
  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));

  return { r, g, b };
}

/**
 * Convert RGB to HSL
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns HSL object with h in degrees (0-360) and s,l in percent (0-100)
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  // Normalize RGB values
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  const max = Math.max(normalizedR, normalizedG, normalizedB);
  const min = Math.min(normalizedR, normalizedG, normalizedB);

  // Calculate lightness
  const l = (max + min) / 2;

  // If max and min are equal, it's a shade of gray (no saturation)
  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  // Calculate saturation
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  // Calculate hue
  let h;
  switch (max) {
    case normalizedR:
      h =
        ((normalizedG - normalizedB) / d +
          (normalizedG < normalizedB ? 6 : 0)) *
        60;
      break;
    case normalizedG:
      h = ((normalizedB - normalizedR) / d + 2) * 60;
      break;
    case normalizedB:
    default:
      h = ((normalizedR - normalizedG) / d + 4) * 60;
      break;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 * @param h - Hue in degrees (0-360)
 * @param s - Saturation in percent (0-100)
 * @param l - Lightness in percent (0-100)
 * @returns RGB object with values between 0-255
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  // Normalize values
  h = ((h % 360) + 360) % 360; // Ensure h is between 0-360
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;

  // No saturation means a shade of gray
  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  // Helper function
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const normalizedH = h / 360;
  const r = hueToRgb(p, q, normalizedH + 1 / 3);
  const g = hueToRgb(p, q, normalizedH);
  const b = hueToRgb(p, q, normalizedH - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to HSV
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns HSV object with h in degrees (0-360) and s,v in percent (0-100)
 */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  // Normalize RGB values
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  const max = Math.max(normalizedR, normalizedG, normalizedB);
  const min = Math.min(normalizedR, normalizedG, normalizedB);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case normalizedR:
        h =
          ((normalizedG - normalizedB) / d +
            (normalizedG < normalizedB ? 6 : 0)) *
          60;
        break;
      case normalizedG:
        h = ((normalizedB - normalizedR) / d + 2) * 60;
        break;
      case normalizedB:
      default:
        h = ((normalizedR - normalizedG) / d + 4) * 60;
        break;
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert HSV to RGB
 * @param h - Hue in degrees (0-360)
 * @param s - Saturation in percent (0-100)
 * @param v - Value in percent (0-100)
 * @returns RGB object with values between 0-255
 */
export function hsvToRgb(h: number, s: number, v: number): RGB {
  // Normalize values
  h = ((h % 360) + 360) % 360; // Ensure h is between 0-360
  s = Math.min(100, Math.max(0, s)) / 100;
  v = Math.min(100, Math.max(0, v)) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Convert RGB to YUV
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns YUV object (Y: 0-1, U: -0.5-0.5, V: -0.5-0.5)
 */
export function rgbToYuv(r: number, g: number, b: number): YUV {
  // Normalize RGB values
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  // BT.709 conversion (standard for HDTV)
  const y = 0.2126 * normalizedR + 0.7152 * normalizedG + 0.0722 * normalizedB;
  const u = 0.492 * (normalizedB - y);
  const v = 0.877 * (normalizedR - y);

  return {
    y: Math.round(y * 100) / 100,
    u: Math.round(u * 100) / 100,
    v: Math.round(v * 100) / 100,
  };
}

/**
 * Convert YUV to RGB
 * @param y - Luminance component (0-1)
 * @param u - U chrominance component (-0.5-0.5)
 * @param v - V chrominance component (-0.5-0.5)
 * @returns RGB object with values between 0-255
 */
export function yuvToRgb(y: number, u: number, v: number): RGB {
  // BT.709 conversion
  const r = y + 1.13983 * v;
  const g = y - 0.39465 * u - 0.5806 * v;
  const b = y + 2.03211 * u;

  return {
    r: Math.round(Math.max(0, Math.min(1, r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, b)) * 255),
  };
}

/**
 * Convert RGB to Lab color space
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Lab object (L: 0-100, a: -128-127, b: -128-127)
 */
export function rgbToLab(r: number, g: number, _b: number): Lab {
  // First convert RGB to XYZ
  // Normalize RGB values
  let normalizedR = r / 255;
  let normalizedG = g / 255;
  let normalizedB = _b / 255;

  // Apply gamma correction
  normalizedR =
    normalizedR > 0.04045
      ? Math.pow((normalizedR + 0.055) / 1.055, 2.4)
      : normalizedR / 12.92;
  normalizedG =
    normalizedG > 0.04045
      ? Math.pow((normalizedG + 0.055) / 1.055, 2.4)
      : normalizedG / 12.92;
  normalizedB =
    normalizedB > 0.04045
      ? Math.pow((normalizedB + 0.055) / 1.055, 2.4)
      : normalizedB / 12.92;

  // Convert to XYZ using sRGB matrix
  const x = normalizedR * 0.4124 + normalizedG * 0.3576 + normalizedB * 0.1805;
  const y = normalizedR * 0.2126 + normalizedG * 0.7152 + normalizedB * 0.0722;
  const z = normalizedR * 0.0193 + normalizedG * 0.1192 + normalizedB * 0.9505;

  // Then convert XYZ to Lab
  // Use D65 white point
  const xRef = 0.95047;
  const yRef = 1.0;
  const zRef = 1.08883;

  const xNorm = x / xRef;
  const yNorm = y / yRef;
  const zNorm = z / zRef;

  const fx =
    xNorm > 0.008856 ? Math.pow(xNorm, 1 / 3) : 7.787 * xNorm + 16 / 116;
  const fy =
    yNorm > 0.008856 ? Math.pow(yNorm, 1 / 3) : 7.787 * yNorm + 16 / 116;
  const fz =
    zNorm > 0.008856 ? Math.pow(zNorm, 1 / 3) : 7.787 * zNorm + 16 / 116;

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return {
    l: Math.round(l),
    a: Math.round(a),
    b: Math.round(b),
  };
}

/**
 * Convert RGB to RYB (Red, Yellow, Blue) - Traditional artist color wheel
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns RYB object with values between 0-255
 */
export function rgbToRyb(r: number, g: number, b: number): RYB {
  // Normalize RGB values to 0-1 range
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  // Remove white component
  const w = Math.min(normalizedR, normalizedG, normalizedB);
  const redAdjusted = normalizedR - w;
  const greenAdjusted = normalizedG - w;
  const blueAdjusted = normalizedB - w;

  const mg = Math.max(redAdjusted, greenAdjusted, blueAdjusted);

  // Calculate RYB values
  let rybR = redAdjusted - Math.min(redAdjusted, greenAdjusted);
  let rybY = (greenAdjusted + Math.min(redAdjusted, greenAdjusted)) / 2;
  let rybB = (blueAdjusted + Math.min(greenAdjusted, blueAdjusted)) / 2;

  // Normalize
  if (mg > 0) {
    const n = Math.max(rybR, rybY, rybB) / mg;
    if (n > 0) {
      rybR /= n;
      rybY /= n;
      rybB /= n;
    }
  }

  // Add back white component
  rybR += w;
  rybY += w;
  rybB += w;

  return {
    r: Math.round(Math.max(0, Math.min(1, rybR)) * 255),
    y: Math.round(Math.max(0, Math.min(1, rybY)) * 255),
    b: Math.round(Math.max(0, Math.min(1, rybB)) * 255),
  };
}

/**
 * Convert RYB to RGB
 * @param r - Red component (0-255)
 * @param y - Yellow component (0-255)
 * @param b - Blue component (0-255)
 * @returns RGB object with values between 0-255
 */
export function rybToRgb(r: number, y: number, b: number): RGB {
  // Normalize RYB values to 0-1 range
  const normalizedR = r / 255;
  const normalizedY = y / 255;
  const normalizedB = b / 255;

  // Remove white component
  const w = Math.min(normalizedR, normalizedY, normalizedB);
  const redAdjusted = normalizedR - w;
  const yellowAdjusted = normalizedY - w;
  const blueAdjusted = normalizedB - w;

  const my = Math.max(redAdjusted, yellowAdjusted, blueAdjusted);

  // Calculate RGB values
  let rgbR = redAdjusted - Math.min(redAdjusted, yellowAdjusted);
  let rgbG = (yellowAdjusted + Math.min(redAdjusted, yellowAdjusted)) / 2;
  let rgbB = (blueAdjusted + Math.min(yellowAdjusted, blueAdjusted)) / 2;

  // Normalize
  if (my > 0) {
    const n = Math.max(rgbR, rgbG, rgbB) / my;
    if (n > 0) {
      rgbR /= n;
      rgbG /= n;
      rgbB /= n;
    }
  }

  // Add back white component
  rgbR += w;
  rgbG += w;
  rgbB += w;

  return {
    r: Math.round(Math.max(0, Math.min(1, rgbR)) * 255),
    g: Math.round(Math.max(0, Math.min(1, rgbG)) * 255),
    b: Math.round(Math.max(0, Math.min(1, rgbB)) * 255),
  };
}

/**
 * Convert a color from one format to another
 * @param color - The color to convert
 * @param fromFormat - The format of the input color
 * @param toFormat - The format to convert to
 * @returns The converted color in the requested format
 */
export function convertColor(
  color: RGB | HSL | HSV | CMYK | YUV | Lab | RYB | string,
  fromFormat: "rgb" | "hsl" | "hsv" | "cmyk" | "yuv" | "lab" | "ryb" | "hex",
  toFormat: "rgb" | "hsl" | "hsv" | "cmyk" | "yuv" | "lab" | "ryb" | "hex"
): RGB | HSL | HSV | CMYK | YUV | Lab | RYB | string {
  // First convert to RGB as an intermediate format
  let rgb: RGB;

  switch (fromFormat) {
    case "rgb":
      rgb = color as RGB;
      break;
    case "hex":
      rgb = hexToRgb(color as string);
      break;
    case "hsl":
      const hsl = color as HSL;
      rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      break;
    case "hsv":
      const hsv = color as HSV;
      rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      break;
    case "cmyk":
      const cmyk = color as CMYK;
      rgb = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
      break;
    case "yuv":
      const yuv = color as YUV;
      rgb = yuvToRgb(yuv.y, yuv.u, yuv.v);
      break;
    case "ryb":
      const ryb = color as RYB;
      rgb = rybToRgb(ryb.r, ryb.y, ryb.b);
      break;
    default:
      throw new Error(`Unsupported format conversion from: ${fromFormat}`);
  }

  // Now convert from RGB to the target format
  switch (toFormat) {
    case "rgb":
      return rgb;
    case "hex":
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    case "hsl":
      return rgbToHsl(rgb.r, rgb.g, rgb.b);
    case "hsv":
      return rgbToHsv(rgb.r, rgb.g, rgb.b);
    case "cmyk":
      return rgbToCmyk(rgb.r, rgb.g, rgb.b);
    case "yuv":
      return rgbToYuv(rgb.r, rgb.g, rgb.b);
    case "lab":
      return rgbToLab(rgb.r, rgb.g, rgb.b);
    case "ryb":
      return rgbToRyb(rgb.r, rgb.g, rgb.b);
    default:
      throw new Error(`Unsupported format conversion to: ${toFormat}`);
  }
}

// Helper function to get color brightness (useful for determining if text should be black or white)
export function getBrightness(r: number, g: number, b: number): number {
  // Formula: (299*R + 587*G + 114*B) / 1000
  return (299 * r + 587 * g + 114 * b) / 1000;
}

// Determine if text should be black or white based on background color
export function getContrastColor(r: number, g: number, b: number): string {
  return getBrightness(r, g, b) >= 128 ? "#000000" : "#FFFFFF";
}

// Convert RGB to a CSS rgba string
export function rgbToRgbaString(
  r: number,
  g: number,
  b: number,
  a: number = 1
): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Convert hex to a CSS rgba string
export function hexToRgbaString(hex: string, alpha: number = 1): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
