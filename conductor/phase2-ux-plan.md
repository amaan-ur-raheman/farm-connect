# Phase 2 UX Improvement Plan

## Background & Motivation
Phase 2 focuses on high-impact UX improvements that make the app feel more responsive and professional. This includes adding missing call-to-actions (CTAs), integrating haptic feedback for physical responses to digital actions, and refining key UI components.

## Scope & Impact
1.  **Add "Create Listing" CTA for Farmers**: In the contracts screen empty state, farmers should be encouraged to create a listing if they have no active contracts.
2.  **Haptic Feedback Integration**: Add haptic responses to button presses, successful operations, and errors.
3.  **UI Refinement in Dashboard**: Enhance the icons and labels in the Quick Actions section.
4.  **Refine Contract Detail UI**: Ensure the "Contact Farmer" and "Acquire Lease" buttons use consistent styling and haptics.

**Affected Files:**
-   `mobile/app/contracts/index.tsx`
-   `mobile/app/dashboard.tsx`
-   `mobile/app/property/[id].tsx`
-   `mobile/app/login.tsx` (Add haptics to login actions)
-   `mobile/app/chat/[id].tsx` (Add haptics to send)

## Proposed Solution & Implementation Steps
1.  **Empty State CTA**:
    *   In `mobile/app/contracts/index.tsx`, update the empty state logic to show a "Create Your First Listing" button when `userRole === 'farmer'` and `filter === 'ALL'`.
2.  **Haptic Feedback**:
    *   Import `haptic` from `../../src/utils/haptics`.
    *   Add `haptic.light()` to primary action buttons (onPress).
    *   Add `haptic.success()` or `haptic.error()` to the results of async operations (login, payment, create contract).
3.  **Dashboard Polish**:
    *   Replace emoji icons in Quick Actions with more professional `lucide-react-native` icons.
    *   Ensure consistent padding and spacing.

## Verification
-   Farmer without contracts should see "Create Listing" in the My Leases screen.
-   Button presses across the app should trigger a subtle haptic vibration.
-   Dashboard Quick Actions should look visually consistent with the rest of the app.
-   Successful login or contract creation should trigger a success haptic notification.