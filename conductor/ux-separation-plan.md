# Role-Based UX Separation Plan

## Background & Motivation
The application supports two distinct roles: Farmers and Investors. The intention is to provide a separate "My Farm" dashboard for farmers and a "Portfolio" dashboard for investors. However, the current routing implementation uses anti-patterns for Expo Router:
1. `mobile/app/index.tsx` redirects investors to `/(tabs)/investor-dashboard`, which does not exist inside the `(tabs)` directory.
2. `mobile/app/(tabs)/_layout.tsx` dynamically changes the `Tabs.Screen` `name` prop (`name={isFarmer ? 'dashboard' : 'investor-dashboard'}`). In Expo Router, `name` must statically map to an existing file name within the directory. This dynamic swapping causes the router to fail to find the investor screen.

## Scope & Impact
We will fix the routing so both roles share a single static tab route (`dashboard`), but the component rendered inside that route will dynamically switch based on the user's role.
- **Affected Files:**
  - `mobile/app/index.tsx`
  - `mobile/app/(tabs)/_layout.tsx`
  - `mobile/app/(tabs)/dashboard.tsx`

## Proposed Solution
1. **Unify Tab Routing (`mobile/app/index.tsx`)**: Redirect all authenticated users to the static `/(tabs)/dashboard` route, regardless of their role.
2. **Conditional Rendering (`mobile/app/(tabs)/dashboard.tsx`)**: Change this file from a simple re-export to a wrapper component. It will read `userRole` from `useAuthStore` and return `<DashboardScreen />` for farmers or `<InvestorDashboardScreen />` for investors.
3. **Static Tab Name (`mobile/app/(tabs)/_layout.tsx`)**: Change the first tab screen's `name` prop to be statically `"dashboard"`. The tab's `title` (label) will remain dynamic ("My Farm" vs "Portfolio") based on the `isFarmer` boolean.

## Implementation Steps
1. In `mobile/app/index.tsx`, change `const dashboardRoute = userRole === 'farmer' ? '/(tabs)/dashboard' : '/(tabs)/investor-dashboard';` to `const dashboardRoute = '/(tabs)/dashboard';`.
2. In `mobile/app/(tabs)/_layout.tsx`, change `<Tabs.Screen name={isFarmer ? 'dashboard' : 'investor-dashboard'} ... />` to `<Tabs.Screen name="dashboard" ... />`.
3. In `mobile/app/(tabs)/dashboard.tsx`, replace the single export line with a component that returns the correct dashboard based on `userRole`.

## Verification & Testing
- Log in as a Farmer and verify that the "My Farm" tab loads the Farmer Dashboard successfully.
- Log in as an Investor and verify that the "Portfolio" tab loads the Investor Dashboard successfully.
- Ensure no "missing route" warnings appear in the terminal during navigation.