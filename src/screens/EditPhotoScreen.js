import React, { useState, useRef } from 'react';
import { View, Image, PanResponder, TouchableOpacity, Text } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { styles } from '../styles';
import { savePhoto } from '../utils';

export default function EditPhotoScreen({ route, navigation }) {
  const { photoUri } = route.params;
  const [crop, setCrop] = useState(null);
  const startRef = useRef(null);

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
      const result = await manipulateAsync(
        photoUri,
        [
          {
            crop: {
              originX: crop.x,
              originY: crop.y,
              width: crop.width,
              height: crop.height,
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
    <View style={styles.cropContainer}>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
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
    </View>
  );
}
