import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
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
  const [zoom, setZoom] = useState(0);
  const zoomRef = useRef(0);
  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const [focusPoint, setFocusPoint] = useState({ x: 0.5, y: 0.5 });

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

  const handlePinch = (e) => {
    if (e.nativeEvent.state === State.ACTIVE) {
      let newZoom = zoomRef.current + (e.nativeEvent.scale - 1) / 5;
      newZoom = Math.max(0, Math.min(newZoom, 1));
      setZoom(newZoom);
    } else if (e.nativeEvent.state === State.END) {
      zoomRef.current = zoom;
    }
  };

  const handleFocus = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    setFocusPoint({
      x: locationX / layout.width,
      y: locationY / layout.height,
    });
  };

  return (
    <SafeAreaView
      style={styles.container}
      onLayout={(e) => setLayout(e.nativeEvent.layout)}
    >
      <PinchGestureHandler
        onGestureEvent={handlePinch}
        onHandlerStateChange={handlePinch}
      >
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            flash={flash}
            zoom={zoom}
            autoFocusPointOfInterest={focusPoint}
            onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <TouchableWithoutFeedback onPress={handleFocus}>
              <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>

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
        </View>
      </PinchGestureHandler>

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

      <View style={styles.zoomSliderContainer} pointerEvents="box-none">
        <Slider
          minimumValue={0}
          maximumValue={1}
          value={zoom}
          onValueChange={(v) => {
            zoomRef.current = v;
            setZoom(v);
          }}
        />
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}
