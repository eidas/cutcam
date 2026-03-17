import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useImageStore } from '../services/ImageStore';
import { ModelManager } from '../services/ModelManager';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [modelReady, setModelReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const resetStore = useImageStore((s) => s.reset);

  useEffect(() => {
    setModelReady(ModelManager.isModelCached());
  }, []);

  const handleDownloadModel = async () => {
    setDownloading(true);
    try {
      await ModelManager.ensureModel((p) => setProgress(p));
      setModelReady(true);
    } catch {
      // Error handled by ModelManager
    } finally {
      setDownloading(false);
    }
  };

  const handleStartClipper = () => {
    resetStore();
    navigation.navigate('Clipper');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CutCam</Text>
      <Text style={styles.subtitle}>
        Background removal & camera compositing
      </Text>

      {!modelReady && !downloading && (
        <TouchableOpacity style={styles.button} onPress={handleDownloadModel}>
          <Text style={styles.buttonText}>Download AI Model (~80MB)</Text>
        </TouchableOpacity>
      )}

      {downloading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.progressText}>
            Downloading model... {Math.round(progress * 100)}%
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}

      {modelReady && (
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleStartClipper}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    marginBottom: 48,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: '#e94560',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    color: '#a0a0b0',
    fontSize: 14,
  },
  progressBar: {
    width: 240,
    height: 6,
    backgroundColor: '#0f3460',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 3,
  },
});
