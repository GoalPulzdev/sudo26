/// <reference types="expo/types" />

// Brings in Expo's ambient types, including `process.env.EXPO_PUBLIC_*`.
// Committed (not gitignored) so `tsc --noEmit` in CI resolves them without
// running the Expo TypeScript plugin first.
