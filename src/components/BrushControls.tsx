import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface BrushControlsProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  alphaValue: number;
  onAlphaValueChange: (value: number) => void;
}

const BRUSH_SIZES = [10, 20, 40, 60];
const ALPHA_PRESETS = [
  { label: 'Erase', value: 0 },
  { label: 'Half', value: 128 },
  { label: 'Restore', value: 255 },
];

export function BrushControls({
  brushSize,
  onBrushSizeChange,
  alphaValue,
  onAlphaValueChange,
}: BrushControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Brush Size</Text>
        <View style={styles.row}>
          {BRUSH_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.chip, brushSize === size && styles.chipActive]}
              onPress={() => onBrushSizeChange(size)}
            >
              <Text style={[styles.chipText, brushSize === size && styles.chipTextActive]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Alpha</Text>
        <View style={styles.row}>
          {ALPHA_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={[styles.chip, alphaValue === preset.value && styles.chipActive]}
              onPress={() => onAlphaValueChange(preset.value)}
            >
              <Text style={[styles.chipText, alphaValue === preset.value && styles.chipTextActive]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 8,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: '#a0a0b0',
    fontSize: 13,
    width: 70,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chipActive: {
    backgroundColor: '#e94560',
  },
  chipText: {
    color: '#a0a0b0',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
});
