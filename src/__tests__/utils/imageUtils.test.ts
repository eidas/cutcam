import { createSolidRGBA, getPixel, setPixelAlpha } from '../../utils/imageUtils';

describe('createSolidRGBA', () => {
  it('creates buffer with correct size', () => {
    const buf = createSolidRGBA(2, 3, 0, 0, 0, 0);
    expect(buf.length).toBe(2 * 3 * 4);
  });

  it('fills all pixels with specified color', () => {
    const buf = createSolidRGBA(2, 2, 100, 150, 200, 255);
    for (let i = 0; i < 4; i++) {
      expect(buf[i * 4]).toBe(100);
      expect(buf[i * 4 + 1]).toBe(150);
      expect(buf[i * 4 + 2]).toBe(200);
      expect(buf[i * 4 + 3]).toBe(255);
    }
  });

  it('creates 1x1 image', () => {
    const buf = createSolidRGBA(1, 1, 10, 20, 30, 40);
    expect(buf).toEqual(new Uint8Array([10, 20, 30, 40]));
  });
});

describe('getPixel', () => {
  it('returns correct pixel at (0,0)', () => {
    const buf = createSolidRGBA(2, 2, 10, 20, 30, 40);
    const pixel = getPixel(buf, 2, 0, 0);
    expect(pixel).toEqual({ r: 10, g: 20, b: 30, a: 40 });
  });

  it('returns correct pixel at offset position', () => {
    const buf = new Uint8Array([
      1, 2, 3, 4,   // (0,0)
      5, 6, 7, 8,   // (1,0)
      9, 10, 11, 12, // (0,1)
      13, 14, 15, 16, // (1,1)
    ]);
    expect(getPixel(buf, 2, 1, 0)).toEqual({ r: 5, g: 6, b: 7, a: 8 });
    expect(getPixel(buf, 2, 0, 1)).toEqual({ r: 9, g: 10, b: 11, a: 12 });
    expect(getPixel(buf, 2, 1, 1)).toEqual({ r: 13, g: 14, b: 15, a: 16 });
  });
});

describe('setPixelAlpha', () => {
  it('sets alpha at specified position', () => {
    const buf = createSolidRGBA(2, 2, 100, 100, 100, 255);
    setPixelAlpha(buf, 2, 1, 1, 128);
    expect(getPixel(buf, 2, 1, 1).a).toBe(128);
    // Other pixels unchanged
    expect(getPixel(buf, 2, 0, 0).a).toBe(255);
  });

  it('clamps alpha to 0-255 range', () => {
    const buf = createSolidRGBA(1, 1, 0, 0, 0, 128);
    setPixelAlpha(buf, 1, 0, 0, 300);
    expect(getPixel(buf, 1, 0, 0).a).toBe(255);

    setPixelAlpha(buf, 1, 0, 0, -10);
    expect(getPixel(buf, 1, 0, 0).a).toBe(0);
  });

  it('does not modify RGB channels', () => {
    const buf = createSolidRGBA(1, 1, 10, 20, 30, 255);
    setPixelAlpha(buf, 1, 0, 0, 0);
    const pixel = getPixel(buf, 1, 0, 0);
    expect(pixel.r).toBe(10);
    expect(pixel.g).toBe(20);
    expect(pixel.b).toBe(30);
  });
});
