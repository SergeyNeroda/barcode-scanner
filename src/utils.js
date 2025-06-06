import AsyncStorage from '@react-native-async-storage/async-storage';

export const HISTORY_KEY = 'scan_history';
export const GALLERY_KEY = 'photo_gallery';

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

export async function savePhoto(uri) {
  const list = await loadGallery();
  list.unshift(uri);
  await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(list));
}

export async function loadGallery() {
  const data = await AsyncStorage.getItem(GALLERY_KEY);
  return data ? JSON.parse(data) : [];
}

export async function deletePhoto(uri) {
  const list = await loadGallery();
  const filtered = list.filter((item) => item !== uri);
  await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(filtered));
}
