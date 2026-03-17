import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Platform } from 'react-native';
import { ModelManager } from '../ModelManager';
import { rgbaToNCHW, getInputDims } from './preprocess';
import { extractAlphaMatte, applyAlphaToRGBA } from './postprocess';

let session: InferenceSession | null = null;

export class BackgroundRemover {
  /**
   * Initialize the ONNX inference session.
   * Automatically selects the best execution provider for the platform.
   */
  static async initialize(): Promise<void> {
    if (session) return;

    const modelPath = await ModelManager.ensureModel();

    const executionProviders: string[] = [];
    if (Platform.OS === 'ios') {
      executionProviders.push('coreml');
    } else if (Platform.OS === 'android') {
      executionProviders.push('nnapi');
    }
    executionProviders.push('xnnpack', 'cpu');

    session = await InferenceSession.create(modelPath, {
      executionProviders,
    });
  }

  /**
   * Remove the background from an image.
   *
   * @param imageUri - URI of the source image
   * @returns URI of the output RGBA PNG with background removed
   */
  static async removeBackground(imageUri: string): Promise<string> {
    await this.initialize();
    if (!session) throw new Error('ONNX session not initialized');

    // TODO: In production, use react-native-skia or expo-image-manipulator
    // to decode the image URI into raw RGBA pixels.
    // For now, this is the pipeline structure:

    // 1. Decode image from URI to RGBA pixel buffer
    const { rgbaBuffer, width, height } = await this.decodeImage(imageUri);

    // 2. Preprocess: resize + normalize + NCHW
    const inputData = rgbaToNCHW(rgbaBuffer, width, height);
    const dims = getInputDims();
    const inputTensor = new Tensor('float32', inputData, dims);

    // 3. Run inference
    const startTime = Date.now();
    const results = await session.run({ input: inputTensor });
    const inferenceTime = Date.now() - startTime;
    console.log(`Inference completed in ${inferenceTime}ms`);

    // 4. Postprocess: extract alpha matte and apply to original image
    const outputKey = Object.keys(results)[0];
    const outputTensor = results[outputKey];
    const outputData = outputTensor.data as Float32Array;

    const alphaMatte = extractAlphaMatte(outputData, width, height);
    applyAlphaToRGBA(rgbaBuffer, alphaMatte, width, height);

    // 5. Encode back to PNG and return URI
    return this.encodeImage(rgbaBuffer, width, height);
  }

  /**
   * Decode image URI to raw RGBA pixel buffer.
   * TODO: Implement with Skia's MakeImageFromEncoded + readPixels
   */
  private static async decodeImage(
    _imageUri: string,
  ): Promise<{ rgbaBuffer: Uint8Array; width: number; height: number }> {
    // Placeholder - will be implemented with Skia in Phase 1
    // For now, throw to indicate this needs native image decoding
    throw new Error(
      'Image decoding not yet implemented. ' +
      'Requires @shopify/react-native-skia for raw pixel access.',
    );
  }

  /**
   * Encode RGBA pixel buffer back to PNG and save to filesystem.
   * TODO: Implement with Skia's MakeImage + encodeToBase64
   */
  private static async encodeImage(
    _rgbaBuffer: Uint8Array,
    _width: number,
    _height: number,
  ): Promise<string> {
    // Placeholder - will be implemented with Skia in Phase 1
    throw new Error(
      'Image encoding not yet implemented. ' +
      'Requires @shopify/react-native-skia for PNG encoding.',
    );
  }

  /**
   * Release the ONNX session to free memory.
   */
  static async dispose(): Promise<void> {
    if (session) {
      session = null;
    }
  }
}
