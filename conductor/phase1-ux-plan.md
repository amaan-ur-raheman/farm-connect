# Phase 1 UX Improvement Plan

## Background & Motivation
The user wants to improve the UI/UX of the app to make it simple and easy to use. A pre-existing `UX_IMPROVEMENT_PLAN.md` outlines a series of phases. Phase 1 focuses on critical fixes that need to be completed first to improve the immediate polish and reduce interruptions.

## Scope & Impact
This plan covers the remaining tasks in Phase 1 of the UX Improvement Plan:
1.  **Add Skeleton Loading States**: Replace `ActivityIndicator` with skeleton placeholders for a smoother perceived loading experience on key screens.
2.  **Remove Duplicate Marketplace Navigation**: Remove the custom bottom nav bar in the marketplace screen as it duplicates the main tab bar.
3.  **Fix Notification Bell**: Update the header to use actual unread notification counts instead of a hardcoded dot.
4.  **Simplify Language**: Change "Terminate Session" to "Log Out" in the profile screen.
5.  **Fix Registration Steps**: Update the progress indicators in the registration flow to show correct step numbers.

**Affected Files:**
-   `mobile/src/components/ui/SkeletonCard.tsx` (New)
-   `mobile/app/contracts/index.tsx`
-   `mobile/app/chat/index.tsx`
-   `mobile/app/property/[id].tsx`
-   `mobile/app/investor-dashboard.tsx`
-   `mobile/app/marketplace.tsx`
-   `mobile/src/components/ui/Header.tsx`
-   `mobile/app/profile.tsx`
-   `mobile/app/register/preferences-farmer.tsx`
-   `mobile/app/register/preferences-investor.tsx`

## Proposed Solution & Implementation Steps
1.  **Skeleton Loading States**:
    *   Create `mobile/src/components/ui/SkeletonCard.tsx` using the existing `Skeleton` component (if available) or basic `View`s with animation.
    *   In `mobile/app/contracts/index.tsx`, `mobile/app/chat/index.tsx`, `mobile/app/property/[id].tsx`, `mobile/app/investor-dashboard.tsx`, and `mobile/app/marketplace.tsx`, locate the `if (loading) return <ActivityIndicator />` blocks and replace them with the new skeleton layout.
2.  **Remove Duplicate Marketplace Navigation**:
    *   In `mobile/app/marketplace.tsx`, find the `View` with `absolute bottom-X` styles that renders the secondary navigation bar and delete it.
3.  **Fix Notification Bell**:
    *   In `mobile/src/components/ui/Header.tsx`, import `useUnreadCounts` from `../../config/unread-context`.
    *   Call `const { unreadCounts } = useUnreadCounts();` inside the `Header` component.
    *   In the `variant === 'back-title'` section, replace the hardcoded red dot (`<View className="absolute top-1.5 right-1.5 size-2 bg-[#4cae4f] rounded-full" />`) with a conditional render: `{unreadCounts.notifications > 0 && <View className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />}`. (Note: The `menu` variant already seems to take a `notificationCount` prop, so we'll ensure that's wired up correctly where `Header` is used, or just handle it directly inside `Header`).
4.  **Simplify Language**:
    *   In `mobile/app/profile.tsx`, search for "Terminate Session" and replace it with "Log Out".
5.  **Fix Registration Steps**:
    *   In `mobile/app/register/preferences-farmer.tsx` and `mobile/app/register/preferences-investor.tsx`, check the progress indicator UI (e.g., "Step 1 of X") and ensure the numbers accurately reflect the current step in the onboarding flow.

## Verification
-   Navigate to the Marketplace, Contracts, Chat, and Property Details screens while loading to observe the new skeleton states.
-   Verify the duplicate navigation bar is gone from the Marketplace.
-   Check the Header across different screens to ensure the notification bell dot correctly reflects the unread count.
-   Verify the "Log Out" button text in the Profile.
-   Go through the registration flow to ensure step indicators are correct.