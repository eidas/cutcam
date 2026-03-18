import { extractAlphaMatte, applyAlphaToRGBA } from '../../../services/onnx/postprocess';
import { MODEL_INPUT_SIZE } from '../../../services/onnx/preprocess';

describe('extractAlphaMatte', () => {
  it('returns array of correct size', () => {
    const matteSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    const outputData = new Float32Array(matteSize).fill(0.5);
    const alpha = extractAlphaMatte(outputData, 10, 10);
    expect(alpha.length).toBe(100);
  });

  it('normalizes uniform values to 0 (min==max case)', () => {
    const matteSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    const outputData = new Float32Array(matteSize).fill(0.5);
    const alpha = extractAlphaMatte(outputData, 1, 1);
    // When all values are equal, range is 1 (fallback), (0.5 - 0.5)/1 * 255 = 0
    expect(alpha[0]).toBe(0);
  });

  it('maps min to 0 and max to 255', () => {
    const matteSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    const outputData = new Float32Array(matteSize).fill(0);
    // Set right half of first row to 1 (maps to pixel (1,0) in 2x1 output)
    const halfX = Math.floor(MODEL_INPUT_SIZE / 2);
    for (let x = halfX; x < MODEL_INPUT_SIZE; x++) {
      outputData[x] = 1;
    }
    const alpha = extractAlphaMatte(outputData, 2, 1);
    expect(alpha[0]).toBe(0);
    expect(alpha[1]).toBe(255);
  });

  it('handles 1x1 output', () => {
    const matteSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    const outputData = new Float32Array(matteSize).fill(0);
    outputData[0] = 1;
    const alpha = extractAlphaMatte(outputData, 1, 1);
    expect(alpha.length).toBe(1);
  });
});

describe('applyAlphaToRGBA', () => {
  it('sets alpha channel on RGBA buffer', () => {
    const rgba = new Uint8Array([100, 150, 200, 255, 50, 60, 70, 255]);
    const alpha = new Uint8Array([128, 64]);
    applyAlphaToRGBA(rgba, alpha, 2, 1);
    expect(rgba[3]).toBe(128);
    expect(rgba[7]).toBe(64);
  });

  it('preserves RGB values', () => {
    const rgba = new Uint8Array([10, 20, 30, 255]);
    const alpha = new Uint8Array([0]);
    applyAlphaToRGBA(rgba, alpha, 1, 1);
    expect(rgba[0]).toBe(10);
    expect(rgba[1]).toBe(20);
    expect(rgba[2]).toBe(30);
    expect(rgba[3]).toBe(0);
  });

  it('handles multiple rows', () => {
    // 2x2 image
    const rgba = new Uint8Array(16).fill(255);
    const alpha = new Uint8Array([10, 20, 30, 40]);
    applyAlphaToRGBA(rgba, alpha, 2, 2);
    expect(rgba[3]).toBe(10);
    expect(rgba[7]).toBe(20);
    expect(rgba[11]).toBe(30);
    expect(rgba[15]).toBe(40);
  });
});
