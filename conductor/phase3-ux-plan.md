# Phase 3 UX Improvement Plan

## Background & Motivation
Phase 3 focuses on "Medium Features" that improve the overall depth and perceived performance of the app. This includes modernizing the search and list components, and ensuring a robust help system.

## Scope & Impact
1.  **Infinite Scroll in Marketplace**: Replace the "Load More" button with automated infinite scrolling using `FlatList`.
2.  **Debounced Search Refinement**: Improve the search responsiveness in the Marketplace.
3.  **Offline Cache Integration**: Use the existing cache utility to show data immediately on app launch.
4.  **Help Screen Content**: Ensure the FAQ and support info is comprehensive.

**Affected Files:**
-   `mobile/app/marketplace.tsx`
-   `mobile/app/help.tsx`
-   `mobile/app/_layout.tsx` (Ensure global stores are persisted)

## Proposed Solution & Implementation Steps
1.  **Marketplace Modernization**:
    *   Refactor `mobile/app/marketplace.tsx` to use `FlatList` instead of `ScrollView`.
    *   Move the Header and Map sections into `ListHeaderComponent`.
    *   Implement `onEndReached` to trigger `fetchListings` for the next page.
    *   Add a loading indicator in `ListFooterComponent`.
2.  **Search & Cache**:
    *   Add a `useEffect` to `MarketplaceScreen` to check for cached listings on mount.
    *   Optimize the debounce timeout to ensure no duplicate API calls.
3.  **Help & Support**:
    *   Verify the current FAQs cover the most important user questions (already done, they look good).
    *   Add a version indicator and clear contact options (already done).

## Verification
-   Scrolling to the bottom of the Marketplace should automatically load more farms without clicking a button.
-   Search results should update smoothly as the user types (with a slight delay).
-   Closing and reopening the app should show the Marketplace list faster due to caching.
-   Help screen links (email, phone) should trigger the device's native apps.