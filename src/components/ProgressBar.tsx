import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.percentage}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  label: {
    color: '#a0a0b0',
    fontSize: 13,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#0f3460',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 3,
  },
  percentage: {
    color: '#a0a0b0',
    fontSize: 13,
    width: 40,
    textAlign: 'right',
  },
});
