import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { BrushControls } from '../components/BrushControls';

type Props = NativeStackScreenProps<RootStackParamList, 'AlphaEditor'>;

export function AlphaEditorScreen({ route, navigation }: Props) {
  const { imageUri } = route.params;
  const [brushSize, setBrushSize] = useState(20);
  const [alphaValue, setAlphaValue] = useState(0);

  const goToCompositor = () => {
    // TODO: Save edited image and pass to compositor
    navigation.navigate('Compositor', { imageUri });
  };

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        {/* TODO: Replace with Skia Canvas for pixel-level alpha editing */}
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
        <Text style={styles.wip}>Skia Canvas - coming in Phase 2</Text>
      </View>

      <BrushControls
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        alphaValue={alphaValue}
        onAlphaValueChange={setAlphaValue}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={goToCompositor}>
          <Text style={styles.buttonText}>Composite →</Text>
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
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  wip: {
    position: 'absolute',
    bottom: 12,
    color: '#666',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
