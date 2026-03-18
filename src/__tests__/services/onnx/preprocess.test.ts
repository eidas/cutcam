import { rgbaToNCHW, getInputDims, MODEL_INPUT_SIZE } from '../../../services/onnx/preprocess';

describe('getInputDims', () => {
  it('returns [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]', () => {
    expect(getInputDims()).toEqual([1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
  });
});

describe('MODEL_INPUT_SIZE', () => {
  it('is 1024', () => {
    expect(MODEL_INPUT_SIZE).toBe(1024);
  });
});

describe('rgbaToNCHW', () => {
  it('returns Float32Array of correct size', () => {
    const rgba = new Uint8Array(2 * 2 * 4);
    const result = rgbaToNCHW(rgba, 2, 2);
    expect(result.length).toBe(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  });

  it('normalizes pixel values to [0, 1]', () => {
    // 1x1 white pixel
    const rgba = new Uint8Array([255, 255, 255, 255]);
    const result = rgbaToNCHW(rgba, 1, 1);
    const channelSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    // All pixels should be 1.0 since the source is uniformly white
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < channelSize; i++) {
        expect(result[c * channelSize + i]).toBeCloseTo(1.0);
      }
    }
  });

  it('normalizes black pixel to 0', () => {
    const rgba = new Uint8Array([0, 0, 0, 255]);
    const result = rgbaToNCHW(rgba, 1, 1);
    const channelSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    expect(result[0]).toBeCloseTo(0);
    expect(result[channelSize]).toBeCloseTo(0);
    expect(result[2 * channelSize]).toBeCloseTo(0);
  });

  it('separates RGB channels correctly', () => {
    // 1x1 pixel: R=255, G=128, B=0
    const rgba = new Uint8Array([255, 128, 0, 255]);
    const result = rgbaToNCHW(rgba, 1, 1);
    const channelSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    expect(result[0]).toBeCloseTo(1.0);           // R
    expect(result[channelSize]).toBeCloseTo(128 / 255); // G
    expect(result[2 * channelSize]).toBeCloseTo(0);     // B
  });

  it('ignores alpha channel', () => {
    const rgba1 = new Uint8Array([100, 100, 100, 0]);
    const rgba2 = new Uint8Array([100, 100, 100, 255]);
    const r1 = rgbaToNCHW(rgba1, 1, 1);
    const r2 = rgbaToNCHW(rgba2, 1, 1);
    expect(r1).toEqual(r2);
  });
});
