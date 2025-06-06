import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  PanResponder,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { styles } from '../styles';
import { savePhoto } from '../utils';

export default function EditPhotoScreen({ route, navigation }) {
  const { photoUri } = route.params;
  const [crop, setCrop] = useState(null);
  const startRef = useRef(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    Image.getSize(photoUri, (w, h) => setImageSize({ width: w, height: h }));
  }, [photoUri]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        startRef.current = { x: locationX, y: locationY };
        setCrop({ x: locationX, y: locationY, width: 0, height: 0 });
      },
      onPanResponderMove: (e) => {
        if (!startRef.current) return;
        const { locationX, locationY } = e.nativeEvent;
        setCrop({
          x: Math.min(startRef.current.x, locationX),
          y: Math.min(startRef.current.y, locationY),
          width: Math.abs(locationX - startRef.current.x),
          height: Math.abs(locationY - startRef.current.y),
        });
      },
      onPanResponderRelease: () => {
        startRef.current = null;
      },
    })
  ).current;

  const cropAndSave = async () => {
    let uri = photoUri;
    if (crop && crop.width > 0 && crop.height > 0) {
      const widthScale = imageSize.width / layout.width;
      const heightScale = imageSize.height / layout.height;
      const result = await manipulateAsync(
        photoUri,
        [
          {
            crop: {
              originX: crop.x * widthScale,
              originY: crop.y * heightScale,
              width: crop.width * widthScale,
              height: crop.height * heightScale,
            },
          },
        ],
        { compress: 1, format: SaveFormat.JPEG }
      );
      uri = result.uri;
    }
    await savePhoto(uri);
    navigation.navigate('Gallery');
  };

  return (
    <SafeAreaView style={styles.cropContainer}>
      <View
        style={{ flex: 1 }}
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        <Image source={{ uri: photoUri }} style={styles.cropImage} resizeMode="contain" />
        {crop && (
          <View
            style={[
              styles.cropFrame,
              { left: crop.x, top: crop.y, width: crop.width, height: crop.height },
            ]}
          />
        )}
      </View>
      <View style={styles.cropActions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={cropAndSave}>
          <Text style={styles.primaryBtnText}>Обрізати та зберегти</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Скасувати</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
