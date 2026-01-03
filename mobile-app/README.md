# 📱 School LMS - Mobile App

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── app/                 # Expo Router screens
│   │   ├── (auth)/         # Auth screens
│   │   ├── (admin)/        # Admin module
│   │   ├── (teacher)/      # Teacher module
│   │   ├── (parent)/       # Parent module
│   │   └── (cook)/         # Cook module
│   ├── components/         # Reusable components
│   ├── services/           # API & Storage
│   ├── stores/             # Zustand stores
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   └── utils/              # Utilities
├── assets/                 # Images & fonts
└── ARCHITECTURE.md         # Full documentation
```

## 🔐 Roles

- **SUPER_ADMIN** - System owner
- **ADMIN** - School administrator
- **TEACHER** - Teachers
- **PARENT** - Parents/Guardians
- **COOK** - Kitchen staff

## 🎨 Tech Stack

- React Native (Expo)
- TypeScript
- Expo Router
- Zustand
- TanStack Query
- NativeWind
- React Native Paper

## 📡 API

Base URL: `http://localhost:3000`

See `ARCHITECTURE.md` for full API documentation.

## 🧪 Testing

```bash
npm test
```

## 📦 Build

```bash
# Android
eas build --platform android

# iOS  
eas build --platform ios
```

## 📄 License

MIT

