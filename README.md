# Barcode Scanner Expo App

This React Native application demonstrates QR code scanning using Expo. It keeps
track of all scanned codes and allows you to open URLs directly if the scanned
data is a valid link.

The UI follows a minimalistic dark-blue and turquoise color scheme. Camera
controls now use material icons and a pulsing frame highlights the scanning
area. History and result screens share a light background for better
readability.

The scanner is implemented with **expo-camera**, which supersedes the deprecated
`expo-barcode-scanner` package.

## Development

1. Install dependencies with `npm install`.
2. Start the development server:

   ```bash
   npm start
   ```

3. Use the Expo Go app or an emulator to run the application.

