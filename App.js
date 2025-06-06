import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, FlatList, Linking, Share } from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Camera, BarCodeScanner } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();
const HISTORY_KEY = 'scan_history';

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Result' }} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, [])
  );

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    const entry = { id: Date.now().toString(), data, timestamp: Date.now() };
    await saveHistory(entry);
    navigation.navigate('Result', { entry });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        type={cameraType}
        flashMode={flash}
        style={StyleSheet.absoluteFillObject}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
      />
      <View style={styles.controls}>
        <Button
          title={flash === Camera.Constants.FlashMode.torch ? 'Flash Off' : 'Flash On'}
          onPress={() =>
            setFlash(
              flash === Camera.Constants.FlashMode.torch
                ? Camera.Constants.FlashMode.off
                : Camera.Constants.FlashMode.torch
            )
          }
        />
        <Button
          title="Switch Camera"
          onPress={() =>
            setCameraType(
              cameraType === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            )
          }
        />
        <Button title="History" onPress={() => navigation.navigate('History')} />
      </View>
      <StatusBar style="light" />
    </View>
  );
}

function ResultScreen({ route, navigation }) {
  const { entry } = route.params;
  const isUrl = isValidUrl(entry.data);

  const copy = async () => {
    await Clipboard.setStringAsync(entry.data);
  };

  const shareData = () => {
    Share.share({ message: entry.data });
  };

  return (
    <View style={styles.centered}>
      <Text selectable style={styles.resultText}>{entry.data}</Text>
      {isUrl && <Button title="Open in browser" onPress={() => Linking.openURL(entry.data)} />}
      <Button title="Copy" onPress={copy} />
      <Button title="Share" onPress={shareData} />
      <Button title="Scan Again" onPress={() => navigation.navigate('Scanner')} />
    </View>
  );
}

function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setHistory(await loadHistory());
      })();
    }, [])
  );

  const clearHistory = async () => {
    await AsyncStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('Result', { entry: item })}>
      <View style={styles.historyItem}>
        <Text style={styles.itemText}>{snippet(item.data)}</Text>
        <Text style={styles.itemDate}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
      <Button title="Clear History" onPress={clearHistory} />
    </View>
  );
}

function snippet(text) {
  return text.length > 30 ? text.slice(0, 30) + '...' : text;
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function saveHistory(entry) {
  const list = await loadHistory();
  list.unshift(entry);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

async function loadHistory() {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  historyItem: {
    paddingVertical: 8,
  },
  itemText: {
    color: '#fff',
    fontSize: 14,
  },
  itemDate: {
    color: '#888',
    fontSize: 12,
  },
});
