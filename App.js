import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, FlatList, Linking, Share, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Camera, BarCodeScanner } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();
const HISTORY_KEY = 'scan_history';

const colors = {
  primary: '#1E2A38',
  accent: '#00BFA6',
  background: '#F7F8FA',
  overlay: '#00000088',
  text: '#2B2B2B',
  gray: '#757575',
};

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
  const frameAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    Animated.loop(
      Animated.sequence([
        Animated.timing(frameAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(frameAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
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
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View
          style={[
            styles.frame,
            { opacity: frameAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] }) },
          ]}
        />
      </View>
      <View style={styles.controls}>
        <ControlButton
          icon={flash === Camera.Constants.FlashMode.torch ? 'flash-off' : 'flash-on'}
          onPress={() =>
            setFlash(
              flash === Camera.Constants.FlashMode.torch
                ? Camera.Constants.FlashMode.off
                : Camera.Constants.FlashMode.torch
            )
          }
        />
        <ControlButton
          icon="switch-camera"
          onPress={() =>
            setCameraType(
              cameraType === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            )
          }
        />
        <ControlButton icon="history" onPress={() => navigation.navigate('History')} />
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
    <View style={styles.resultContainer}>
      <Text selectable style={styles.resultText}>{entry.data}</Text>
      {isUrl && (
        <TouchableOpacity style={styles.primaryBtn} onPress={() => Linking.openURL(entry.data)}>
          <Text style={styles.primaryBtnText}>Відкрити</Text>
        </TouchableOpacity>
      )}
      {!isUrl && (
        <TouchableOpacity style={styles.primaryBtn} onPress={shareData}>
          <Text style={styles.primaryBtnText}>Поділитися</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondaryBtn} onPress={copy}>
        <Text style={styles.secondaryBtnText}>Копіювати</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Scanner')}>
        <Text style={styles.link}>Сканувати знову</Text>
      </TouchableOpacity>
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
    <View style={styles.historyContainer}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
      <TouchableOpacity style={styles.secondaryBtn} onPress={clearHistory}>
        <Text style={styles.secondaryBtnText}>Очистити</Text>
      </TouchableOpacity>
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

const ControlButton = ({ icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.controlBtn}>
    <MaterialIcons name={icon} size={28} color="#fff" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  historyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlBtn: {
    backgroundColor: '#00000044',
    padding: 12,
    borderRadius: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
    width: '80%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
    width: '80%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 16,
  },
  link: {
    color: colors.accent,
    fontSize: 16,
    marginTop: 12,
    textDecorationLine: 'underline',
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemText: {
    color: colors.text,
    fontSize: 14,
  },
  itemDate: {
    color: colors.gray,
    fontSize: 12,
  },
});
