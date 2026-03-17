/**
 * Tensor utility functions for ONNX Runtime data manipulation.
 */

/**
 * Apply sigmoid activation to tensor data in-place.
 * Converts logits to probabilities [0, 1].
 */
export function sigmoid(data: Float32Array): void {
  for (let i = 0; i < data.length; i++) {
    data[i] = 1 / (1 + Math.exp(-data[i]));
  }
}

/**
 * Clamp values to [min, max] range in-place.
 */
export function clamp(data: Float32Array, min: number, max: number): void {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.max(min, Math.min(max, data[i]));
  }
}
