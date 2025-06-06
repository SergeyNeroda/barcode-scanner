import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { styles } from '../styles';
import { snippet, loadHistory, HISTORY_KEY } from '../utils';

export default function HistoryScreen({ navigation }) {
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
