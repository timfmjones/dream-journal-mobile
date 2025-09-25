#!/bin/bash

echo "🚀 DreamSprout iOS Fix Script"
echo "=============================="

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p assets/animations
mkdir -p assets/fonts
mkdir -p assets/images

# Create placeholder animation files
echo "📝 Creating placeholder animation files..."
echo '{"v":"5.5.7","meta":{"g":"LottieFiles AE 0.1.20"},"fr":30,"ip":0,"op":60,"w":200,"h":200,"nm":"Empty","ddd":0,"assets":[],"layers":[]}' > assets/animations/auth-animation.json
echo '{"v":"5.5.7","meta":{"g":"LottieFiles AE 0.1.20"},"fr":30,"ip":0,"op":60,"w":200,"h":200,"nm":"Empty","ddd":0,"assets":[],"layers":[]}' > assets/animations/empty-dreams.json
echo '{"v":"5.5.7","meta":{"g":"LottieFiles AE 0.1.20"},"fr":30,"ip":0,"op":60,"w":200,"h":200,"nm":"Empty","ddd":0,"assets":[],"layers":[]}' > assets/animations/empty-journal.json

# Move components to correct locations
echo "🔧 Reorganizing components..."
if [ -f "src/components/AnalysisScreen.tsx" ]; then
    mv src/components/AnalysisScreen.tsx src/screens/AnalysisScreen.tsx 2>/dev/null
fi

if [ -f "src/components/StoryGenerationScreen.tsx" ]; then
    mv src/components/StoryGenerationScreen.tsx src/screens/StoryGenerationScreen.tsx 2>/dev/null
fi

if [ -f "src/components/BiometricLockScreen.tsx" ]; then
    mv src/components/BiometricLockScreen.tsx src/screens/BiometricLockScreen.tsx 2>/dev/null
fi

# Create missing DreamListItem component
echo "✨ Creating DreamListItem component..."
cat > src/components/DreamListItem.tsx << 'EOF'
import React from 'react';
import DreamCard from './DreamCard';
import { Dream } from '../services/api';

interface DreamListItemProps {
  dream: Dream;
  onPress: () => void;
}

export default function DreamListItem({ dream, onPress }: DreamListItemProps) {
  return <DreamCard dream={dream} onPress={onPress} />;
}
EOF

# Create .env.example
echo "📋 Creating .env.example..."
cat > .env.example << 'EOF'
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EOF

# Create placeholder images
echo "🖼️ Creating placeholder images..."
# Create a simple PNG placeholder (1x1 transparent pixel)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\xdac\xf8\x0f\x00\x00\x01\x01\x00\x05\x00\x00\x00\x00IEND\xae\x42\x60\x82' > assets/icon.png
cp assets/icon.png assets/splash.png
cp assets/icon.png assets/adaptive-icon.png
cp assets/icon.png assets/favicon.png
cp assets/icon.png assets/notification-icon.png

# Download fonts
echo "📚 Downloading fonts..."
mkdir -p temp_fonts
cd temp_fonts

# Download Inter fonts
curl -L "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip" -o inter.zip
unzip -q inter.zip
cp "Inter Desktop/Inter-Regular.ttf" ../assets/fonts/ 2>/dev/null || cp "Inter-Regular.ttf" ../assets/fonts/ 2>/dev/null
cp "Inter Desktop/Inter-Medium.ttf" ../assets/fonts/ 2>/dev/null || cp "Inter-Medium.ttf" ../assets/fonts/ 2>/dev/null
cp "Inter Desktop/Inter-SemiBold.ttf" ../assets/fonts/ 2>/dev/null || cp "Inter-SemiBold.ttf" ../assets/fonts/ 2>/dev/null
cp "Inter Desktop/Inter-Bold.ttf" ../assets/fonts/ 2>/dev/null || cp "Inter-Bold.ttf" ../assets/fonts/ 2>/dev/null

# Download Playfair Display
curl -L "https://fonts.google.com/download?family=Playfair%20Display" -o playfair.zip
unzip -q playfair.zip -d playfair
cp playfair/static/PlayfairDisplay-Regular.ttf ../assets/fonts/PlayfairDisplay-Regular.ttf 2>/dev/null
cp playfair/static/PlayfairDisplay-Bold.ttf ../assets/fonts/PlayfairDisplay-Bold.ttf 2>/dev/null

cd ..
rm -rf temp_fonts

# Clean and reinstall dependencies
echo "📦 Reinstalling dependencies..."
rm -rf node_modules package-lock.json yarn.lock
npm install

# Create the patch-glog.js file (empty as it's not needed for Expo)
echo "// This file is not needed for Expo managed workflow" > scripts/patch-glog.js

echo ""
echo "✅ Fix script completed!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and fill in your Firebase credentials"
echo "2. Run 'npx expo start' to start the development server"
echo "3. Press 'i' to open in iOS Simulator"
echo ""
echo "For Xcode:"
echo "Run 'npx expo run:ios' to build for iOS"