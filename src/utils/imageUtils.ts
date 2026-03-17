/**
 * Image utility functions for format conversions and pixel manipulation.
 */

/**
 * Create an RGBA buffer filled with a solid color.
 * Useful for testing.
 */
export function createSolidRGBA(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
  a: number,
): Uint8Array {
  const buffer = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    buffer[i * 4] = r;
    buffer[i * 4 + 1] = g;
    buffer[i * 4 + 2] = b;
    buffer[i * 4 + 3] = a;
  }
  return buffer;
}

/**
 * Get pixel value at (x, y) from RGBA buffer.
 */
export function getPixel(
  buffer: Uint8Array,
  width: number,
  x: number,
  y: number,
): { r: number; g: number; b: number; a: number } {
  const idx = (y * width + x) * 4;
  return {
    r: buffer[idx],
    g: buffer[idx + 1],
    b: buffer[idx + 2],
    a: buffer[idx + 3],
  };
}

/**
 * Set pixel alpha at (x, y) in RGBA buffer.
 */
export function setPixelAlpha(
  buffer: Uint8Array,
  width: number,
  x: number,
  y: number,
  alpha: number,
): void {
  const idx = (y * width + x) * 4 + 3;
  buffer[idx] = Math.max(0, Math.min(255, alpha));
}
