/**
 * Image preprocessing for withoutBG ISNet model.
 *
 * Mirrors the Python preprocessing pipeline:
 * 1. Resize to 1024x1024 (model input size)
 * 2. Normalize RGB to [0, 1] float32
 * 3. Arrange as NCHW tensor (batch=1, channels=3, height=1024, width=1024)
 */

export const MODEL_INPUT_SIZE = 1024;

/**
 * Convert RGBA pixel buffer to normalized NCHW Float32Array for ONNX inference.
 *
 * @param rgbaBuffer - Raw RGBA pixel data (Uint8Array of length width * height * 4)
 * @param width - Image width
 * @param height - Image height
 * @returns Float32Array in NCHW format [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]
 */
export function rgbaToNCHW(
  rgbaBuffer: Uint8Array,
  width: number,
  height: number,
): Float32Array {
  const targetSize = MODEL_INPUT_SIZE;
  const channelSize = targetSize * targetSize;
  const output = new Float32Array(3 * channelSize);

  // Scale factors for nearest-neighbor resize
  const scaleX = width / targetSize;
  const scaleY = height / targetSize;

  for (let y = 0; y < targetSize; y++) {
    const srcY = Math.min(Math.floor(y * scaleY), height - 1);
    for (let x = 0; x < targetSize; x++) {
      const srcX = Math.min(Math.floor(x * scaleX), width - 1);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = y * targetSize + x;

      // Normalize to [0, 1] and arrange as CHW (R channel, G channel, B channel)
      output[dstIdx] = rgbaBuffer[srcIdx] / 255.0;                     // R
      output[channelSize + dstIdx] = rgbaBuffer[srcIdx + 1] / 255.0;   // G
      output[2 * channelSize + dstIdx] = rgbaBuffer[srcIdx + 2] / 255.0; // B
    }
  }

  return output;
}

/**
 * Get the ONNX input tensor dimensions for the model.
 */
export function getInputDims(): [number, number, number, number] {
  return [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE];
}
