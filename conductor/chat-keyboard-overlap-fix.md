# Chat Keyboard Overlap Fix Plan

## Objective
Fix the issue where the chat input field is still hidden by the keyboard when typing, caused by the `KeyboardAvoidingView` rendering across the full screen height while a `SafeAreaView` sits inside the Header.

## Key Files & Context
- `mobile/app/chat/[id].tsx`

Currently, the `KeyboardAvoidingView` wraps the entire screen including the `<Header>`. Because the header contains a `<SafeAreaView>`, this disrupts the internal calculations `KeyboardAvoidingView` uses on iOS to determine the visible height. By wrapping the full screen, it expects to manage safe areas itself or assumes no safe areas. To resolve this, `KeyboardAvoidingView` should only wrap the content that actually sits *below* the header (i.e., the ScrollView and the TextInput).

## Implementation Steps
1. **Update `mobile/app/chat/[id].tsx`**:
   - Refactor the return statement so that the root element is a regular `<View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">`.
   - Place the `<StatusBar>` and `<Header>` inside this root view.
   - Place the `<KeyboardAvoidingView>` directly below the `<Header>`, giving it `className="flex-1"` and `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`.
   - Ensure the closing tags are ordered correctly at the bottom of the file.

## Verification & Testing
1. Navigate to a chat screen.
2. Tap the input field.
3. The keyboard should cleanly push the input box up by the exact height of the keyboard without hiding it or leaving gaps.