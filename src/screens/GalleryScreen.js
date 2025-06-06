import React, { useState, useCallback } from 'react';
import { View, FlatList, Image, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { styles } from '../styles';
import { loadGallery, deletePhoto } from '../utils';

export default function GalleryScreen() {
  const [photos, setPhotos] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setPhotos(await loadGallery());
      })();
    }, [])
  );

  const remove = async (uri) => {
    await deletePhoto(uri);
    setPhotos(await loadGallery());
  };

  const renderItem = ({ item }) => (
    <View style={styles.galleryItem}>
      <Image source={{ uri: item }} style={styles.galleryImage} />
      <TouchableOpacity style={styles.deleteBtn} onPress={() => remove(item)}>
        <MaterialIcons name="delete" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.galleryContainer}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.message}>Галерея порожня</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
