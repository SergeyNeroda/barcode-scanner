import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#1E2A38',
  accent: '#00BFA6',
  background: '#F7F8FA',
  text: '#2B2B2B',
  gray: '#757575',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
  },
  message: {
    textAlign: 'center',
    marginBottom: 12,
    color: colors.text,
  },
  camera: {
    flex: 1,
  },
  overlayControls: {
    position: 'absolute',
    top: 48,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
  },
  iconBtn: {
    backgroundColor: '#00000044',
    padding: 8,
    borderRadius: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 8,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 16,
  },
  link: {
    color: colors.accent,
    fontSize: 16,
    textDecorationLine: 'underline',
    marginTop: 16,
  },
  historyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemText: {
    color: colors.text,
    fontSize: 14,
  },
  itemDate: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 4,
  },
});
