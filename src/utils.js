import AsyncStorage from '@react-native-async-storage/async-storage';

export const HISTORY_KEY = 'scan_history';

export function snippet(text) {
  return text.length > 30 ? text.slice(0, 30) + '...' : text;
}

export function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export async function saveHistory(entry) {
  const list = await loadHistory();
  list.unshift(entry);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export async function loadHistory() {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}
