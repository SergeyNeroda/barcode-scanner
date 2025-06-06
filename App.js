import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ScannerScreen from './src/screens/ScannerScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import EditPhotoScreen from './src/screens/EditPhotoScreen';
import GalleryScreen from './src/screens/GalleryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ title: 'Результат' }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: 'Історія' }}
          />
          <Stack.Screen
            name="EditPhoto"
            component={EditPhotoScreen}
            options={{ title: 'Редагування' }}
          />
          <Stack.Screen
            name="Gallery"
            component={GalleryScreen}
            options={{ title: 'Галерея' }}
          />
        </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
