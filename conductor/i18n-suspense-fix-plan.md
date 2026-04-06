# React-i18next Suspense Fix Plan

## Objective
Fix the `[Error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?]` crash that occurs on the Profile Screen due to `useTranslation()` triggering React Suspense before `react-i18next` is fully initialized asynchronously.

## Key Files & Context
- `mobile/src/i18n/index.ts`

The `i18n` instance is initialized asynchronously inside `initI18n()` using `AsyncStorage`. Because it's async, the first time `ProfileScreen` renders and calls `useTranslation()`, `i18next` isn't ready. This triggers React Suspense (which is `true` by default in `react-i18next`). In Expo Router, if a tab screen suspends without a proper local `<Suspense>` boundary, it can cause the navigation context to break or throw the generic "NavigationContainer not found" error during the unmount/remount cycle.

## Implementation Steps
1. **Update `mobile/src/i18n/index.ts`**:
   - Add `compatibilityJSON: 'v3'` and `react: { useSuspense: false }` to the `i18n.init()` configuration options.
   - This prevents `react-i18next` from suspending the render tree, avoiding the crash. The component will just render with fallback keys until initialization completes.

## Verification & Testing
1. Reload the mobile app.
2. Navigate to the Profile tab.
3. The app should not crash with the Navigation context error.