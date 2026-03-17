import { create } from 'zustand';

interface ImageState {
  sourceImageUri: string | null;
  clippedImageUri: string | null;
  editedImageUri: string | null;

  setSourceImage: (uri: string) => void;
  setClippedImage: (uri: string) => void;
  setEditedImage: (uri: string) => void;
  reset: () => void;
}

export const useImageStore = create<ImageState>((set) => ({
  sourceImageUri: null,
  clippedImageUri: null,
  editedImageUri: null,

  setSourceImage: (uri) => set({ sourceImageUri: uri }),
  setClippedImage: (uri) => set({ clippedImageUri: uri }),
  setEditedImage: (uri) => set({ editedImageUri: uri }),
  reset: () => set({ sourceImageUri: null, clippedImageUri: null, editedImageUri: null }),
}));
