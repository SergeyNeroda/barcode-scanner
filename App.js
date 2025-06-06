import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, FlatList, Linking } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    const entry = { id: Date.now().toString(), type, data };
    setHistory((current) => [entry, ...current]);
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

  const last = history[0];

  return (
    <View style={styles.container}>
      {!scanned && (
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {scanned && (
        <View style={styles.overlay}>
          <Text style={styles.text}>Last Scan: {last?.data}</Text>
          <Button title="Scan Again" onPress={() => setScanned(false)} />
          {last && isValidUrl(last.data) && (
            <Button title="Open Link" onPress={() => Linking.openURL(last.data)} />
          )}
          <Text style={styles.text}>Total scans: {history.length}</Text>
        </View>
      )}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.listItem}>{item.data}</Text>
        )}
        style={styles.list}
      />
      <StatusBar style="auto" />
    </View>
  );
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  listItem: {
    color: '#fff',
    padding: 4,
    textAlign: 'center',
  },
});

