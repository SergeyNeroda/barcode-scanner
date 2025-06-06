import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  Animated,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

import { styles } from '../styles';
import { saveHistory } from '../utils';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const cameraRef = React.useRef(null);
  const frameAnim = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, [])
  );

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

  if (!permission) {
    return <View />;
  }

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

  const toggleCamera = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'torch' ? 'off' : 'torch'));
  };

  const openGallery = () => {
    navigation.navigate('Gallery');
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    navigation.navigate('EditPhoto', { photoUri: photo.uri });
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flash}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
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
          <TouchableOpacity style={styles.iconBtn} onPress={openGallery}>
            <MaterialIcons name="photo-library" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={takePhoto}>
            <MaterialIcons name="photo-camera" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>

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
