import { useImageStore } from '../../services/ImageStore';

describe('ImageStore', () => {
  beforeEach(() => {
    useImageStore.getState().reset();
  });

  it('starts with null values', () => {
    const state = useImageStore.getState();
    expect(state.sourceImageUri).toBeNull();
    expect(state.clippedImageUri).toBeNull();
    expect(state.editedImageUri).toBeNull();
  });

  it('sets source image', () => {
    useImageStore.getState().setSourceImage('file://source.png');
    expect(useImageStore.getState().sourceImageUri).toBe('file://source.png');
  });

  it('sets clipped image', () => {
    useImageStore.getState().setClippedImage('file://clipped.png');
    expect(useImageStore.getState().clippedImageUri).toBe('file://clipped.png');
  });

  it('sets edited image', () => {
    useImageStore.getState().setEditedImage('file://edited.png');
    expect(useImageStore.getState().editedImageUri).toBe('file://edited.png');
  });

  it('resets all values', () => {
    const store = useImageStore.getState();
    store.setSourceImage('a');
    store.setClippedImage('b');
    store.setEditedImage('c');
    useImageStore.getState().reset();

    const state = useImageStore.getState();
    expect(state.sourceImageUri).toBeNull();
    expect(state.clippedImageUri).toBeNull();
    expect(state.editedImageUri).toBeNull();
  });
});
