import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Compositor'>;

export function CompositorScreen({ route, navigation }: Props) {
  const { imageUri } = route.params;
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');

  const toggleCamera = () => {
    setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const capture = () => {
    // TODO: Implement Skia canvas capture + camera frame compositing
    Alert.alert('Capture', 'Camera compositing will be implemented in Phase 3');
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        {/* TODO: Replace with VisionCamera + Skia overlay */}
        <Text style={styles.cameraPlaceholder}>Camera Preview ({cameraFacing})</Text>
        <Image
          source={{ uri: imageUri }}
          style={styles.overlay}
          resizeMode="contain"
        />
        <Text style={styles.wip}>VisionCamera + Skia - coming in Phase 3</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleCamera}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.captureButton]} onPress={capture}>
          <Text style={styles.buttonText}>Capture</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cameraPlaceholder: {
    color: '#444',
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  wip: {
    position: 'absolute',
    bottom: 12,
    color: '#666',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  button: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  captureButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
