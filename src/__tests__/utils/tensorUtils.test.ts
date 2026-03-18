import { sigmoid, clamp } from '../../utils/tensorUtils';

describe('sigmoid', () => {
  it('converts 0 to 0.5', () => {
    const data = new Float32Array([0]);
    sigmoid(data);
    expect(data[0]).toBeCloseTo(0.5);
  });

  it('converts large positive values close to 1', () => {
    const data = new Float32Array([10]);
    sigmoid(data);
    expect(data[0]).toBeCloseTo(1, 4);
  });

  it('converts large negative values close to 0', () => {
    const data = new Float32Array([-10]);
    sigmoid(data);
    expect(data[0]).toBeCloseTo(0, 4);
  });

  it('processes multiple values in-place', () => {
    const data = new Float32Array([-1, 0, 1]);
    sigmoid(data);
    expect(data[0]).toBeCloseTo(0.2689, 3);
    expect(data[1]).toBeCloseTo(0.5);
    expect(data[2]).toBeCloseTo(0.7311, 3);
  });

  it('handles empty array', () => {
    const data = new Float32Array([]);
    sigmoid(data);
    expect(data.length).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps values below min', () => {
    const data = new Float32Array([-5, -1]);
    clamp(data, 0, 1);
    expect(data[0]).toBe(0);
    expect(data[1]).toBe(0);
  });

  it('clamps values above max', () => {
    const data = new Float32Array([2, 10]);
    clamp(data, 0, 1);
    expect(data[0]).toBe(1);
    expect(data[1]).toBe(1);
  });

  it('keeps values within range unchanged', () => {
    const data = new Float32Array([0.3, 0.7]);
    clamp(data, 0, 1);
    expect(data[0]).toBeCloseTo(0.3);
    expect(data[1]).toBeCloseTo(0.7);
  });

  it('handles empty array', () => {
    const data = new Float32Array([]);
    clamp(data, 0, 1);
    expect(data.length).toBe(0);
  });
});
