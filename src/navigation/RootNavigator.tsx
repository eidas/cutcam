import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { ClipperScreen } from '../screens/ClipperScreen';
import { AlphaEditorScreen } from '../screens/AlphaEditorScreen';
import { CompositorScreen } from '../screens/CompositorScreen';

export type RootStackParamList = {
  Home: undefined;
  Clipper: undefined;
  AlphaEditor: { imageUri: string };
  Compositor: { imageUri: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#16213e' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'CutCam' }}
        />
        <Stack.Screen
          name="Clipper"
          component={ClipperScreen}
          options={{ title: 'Background Remover' }}
        />
        <Stack.Screen
          name="AlphaEditor"
          component={AlphaEditorScreen}
          options={{ title: 'Alpha Editor' }}
        />
        <Stack.Screen
          name="Compositor"
          component={CompositorScreen}
          options={{ title: 'Camera Compositor' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
