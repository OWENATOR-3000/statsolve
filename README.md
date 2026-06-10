# StatSolve App

StatSolve is a mobile-first Expo app for solving and practicing statistics problems. It supports typed or photo-based questions, streams step-by-step solutions from the StatSolve API, stores solved questions locally, and includes learning, practice, history, profile, and calculator workflows.

## Features

- Supabase authentication with persisted sessions in Expo SecureStore.
- Step-by-step statistics solving through the backend `/api/solve` endpoint.
- Optional image upload from the device photo library for question solving.
- Topic-aware solving and learning flows.
- Generated tutorial and practice sessions by topic and difficulty.
- Local SQLite storage for solved questions, tutorials, practice sessions, and topic progress.
- History and review screens for saved work.
- Built-in statistics calculator for z-scores, confidence intervals, and z-test p-values.
- Native bottom-tab navigation across Home, Solve, Learn, History, and Calculator.

## Tech Stack

- Expo SDK 54
- React 19 and React Native 0.81
- TypeScript
- React Navigation
- NativeWind and Tailwind CSS
- Supabase
- Expo SQLite
- Zustand
- Victory Native, Skia, SVG, and WebView for math/chart rendering support

## Project Structure

```text
statsolve-app/
  assets/                 App icons, splash screen, and favicon
  src/
    components/           Shared UI and math rendering components
    database/             Expo SQLite schema and local persistence helpers
    navigation/           Auth stack, main tabs, learn stack, and root navigator
    screens/              App screens and auth screens
    services/             API and Supabase clients
    stores/               Zustand state stores
    types/                Shared TypeScript types
    utils/                Topic data and formatting helpers
  App.tsx                 App providers and root navigator
  app.json                Expo app configuration
  package.json            Scripts and dependencies
```

## Prerequisites

- Node.js LTS
- npm
- Expo CLI through `npx expo`
- Android Studio, Xcode, Expo Go, or an Expo development build depending on your target device

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your project values:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=https://your-api-host.example.com
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_...
```

Start the Expo dev server:

```bash
npm start
```

Then run on a platform:

```bash
npm run android
npm run ios
npm run web
```

## Available Scripts

```bash
npm start        # Start Expo
npm run android  # Start Expo and open Android
npm run ios      # Start Expo and open iOS
npm run web      # Start Expo for web
npm run lint     # Run ESLint over TypeScript files
npm run fix-deps # Ask Expo to align dependency versions
```

## Backend Requirements

The app expects `EXPO_PUBLIC_API_URL` to point to a StatSolve backend that accepts Supabase bearer tokens and exposes:

- `POST /api/solve` for streaming step-by-step solutions
- `POST /api/tutorial` for streaming tutorial content
- `POST /api/practice` for generated practice questions

The solve and tutorial flows consume server-sent-event style `data:` messages through `XMLHttpRequest`, which is used because React Native does not support streaming `fetch` response bodies in the same way as browsers.

## Local Data

The app creates an Expo SQLite database named `statsolve.db` with tables for:

- `solved_questions`
- `tutorials`
- `practice_sessions`
- `topic_progress`

Supabase auth sessions are stored through a custom chunked SecureStore adapter so large session payloads can be persisted safely.

## App Configuration

The Expo app is configured in `app.json` with:

- App name: `StatSolve`
- Slug: `statsolve`
- Bundle identifier/package: `com.statsolve.app`
- Custom scheme: `statsolve`
- Camera and photo library permission descriptions for solving questions from images

## Notes

- The checked-in `.env.example` contains public Expo values only. Do not commit private service-role keys or server-only secrets to this app.
- Free accounts currently have a local saved-question limit in the solver flow; premium status is read from the authenticated user profile.
- The calculator screen runs locally and does not call the backend.
