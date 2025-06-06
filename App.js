// App.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Linking,
  Button,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  NavigationContainer,
  useFocusEffect,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Імпорт із останньої версії expo-camera (SDK 52+)
import {
  CameraView,
  CameraType,
  FlashMode,
  BarcodeType,
  useCameraPermissions,
} from 'expo-camera';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();
const HISTORY_KEY = 'scan_history';

const colors = {
  primary: '#1E2A38',
  accent: '#00BFA6',
  background: '#F7F8FA',
  text: '#2B2B2B',
  gray: '#757575',
};

export default function App() {
  return (
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
        </Stack.Navigator>
      </NavigationContainer>
  );
}

/* -----------------------------------------------------------
   ScannerScreen
   — виправлена послідовність викликів хуків
----------------------------------------------------------- */
function ScannerScreen({ navigation }) {
  // 1. Викликаємо всі хуки одразу при вході в компонент
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  // Ініціалізуємо Animated.Value для пульсації рамки
  const frameAnim = React.useRef(new Animated.Value(0)).current;

  // Хук, що скидає scanned у false, коли скриншот знову у фокусі
  useFocusEffect(
      useCallback(() => {
        setScanned(false);
      }, [])
  );

  // Анімація пульсації рамки
  useEffect(() => {
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
  }, [frameAnim]);

  // Тепер — умовні рендери, але вже після того, як усі хуки викликалися

  // Якщо permission ще не завантажено (null) — повертаємо порожній View
  if (!permission) {
    return <View />;
  }
  // Якщо не дали дозвіл — питаємо ще раз
  if (!permission.granted) {
    return (
        <View style={styles.centered}>
          <Text style={styles.message}>
            Ми потребуємо ваш дозвіл, щоб показати камеру
          </Text>
          <Button onPress={requestPermission} title="Надати дозвіл" />
        </View>
    );
  }

  // Обробник успішного сканування QR
  const onBarcodeScanned = async ({ data, type }) => {
    setScanned(true);
    const entry = {
      id: Date.now().toString(),
      data,
      type,
      timestamp: Date.now(),
    };
    await saveHistory(entry);
    navigation.navigate('Result', { entry });
  };

  // Перемикач камери
  const toggleCamera = () => {
    setFacing((prev) =>
        prev === 'back' ? 'front' : 'back'
    );
  };
  // Перемикач спалаху
  const toggleFlash = () => {
    setFlash((prev) =>
        prev === 'torch' ? 'off' : 'torch'
    );
  };

  // Якщо дозвіл є — рендеримо повноекранний CameraView
  return (
      <View style={styles.container}>
        <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            flash={flash}
            onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
        >
          {/* Накладаємо кнопки зверху */}
          <View style={styles.overlayControls}>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleFlash}>
              <MaterialIcons
                  name={flash === 'torch' ? 'flash-off' : 'flash-on'}
                  size={28}
                  color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleCamera}>
              <MaterialIcons name="switch-camera" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('History')}
            >
              <MaterialIcons name="history" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </CameraView>

        {/* Пульсуюча рамка-накладка */}
        <View style={styles.overlay} pointerEvents="none">
          <Animated.View
              style={[
                styles.frame,
                {
                  opacity: frameAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.5],
                  }),
                },
              ]}
          />
        </View>

        <StatusBar style="light" />
      </View>
  );
}

/* -----------------------------------------------------------
   ResultScreen
----------------------------------------------------------- */
function ResultScreen({ route, navigation }) {
  const { entry } = route.params;
  const isUrl = isValidUrl(entry.data);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(entry.data);
    Alert.alert('Скопійовано', 'Текст скопійовано в буфер обміну');
  };

  const openLink = () => {
    Linking.openURL(entry.data).catch(() =>
        Alert.alert('Помилка', 'Не вдалося відкрити URL')
    );
  };

  const shareData = () => {
    Share.share({ message: entry.data });
  };

  return (
      <View style={styles.resultContainer}>
        <Text selectable style={styles.resultText}>
          {entry.data}
        </Text>

        {isUrl ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={openLink}>
              <Text style={styles.primaryBtnText}>Відкрити</Text>
            </TouchableOpacity>
        ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={shareData}>
              <Text style={styles.primaryBtnText}>Поділитися</Text>
            </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={copyToClipboard}>
          <Text style={styles.secondaryBtnText}>Копіювати</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Scanner')}>
          <Text style={styles.link}>Сканувати знову</Text>
        </TouchableOpacity>
      </View>
  );
}

/* -----------------------------------------------------------
   HistoryScreen
----------------------------------------------------------- */
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
          <Text style={styles.itemDate}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
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
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.message}>Історія порожня</Text>
              </View>
            }
        />
        {history.length > 0 && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={clearHistory}>
              <Text style={styles.secondaryBtnText}>Очистити історію</Text>
            </TouchableOpacity>
        )}
      </View>
  );
}

/* -----------------------------------------------------------
   УТИЛІТИ
----------------------------------------------------------- */
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

/* -----------------------------------------------------------
   СТИЛІ
----------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
  },
  message: {
    textAlign: 'center',
    marginBottom: 12,
    color: colors.text,
  },
  camera: {
    flex: 1,
  },
  overlayControls: {
    position: 'absolute',
    top: 48,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
  },
  iconBtn: {
    backgroundColor: '#00000044',
    padding: 8,
    borderRadius: 24,
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
  resultContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 16,
  },
  link: {
    color: colors.accent,
    fontSize: 16,
    textDecorationLine: 'underline',
    marginTop: 16,
  },
  historyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  historyItem: {
    paddingVertical: 12,
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
    marginTop: 4,
  },
});
