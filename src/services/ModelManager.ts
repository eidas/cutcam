import { File, Paths, Directory } from 'expo-file-system';

const MODEL_FILENAME = 'isnet-general-use.onnx';
const MODEL_URL = 'https://huggingface.co/nicjac/withoutbg/resolve/main/isnet-general-use.onnx';
const MAX_RETRIES = 3;

function getModelFile(): File {
  return new File(Paths.document, MODEL_FILENAME);
}

export class ModelManager {
  static isModelCached(): boolean {
    return getModelFile().exists;
  }

  static getModelPath(): string {
    return getModelFile().uri;
  }

  static async ensureModel(onProgress?: (progress: number) => void): Promise<string> {
    const file = getModelFile();
    if (file.exists) {
      onProgress?.(1);
      return file.uri;
    }

    return this.downloadWithRetry(onProgress);
  }

  private static async downloadWithRetry(
    onProgress?: (progress: number) => void,
    attempt = 0,
  ): Promise<string> {
    try {
      onProgress?.(0);
      const result = await File.downloadFileAsync(
        MODEL_URL,
        new Directory(Paths.document),
        { idempotent: true },
      );
      onProgress?.(1);
      return result.uri;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.downloadWithRetry(onProgress, attempt + 1);
      }
      throw error;
    }
  }

  static deleteModel(): void {
    const file = getModelFile();
    if (file.exists) {
      file.delete();
    }
  }
}
