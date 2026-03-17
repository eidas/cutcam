/**
 * Post-processing for ISNet model output.
 *
 * The model outputs an alpha matte at MODEL_INPUT_SIZE x MODEL_INPUT_SIZE.
 * We resize it back to the original image dimensions and apply it as the alpha channel.
 */

import { MODEL_INPUT_SIZE } from './preprocess';

/**
 * Extract alpha matte from model output tensor and resize to original dimensions.
 *
 * @param outputData - Raw model output (Float32Array)
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @returns Uint8Array alpha channel at original resolution
 */
export function extractAlphaMatte(
  outputData: Float32Array,
  originalWidth: number,
  originalHeight: number,
): Uint8Array {
  const matteSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;

  // Normalize output to [0, 255] range
  // The model output might need sigmoid or may already be in [0, 1]
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < matteSize; i++) {
    const v = outputData[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const range = max - min || 1;
  const normalizedMatte = new Uint8Array(matteSize);
  for (let i = 0; i < matteSize; i++) {
    normalizedMatte[i] = Math.round(((outputData[i] - min) / range) * 255);
  }

  // Resize matte to original dimensions using nearest-neighbor
  const alpha = new Uint8Array(originalWidth * originalHeight);
  const scaleX = MODEL_INPUT_SIZE / originalWidth;
  const scaleY = MODEL_INPUT_SIZE / originalHeight;

  for (let y = 0; y < originalHeight; y++) {
    const srcY = Math.min(Math.floor(y * scaleY), MODEL_INPUT_SIZE - 1);
    for (let x = 0; x < originalWidth; x++) {
      const srcX = Math.min(Math.floor(x * scaleX), MODEL_INPUT_SIZE - 1);
      alpha[y * originalWidth + x] = normalizedMatte[srcY * MODEL_INPUT_SIZE + srcX];
    }
  }

  return alpha;
}

/**
 * Apply alpha matte to RGBA pixel buffer.
 *
 * @param rgbaBuffer - Original RGBA pixels (modified in place)
 * @param alpha - Alpha channel values
 * @param width - Image width
 * @param height - Image height
 */
export function applyAlphaToRGBA(
  rgbaBuffer: Uint8Array,
  alpha: Uint8Array,
  width: number,
  height: number,
): void {
  const pixelCount = width * height;
  for (let i = 0; i < pixelCount; i++) {
    rgbaBuffer[i * 4 + 3] = alpha[i];
  }
}
