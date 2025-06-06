import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { styles } from '../styles';
import { isValidUrl } from '../utils';

export default function ResultScreen({ route, navigation }) {
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
