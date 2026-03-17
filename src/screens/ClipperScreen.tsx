import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { BackgroundRemover } from '../services/onnx/BackgroundRemover';
import { useImageStore } from '../services/ImageStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Clipper'>;

export function ClipperScreen({ navigation }: Props) {
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const setClippedImage = useImageStore((s) => s.setClippedImage);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setSourceUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

  const removeBackground = async () => {
    if (!sourceUri) return;
    setProcessing(true);
    try {
      const outputUri = await BackgroundRemover.removeBackground(sourceUri);
      setResultUri(outputUri);
      setClippedImage(outputUri);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Error', `Background removal failed: ${message}`);
    } finally {
      setProcessing(false);
    }
  };

  const goToEditor = () => {
    if (resultUri) {
      navigation.navigate('AlphaEditor', { imageUri: resultUri });
    }
  };

  const displayUri = showOriginal ? sourceUri : (resultUri ?? sourceUri);

  return (
    <View style={styles.container}>
      {displayUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: displayUri }} style={styles.preview} resizeMode="contain" />
          {resultUri && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowOriginal(!showOriginal)}
            >
              <Text style={styles.toggleText}>
                {showOriginal ? 'Show Result' : 'Show Original'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select an image to start</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Pick Image</Text>
        </TouchableOpacity>

        {sourceUri && !resultUri && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={removeBackground}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Remove Background</Text>
            )}
          </TouchableOpacity>
        )}

        {resultUri && (
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={goToEditor}>
            <Text style={styles.buttonText}>Edit Alpha →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#a0a0b0',
    fontSize: 18,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#e94560',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
