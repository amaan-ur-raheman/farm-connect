# Chat Input Fix Plan

## Objective
Fix the issue where the chat input field is hidden by the keyboard when typing.

## Key Files & Context
- `mobile/app/chat/[id].tsx`

The `KeyboardAvoidingView` currently has a `keyboardVerticalOffset` set to 90 on iOS, and uses `behavior="height"` on Android. 
Because the native stack header is disabled (`headerShown: false`) and the custom `<Header />` component is rendered inside the `KeyboardAvoidingView`'s boundaries, the view starts from the very top edge of the screen. By setting the vertical offset to 90, the `KeyboardAvoidingView` incorrectly subtracts 90 pixels from the space it pushes up, leaving the input field hidden behind the keyboard on iOS. Furthermore, Android's `windowSoftInputMode` is typically set to `adjustResize` out of the box in Expo, making `behavior="height"` unnecessary and sometimes conflicting.

## Implementation Steps
1. **Update `mobile/app/chat/[id].tsx`**:
   - Locate the `<KeyboardAvoidingView>` wrapping the screen.
   - Change `behavior={Platform.OS === "ios" ? "padding" : "height"}` to `behavior={Platform.OS === "ios" ? "padding" : undefined}`.
   - Change `keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}` to `keyboardVerticalOffset={0}`.

## Verification & Testing
1. Open the app and navigate to a chat screen.
2. Tap the input field to bring up the keyboard.
3. Confirm that the input field is correctly pushed above the keyboard on both iOS and Android.