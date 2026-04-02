# 📱 FarmConnect iOS Simulator - Testing Checklist

**Use this checklist to systematically test all features on iOS Simulator**

---

## 🎯 Pre-Testing Setup

### Environment Verification

- [ ] Xcode installed and license accepted
- [ ] Command line tools working (`xcrun --version`)
- [ ] At least one iOS simulator available
- [ ] Watchman installed (`brew list watchman`)
- [ ] Node.js v18+ installed

### Backend Setup

- [ ] Backend dependencies installed (`npm install`)
- [ ] Database tables created (`npm run db:push`)
- [ ] Test data seeded (`npm run db:seed`)
- [ ] Server running on port 3000
- [ ] Health endpoint responding: `http://localhost:3000/health`
- [ ] No errors in backend console

### Mobile Setup

- [ ] Mobile dependencies installed (`npm install`)
- [ ] `.env` file exists with correct API URL
- [ ] Expo starts without errors
- [ ] iOS simulator launches when pressing 'i'
- [ ] App loads successfully (no white screen/crash)

---

## 🏠 Landing & Onboarding

### Landing Page

- [ ] Splash screen appears on app launch
- [ ] FarmConnect logo displays correctly
- [ ] Background color matches design (#f6f8f6)
- [ ] "Login" button visible and tappable
- [ ] "Register" button visible and tappable
- [ ] Navigation bar at bottom renders correctly
- [ ] All icons display properly

### Registration Flow

- [ ] Tap "Register" button works
- [ ] Phone number input appears
- [ ] Country code selector works
- [ ] Validation for invalid phone numbers
- [ ] Can proceed to OTP screen
- [ ] OTP verification works
- [ ] Role selection (Farmer/Consumer) works
- [ ] Profile creation form appears
- [ ] Form validation works
- [ ] Registration completes successfully
- [ ] Redirects to appropriate dashboard

---

## 🔐 Authentication

### Login

- [ ] Phone number input works
- [ ] Valid phone format accepted
- [ ] Invalid phone format rejected
- [ ] OTP request sends successfully
- [ ] OTP input field works
- [ ] Resend OTP button functional
- [ ] Correct OTP logs in successfully
- [ ] Wrong OTP shows error message
- [ ] Expired OTP handled correctly
- [ ] Redirects to dashboard after login
- [ ] Auth state persists after app restart

### Logout

- [ ] Logout button accessible (profile/settings)
- [ ] Confirmation dialog appears
- [ ] Confirms logout
- [ ] Clears auth state
- [ ] Returns to landing page
- [ ] Cannot access protected screens after logout
- [ ] Session doesn't persist after logout

---

## 👨‍🌾 Farmer Dashboard

### Dashboard Overview

- [ ] Dashboard loads without errors
- [ ] Welcome message displays
- [ ] Farm stats cards render (total listings, active contracts, etc.)
- [ ] Quick action buttons work
- [ ] Recent activity feed shows data
- [ ] Pull-to-refresh works
- [ ] Loading states appear during data fetch
- [ ] Empty states show when no data

### Create Listing

- [ ] "Create Listing" button accessible
- [ ] Listing form opens
- [ ] Name input works
- [ ] Description textarea works
- [ ] Location search/input works
- [ ] Area (acres) input validates numbers only
- [ ] Price per acre input works
- [ ] Crop type selector works
- [ ] Soil type dropdown works
- [ ] Irrigation type selector works
- [ ] Organic certification toggle works
- [ ] Expected harvest date picker works
- [ ] Image upload button works
- [ ] Camera integration works
- [ ] Photo library integration works
- [ ] Multiple images can be uploaded
- [ ] Image preview shows thumbnails
- [ ] Can remove uploaded images
- [ ] Form validation prevents empty required fields
- [ ] Submit creates listing successfully
- [ ] Success message displays
- [ ] Redirects to listing detail or dashboard

### Manage Listings

- [ ] "My Listings" accessible from dashboard
- [ ] Lists all farmer's listings
- [ ] Shows listing status (Active/Pending/Sold)
- [ ] Edit button works for each listing
- [ ] Can update listing details
- [ ] Can add more images
- [ ] Can delete listing (with confirmation)
- [ ] Status updates reflect immediately
- [ ] Investment requests count shown
- [ ] Can view investment requests for each listing

### Investment Requests

- [ ] Notification badge shows unread requests
- [ ] Request notification appears
- [ ] Can open request details
- [ ] Investor profile visible
- [ ] Proposed terms displayed clearly
- [ ] Chat with investor button works
- [ ] Accept button functional
- [ ] Reject button functional
- [ ] Counter-offer option works (if implemented)
- [ ] Status updates after action
- [ ] Contract auto-generated on acceptance

### Post Updates

- [ ] "Post Update" button accessible
- [ ] Text input for update content
- [ ] Image attachment works
- [ ] Multiple images supported
- [ ] Preview before posting
- [ ] Post button works
- [ ] Update appears in farm's update feed
- [ ] Investors receive notification
- [ ] Can edit own updates
- [ ] Can delete own updates

### Deliveries

- [ ] "Deliveries" section accessible
- [ ] Lists all deliveries for farmer's farms
- [ ] Shows delivery status
- [ ] Can mark as harvested
- [ ] Can initiate delivery
- [ ] Delivery proof upload works (photos)
- [ ] GPS location capture works (if implemented)
- [ ] Investor verification status shown
- [ ] Completed deliveries marked appropriately
- [ ] Delivery history accessible

### Wallet

- [ ] "Wallet" accessible from navigation
- [ ] Current balance displays
- [ ] Transaction history lists correctly
- [ ] Incoming payments shown (green)
- [ ] Outgoing payments shown (red)
- [ ] Transaction details expandable
- [ ] Filter by transaction type works
- [ ] Date range selector works
- [ ] Withdrawal request feature works (if implemented)
- [ ] Payment receipt viewable

---

## 👩‍💼 Investor Experience

### Marketplace

- [ ] Marketplace loads successfully
- [ ] Listings display in grid/list view
- [ ] Each card shows key info (name, location, price)
- [ ] Image carousel works on listing cards
- [ ] Infinite scroll works
- [ ] Pull-to-refresh works
- [ ] Loading skeleton appears during fetch
- [ ] Empty state if no listings match filters

#### Filtering & Search

- [ ] Filter button opens filter modal
- [ ] Location filter works (state/district)
- [ ] Price range slider works
- [ ] Acreage range filter works
- [ ] Crop type multi-select works
- [ ] Soil type filter works
- [ ] Organic only toggle works
- [ ] Apply filters button works
- [ ] Clear all filters button works
- [ ] Results update immediately
- [ ] Filter count badge shows
- [ ] Search bar works
- [ ] Search results highlight matching terms

### Listing Details

- [ ] Tap listing opens detail page
- [ ] Image gallery with swipe works
- [ ] Zoom on images works
- [ ] All listing details display
- [ ] Farmer profile section shows
- [ ] Farmer rating displays
- [ ] Location map renders (if implemented)
- [ ] Investment calculator works
- [ ] ROI estimation calculates correctly
- [ ] "Invest Now" button enabled for available listings
- [ ] Already invested listings show appropriate status
- [ ] Share button works (if implemented)

### Investment Process

- [ ] "Invest Now" opens investment form
- [ ] Acreage selector works
- [ ] Total cost calculates automatically
- [ ] Terms and conditions display
- [ ] Can review before confirming
- [ ] "Send Request" submits successfully
- [ ] Request appears in "My Investments"
- [ ] Notification when farmer accepts/rejects
- [ ] Contract generation works
- [ ] E-signature flow works (if implemented)
- [ ] Payment initiation works

### Payment Flow

- [ ] Razorpay modal opens
- [ ] Test mode uses test credentials
- [ ] Card input works
- [ ] UPI option works (if implemented)
- [ ] Net banking works (if implemented)
- [ ] Payment success redirects correctly
- [ ] Receipt displays after payment
- [ ] Escrow ledger updates
- [ ] Transaction appears in wallet
- [ ] Farmer receives notification

### Track Investments

- [ ] "My Investments" accessible
- [ ] Lists all investments
- [ ] Status badges correct (Active/Completed/etc.)
- [ ] Investment details expandable
- [ ] Contract PDF viewable/downloadable
- [ ] Farm updates feed shows for owned investments
- [ ] Update notifications received
- [ ] Delivery tracking accessible
- [ ] Expected return calculations shown
- [ ] Can contact farmer from investment view

---

## 💬 Real-time Features

### Chat System

- [ ] Chat list shows all conversations
- [ ] Unread message count displays
- [ ] Last message preview shows
- [ ] Timestamp formatted correctly
- [ ] Open chat with specific user
- [ ] Message bubbles render correctly
- [ ] Sent messages aligned right
- [ ] Received messages aligned left
- [ ] Message timestamps show
- [ ] Read receipts work (double tick)
- [ ] Online/offline status indicator works
- [ ] Typing indicator appears
- [ ] Image sharing in chat works
- [ ] Image preview in chat works
- [ ] Send button enabled when text entered
- [ ] Messages send instantly via WebSocket
- [ ] Offline messages queue and send when online
- [ ] Scroll to bottom on new message
- [ ] Pull up to load older messages

### Notifications

- [ ] Notification bell icon accessible
- [ ] Unread count badge shows
- [ ] Notification list renders
- [ ] Different types styled differently (investment, delivery, system)
- [ ] Tap notification navigates to relevant screen
- [ ] Mark as read functionality works
- [ ] Clear all notifications works
- [ ] Push notifications received on device
- [ ] Notification permissions requested correctly
- [ ] Can enable/disable in settings
- [ ] Notification sound plays (if enabled)
- [ ] Badge count on app icon updates

---

## 📊 Contracts & Legal

### Contract Management

- [ ] "Contracts" section accessible
- [ ] Lists all active contracts
- [ ] Contract details expandable
- [ ] Terms clearly displayed
- [ ] Parties information shown
- [ ] Investment amount highlighted
- [ ] Duration/dates clear
- [ ] Status tracker shows current stage
- [ ] Milestone completion tracking
- [ ] Contract documents downloadable
- [ ] Dispute clause accessible
- [ ] Termination conditions viewable

### Contract Lifecycle

- [ ] Draft → Pending → Active → Completed flow works
- [ ] Status updates trigger notifications
- [ ] Milestone completions recorded
- [ ] Payment releases documented
- [ ] Completion certificates generated (if implemented)
- [ ] Historical contracts accessible
- [ ] Renewal options work (if implemented)

---

## ⚠️ Dispute Resolution

### Raise Dispute

- [ ] "Raise Dispute" button on active contracts
- [ ] Dispute reason selector works
- [ ] Description field allows detailed explanation
- [ ] Evidence photo upload works
- [ ] Multiple evidence items supported
- [ ] Submit dispute creates case
- [ ] Other party notified
- [ ] Contract pauses automatically
- [ ] Admin notified for mediation

### Dispute Management

- [ ] "Disputes" section accessible
- [ ] Lists all disputes (raised/against)
- [ ] Status shows (Open/Under Review/Resolved)
- [ ] Case details viewable
- [ ] Chat with admin works
- [ ] Additional evidence can be submitted
- [ ] Resolution decision displayed
- [ ] Fund distribution shown
- [ ] Case closure notification received
- [ ] Can rate dispute resolution process

---

## ⭐ Reviews & Ratings

### Leave Review

- [ ] Review prompt appears after contract completion
- [ ] Star rating selector works (1-5 stars)
- [ ] Review text area works
- [ ] Can attach photos (optional)
- [ ] Submit review succeeds
- [ ] Review appears on user's profile
- [ ] Cannot submit duplicate review for same contract

### View Reviews

- [ ] User profiles show reviews
- [ ] Average rating calculates correctly
- [ ] Review list sorted by date
- [ ] Can filter by rating
- [ ] Reviews with photos highlighted
- [ ] Helpful/unhelpful voting works (if implemented)
- [ ] Inappropriate review reporting works (if implemented)

---

## 👤 Profile & Settings

### Profile Management

- [ ] "Profile" accessible from navigation
- [ ] Profile picture displays
- [ ] Can change profile picture
- [ ] Camera integration works
- [ ] Photo library integration works
- [ ] Name editable
- [ ] Email editable
- [ ] Phone number shows (non-editable)
- [ ] KYC status displays
- [ ] Save changes works
- [ ] Validation on inputs works

### KYC Verification

- [ ] "Verify Identity" button accessible
- [ ] Document upload works
- [ ] Aadhar/PAN card upload (India-specific)
- [ ] Document preview shows
- [ ] Submission confirmation appears
- [ ] Status updates from Pending → Submitted → Verified
- [ ] Rejection shows reason
- [ ] Can resubmit if rejected
- [ ] Verified badge shows on profile

### Preferences

- [ ] Language selector works (if multi-language)
- [ ] Theme toggle works (Light/Dark/Auto)
- [ ] Notification preferences configurable
- [ ] Privacy settings adjustable
- [ ] Changes save correctly
- [ ] Settings persist across sessions

### Security

- [ ] Change password feature works
- [ ] Current password validation
- [ ] New password strength requirements
- [ ] Confirm password matches
- [ ] Password update succeeds
- [ ] Two-factor authentication setup (if implemented)
- [ ] Session management (view active devices)
- [ ] Can logout from all devices

---

## 🎨 UI/UX Quality

### Visual Design

- [ ] Consistent color scheme throughout
- [ ] Typography follows design system
- [ ] Icons are consistent style
- [ ] Images load properly
- [ ] No broken image placeholders
- [ ] Proper spacing and padding
- [ ] Buttons have correct touch targets (min 44x44)
- [ ] Loading spinners appear where needed
- [ ] Skeleton loaders for content areas
- [ ] Error states designed appropriately
- [ ] Empty states have helpful messaging

### Navigation

- [ ] Bottom tab bar always accessible
- [ ] Active tab highlighted correctly
- [ ] Tab switching smooth
- [ ] Back buttons work in header
- [ ] Deep linking works (if configured)
- [ ] Navigation stack behaves correctly
- [ ] Swipe back gesture works (iOS)
- [ ] No navigation loops or dead ends

### Animations

- [ ] Screen transitions smooth
- [ ] Button press feedback works
- [ ] Loading animations not janky
- [ ] Pull-to-refresh animation smooth
- [ ] Modal presentations animate properly
- [ ] Toast/notification animations smooth
- [ ] No stuttering during animations
- [ ] Animations respect reduced motion setting (iOS)

### Responsiveness

- [ ] Works on all iPhone sizes (SE to Pro Max)
- [ ] iPad layout acceptable (if supported)
- [ ] Landscape orientation handled (if supported)
- [ ] Safe areas respected (notch, home indicator)
- [ ] Keyboard doesn't cover inputs
- [ ] Long content scrolls properly
- [ ] Text truncation works for long strings
- [ ] Images scale appropriately

---

## 🔒 Security & Permissions

### Data Protection

- [ ] Sensitive data not logged to console
- [ ] Tokens stored securely (AsyncStorage encrypted)
- [ ] Biometric authentication works (if implemented)
- [ ] App lock feature works (if implemented)
- [ ] Screenshots blocked for sensitive screens (if implemented)

### Permissions

- [ ] Camera permission requested when needed
- [ ] Photo library permission requested
- [ ] Notification permission requested
- [ ] Location permission requested (if used)
- [ ] Permission explanations shown
- [ ] Can use app with minimal permissions
- [ ] Graceful degradation if permissions denied
- [ ] Can re-request permissions in settings

---

## ⚡ Performance

### Speed

- [ ] App cold starts in < 3 seconds
- [ ] Screen transitions < 300ms
- [ ] API calls complete in reasonable time
- [ ] List scrolling smooth (60 FPS)
- [ ] Image loading optimized (progressive/lazy)
- [ ] Search/filter results instant
- [ ] No noticeable lag during interactions

### Memory

- [ ] Memory usage stays under 200MB
- [ ] No memory leaks during extended use
- [ ] App doesn't crash after many screen navigations
- [ ] Image caching works efficiently
- [ ] Old data cleared appropriately

### Network

- [ ] Handles slow networks gracefully
- [ ] Offline mode shows appropriate UI
- [ ] Retry logic works for failed requests
- [ ] Request cancellation on screen unmount
- [ ] No duplicate API calls
- [ ] Proper error messages for network failures

---

## 🔄 Edge Cases & Error Handling

### Network Issues

- [ ] No internet connection shows offline state
- [ ] Request timeout shows retry option
- [ ] Partial data display handled
- [ ] Optimistic UI updates rollback on failure
- [ ] Queue actions for when back online

### Data Validation

- [ ] Empty fields validated
- [ ] Invalid formats rejected (email, phone)
- [ ] Number ranges enforced
- [ ] Date validations work (can't select future dates for past events)
- [ ] File size limits enforced
- [ ] File type restrictions work
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized

### Error States

- [ ] 404 errors handled gracefully
- [ ] 500 errors show user-friendly message
- [ ] Rate limiting errors inform user to wait
- [ ] Authentication errors redirect to login
- [ ] Authorization errors explain permissions needed
- [ ] Form submission errors preserve entered data
- [ ] Error messages actionable and clear

---

## 📱 Device-Specific Tests

### Different iPhone Models

Test on multiple simulators:

- [ ] iPhone SE (small screen)
- [ ] iPhone 16/15 (standard)
- [ ] iPhone 16/15 Pro Max (large screen)
- [ ] iPad (if supported)

### iOS Versions

- [ ] Latest iOS version
- [ ] Previous iOS version (if possible)

### Special Features

- [ ] Dynamic Island handling (iPhone 14+ Pro)
- [ ] Notch area doesn't cover content
- [ ] Home indicator doesn't overlap buttons
- [ ] Safe areas respected on all edges
- [ ] Status bar color appropriate (light/dark)

---

## 🎯 End-to-End Scenarios

### Complete Investment Journey

- [ ] Investor discovers farm in marketplace
- [ ] Investor reviews all details
- [ ] Investor sends investment request
- [ ] Farmer receives and accepts request
- [ ] Contract generated and signed
- [ ] Payment processed through Razorpay
- [ ] Funds held in escrow
- [ ] Farmer posts regular updates
- [ ] Investor receives and views updates
- [ ] Harvest completed
- [ ] Delivery initiated with proof
- [ ] Investor verifies delivery
- [ ] Funds released from escrow
- [ ] Both parties leave reviews
- [ ] Transaction complete

### Dispute Resolution Journey

- [ ] Issue arises during contract
- [ ] Investor raises dispute with evidence
- [ ] Farmer notified and responds
- [ ] Admin mediates via chat
- [ ] Additional evidence submitted
- [ ] Admin makes decision
- [ ] Funds distributed per decision
- [ ] Both parties notified
- [ ] Case closed
- [ ] Reviews updated based on outcome

---

## ✅ Final Sign-off

### Must Pass Before Production

- [ ] All critical flows work (auth, listings, payments, deliveries)
- [ ] No crashes during normal usage
- [ ] No data loss scenarios
- [ ] Security vulnerabilities addressed
- [ ] Performance acceptable on oldest supported device
- [ ] All accessibility features working
- [ ] Legal/compliance requirements met
- [ ] Third-party services integrated correctly
- [ ] Analytics tracking events firing
- [ ] Crash reporting configured

### Nice to Have

- [ ] All animations polished
- [ ] Perfect pixel implementation
- [ ] Advanced gestures implemented
- [ ] Offline mode fully functional
- [ ] All edge cases handled elegantly

---

## 📝 Notes & Issues Found

Use this space to document issues discovered during testing:

```
Issue #1:
Description:
Steps to Reproduce:
Severity: (Critical/Major/Minor)
Status: (Open/Fixed/Wont Fix)

Issue #2:
...
```

---

## 📊 Test Summary

**Date:** _______________  
**Tester:** _______________  
**iOS Version:** _______________  
**Device:** _______________  

**Total Tests:** _______  
**Passed:** _______  
**Failed:** _______  
**Skipped:** _______  

**Pass Rate:** _______%  

**Overall Status:** [ ] Ready for Production [ ] Needs Work [ ] Not Ready

**Comments:**

---

*This checklist should be completed for every major release!*
