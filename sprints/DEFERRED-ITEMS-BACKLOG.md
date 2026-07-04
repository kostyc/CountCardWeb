# Deferred Items Backlog

This document tracks all deferred items from completed sprints, organized by priority and assigned sprint (if known).

**Last Updated**: January 18, 2026  
**Last Review**: January 18, 2026 - Prioritized per user request

## Priority Legend

- 🔴 **CRITICAL** - Blocks core functionality, should be integrated immediately
- 🟡 **HIGH** - Important but not blocking, document and track for future
- 🟢 **MEDIUM** - Nice to have, document for future enhancement
- 🔵 **LOW** - Properly deferred to future sprints, already tracked

---

## 🔴 CRITICAL - Integrate Now

### 1. Profile Picture Upload (Sprint 2, Task 6)
**Source Sprint**: Sprint 2  
**Priority**: Critical  
**Status**: ⏳ **VERIFICATION REQUIRED** - Code exists, needs testing  
**Assigned To**: Immediate action recommended  
**Estimated Effort**: Low (code exists, needs verification)

**Description**:  
Profile picture upload functionality for user profiles. **Code is implemented** but needs verification that it works end-to-end.

**Current Implementation Status**:
- ✅ `lib/storage/profilePicture.ts` - Upload function fully implemented
- ✅ `app/(dashboard)/profile/create/page.tsx` - Upload handler integrated
- ✅ Firebase Storage initialized in `lib/firebase/config.ts`
- ✅ API endpoint accepts `profilePictureUrl` parameter
- ⏳ **Needs**: End-to-end testing and Firebase Storage security rules verification

**Action Required**:
1. **Verify Firebase Storage is configured** in Firebase Console
2. **Verify Firebase Storage security rules** are set up (allow authenticated users to upload to `profile-pictures/{userId}/*`)
3. **Test upload functionality** end-to-end:
   - Select image in profile wizard
   - Upload completes successfully
   - URL is saved to user profile
   - Image displays correctly
4. **Fix any issues** found during testing

**Files to Review**:
- `lib/storage/profilePicture.ts` - Upload implementation (✅ Complete)
- `app/(dashboard)/profile/create/page.tsx` - Profile wizard integration (✅ Complete)
- `app/api/user/profile/route.ts` - API endpoint (✅ Complete)
- `lib/firebase/config.ts` - Storage initialization (✅ Complete)
- Firebase Storage Console - Security rules verification needed

**Notes**: 
- **Code is complete** - this is a verification/testing task, not implementation
- Firebase Storage infrastructure exists and is initialized
- Profile wizard has full upload flow implemented
- Low effort, high value - just needs verification

---

## 🟡 HIGH PRIORITY - Document and Track

### 2. Phone Authentication UI (Sprint 2, Task 2)
**Source Sprint**: Sprint 2  
**Priority**: Medium (not needed for launch)  
**Status**: ⏳ **DEFERRED TO BACKLOG** - Component exists, integration deferred  
**Assigned To**: Backlog - Future enhancement  
**Estimated Effort**: Low-Medium (component exists, needs integration)  
**Decision**: Not needed for launch (per user confirmation, January 18, 2026)

**Description**:  
Phone number authentication UI component. **Component is fully implemented** but not integrated into login/signup pages. Deferred to backlog as not required for launch.

**Current Implementation Status**:
- ✅ `components/auth/PhoneAuth.tsx` - Fully implemented with reCAPTCHA verifier
- ✅ `context/AuthContext.tsx` - Backend authentication method exists (`signInWithPhone`)
- ⏳ `app/(auth)/signup/page.tsx` - Component imported but NOT rendered
- ❌ `app/(auth)/login/page.tsx` - Component not imported or rendered

**Future Action Required** (when phone auth is needed):
1. **Integrate PhoneAuth component** into signup page:
   - Add conditional rendering based on `authMethod` state (already exists)
   - Render PhoneAuth when `authMethod === 'phone'`
   - Add toggle button to switch between email/phone auth
2. **Integrate PhoneAuth component** into login page:
   - Import PhoneAuth component
   - Add auth method toggle (email/phone)
   - Render PhoneAuth when phone method selected
3. **Test phone authentication flow**:
   - Send verification code
   - Verify code entry
   - Complete authentication
   - Handle errors gracefully

**Files to Review** (when implementing):
- `components/auth/PhoneAuth.tsx` - ✅ Component fully implemented
- `context/AuthContext.tsx` - ✅ Backend method exists
- `app/(auth)/signup/page.tsx` - ⏳ Needs integration (component imported but not rendered)
- `app/(auth)/login/page.tsx` - ❌ Needs integration (component not imported)

**Notes**: 
- **Component is complete** - integration deferred to backlog
- Backend authentication method fully functional
- UI component has reCAPTCHA verifier implemented
- **Decision**: Not needed for launch - deferred to backlog
- Can be added as future enhancement when phone auth is required

---

### 3. Account Linking (Sprint 2, Task 5)
**Source Sprint**: Sprint 2  
**Priority**: High (user convenience feature)  
**Status**: ⏳ Deferred  
**Assigned To**: Sprint 8 or later (Profile Management sprint)  
**Estimated Effort**: Medium-High

**Description**:  
Allow users to link multiple authentication providers to a single account.

**Action Required**:
- Create account linking UI component
- Implement provider linking logic using Firebase `linkWithCredential`
- Handle duplicate account detection
- Show linked providers in user profile
- Allow unlinking providers (with safeguards - prevent unlinking last provider)
- Handle linking errors
- Add to user settings page

**Notes**: 
- User convenience feature
- Not blocking core functionality
- Can be added in Sprint 8 (Profile Management) or later

---

### 4. Count Card Export Functionality (Sprint 7, Task 4)
**Source Sprint**: Sprint 7  
**Priority**: High (useful for reporting)  
**Status**: ⏳ Deferred  
**Assigned To**: Sprint 12 (Reporting & Analytics)  
**Estimated Effort**: Medium

**Description**:  
CSV/PDF export functionality for count cards.

**Action Required**:
- Implement CSV export for count card list
- Implement PDF export for count card detail
- Add export button to count card list view
- Add export button to count card detail view

**Notes**: 
- Export functionality belongs with reporting features
- Deferred to Sprint 12 where it fits naturally
- Basic count card functionality works without export

---

### 5. Workflow Notifications (Sprint 7, Task 3)
**Source Sprint**: Sprint 7  
**Priority**: High (user experience)  
**Status**: ⏳ Deferred  
**Assigned To**: Sprint 19 (Notification System)  
**Estimated Effort**: Low (when notification system exists)

**Description**:  
Notifications for count card workflow transitions (submission, approval, rejection, forwarding).

**Action Required**:
- Integrate with notification system when available (Sprint 19)
- Notify users when count cards are submitted to them
- Notify users when count cards are approved/rejected
- Notify users when count cards are forwarded

**Notes**: 
- Requires notification system infrastructure (Sprint 19)
- Low effort once notification system exists
- Workflow functionality works without notifications

---

### 6. Sprint 7 Tasks 8 & 9 (Audit Trail & Reporting)
**Source Sprint**: Sprint 7  
**Priority**: High (but deferred per user decision)  
**Status**: ⏳ Deferred  
**Assigned To**: Sprint 12 (Reporting & Analytics) or dedicated audit trail sprint  
**Estimated Effort**: High

**Description**:  
- **Task 8**: Count Card History and Audit Trail - Comprehensive audit trail system
- **Task 9**: Count Card Reporting and Analytics - Analytics dashboard and reporting

**Action Required**:
- Implement comprehensive audit trail system (Task 8)
- Implement reporting and analytics dashboard (Task 9)
- Display audit trail in count card detail view
- Add audit trail export functionality
- Create analytics dashboard
- Implement accountability trends
- Add report export functionality

**Notes**: 
- Deferred per user decision
- Audit trail and reporting can be added later
- Core count card functionality works without these features
- Workflow history tracking is already implemented in Tasks 1-7

---

## 🟢 MEDIUM PRIORITY - Document for Future

### 7. Location History Tracking (Sprint 7, Task 6)
**Source Sprint**: Sprint 7  
**Priority**: Medium  
**Status**: ⏳ Deferred  
**Assigned To**: Future enhancement backlog  
**Estimated Effort**: Medium

**Description**:  
Track location changes over time for count cards.

**Action Required**:
- Track location changes (requires data model enhancement)
- Display location history in count card detail view

**Notes**: 
- Nice-to-have feature
- Not critical for core functionality
- Requires data model enhancement

---

### 8. GPS Location Capture (Sprint 7, Task 6)
**Source Sprint**: Sprint 7  
**Priority**: Medium  
**Status**: ⏳ Deferred  
**Assigned To**: Future enhancement backlog  
**Estimated Effort**: Low-Medium

**Description**:  
Optional GPS location capture for count cards.

**Action Required**:
- Implement GPS location capture
- Add GPS capture button to count card creation form
- Store GPS coordinates in count card data

**Notes**: 
- Optional feature
- Not critical for core functionality
- Manual location input works for now

---

### 9. Individual Recruit List in Count Cards (Sprint 7, Task 5)
**Source Sprint**: Sprint 7  
**Priority**: Medium  
**Status**: ⏳ Deferred  
**Assigned To**: Future enhancement backlog  
**Estimated Effort**: Medium-High

**Description**:  
Display individual recruits with their accountability status in count card detail view.

**Action Required**:
- Enhance data model to store individual recruit IDs and status
- Display individual recruit list in count card detail view
- Show accountability status for each recruit

**Notes**: 
- Requires data model enhancement
- Current model stores only aggregated counts
- Can be added as future enhancement

---

## 🔵 LOW PRIORITY - Properly Deferred (Already Tracked)

### 10. Firestore Security Rules (Sprint 5, Task 8)
**Source Sprint**: Sprint 5  
**Priority**: Critical (but properly deferred)  
**Status**: ⏳ Deferred - Properly Tracked  
**Assigned To**: Sprint 13 (Security & Compliance phase)  
**Estimated Effort**: High

**Description**:  
Comprehensive Firestore security rules with role-based access control.

**Current State**: 
- Basic restrictive rules exist (deny all access)
- Placeholder for Sprint 13 implementation

**Notes**: 
- ✅ Properly tracked in Sprint 13
- Will be implemented in Security & Compliance phase
- Current placeholder rules are intentional

---

### 11. Incident Alert Validation Schema (Sprint 5)
**Source Sprint**: Sprint 5  
**Priority**: Low (future feature)  
**Status**: ⏳ Deferred - Properly Tracked  
**Assigned To**: Sprint 18 (Incident Alert System)  
**Estimated Effort**: Medium

**Description**:  
Validation schema for Incident Alert system.

**Current State**:
- Incident Alert types defined in `types/models.ts`
- Validation schema not yet implemented
- Service layer not yet implemented

**Notes**: 
- ✅ Properly tracked in Sprint 18
- Incident Alert system is planned for Sprint 18
- Types and data model structure are ready

---

## Sprint 4: Advanced Features (Pending)

The following advanced features from Sprint 4 are pending:

### 12. Accessibility Implementation (Sprint 4, Task 11)
**Source Sprint**: Sprint 4  
**Priority**: Critical (WCAG 2.1 AA compliance required)  
**Status**: ⏳ Pending  
**Assigned To**: Future sprint or integrated into component development  
**Estimated Effort**: High

**Description**:  
Comprehensive accessibility features including utilities, keyboard navigation, ARIA attributes, focus management, and screen reader testing.

---

### 13. Animation & Micro-Interactions (Sprint 4, Task 12)
**Source Sprint**: Sprint 4  
**Priority**: Medium (enhancement feature)  
**Status**: ⏳ Pending  
**Assigned To**: Future sprint or integrated as needed  
**Estimated Effort**: Medium

**Description**:  
Smooth animations and micro-interactions to enhance user experience.

---

### 14. Dark Mode Implementation (Sprint 4, Task 13)
**Source Sprint**: Sprint 4  
**Priority**: High (required feature)  
**Status**: ⏳ Pending  
**Assigned To**: Future sprint or integrated into component development  
**Estimated Effort**: Medium

**Description**:  
Comprehensive dark mode support verification, theme toggle component, and dark mode documentation.

**Note**: Dark mode foundation exists (Tailwind CSS dark mode classes configured), but comprehensive testing and theme toggle component are pending.

---

### 15. Performance Optimization - UI Components (Sprint 4, Task 14)
**Source Sprint**: Sprint 4  
**Priority**: Medium (optimization feature)  
**Status**: ⏳ Pending  
**Assigned To**: Future sprint or integrated as needed  
**Estimated Effort**: Medium-High

**Description**:  
Code splitting, bundle size optimization, lazy loading, component memoization, and image optimization.

---

### 16. Component Documentation & Storybook Setup (Sprint 4, Task 15)
**Source Sprint**: Sprint 4  
**Priority**: Medium (documentation feature)  
**Status**: ⏳ Pending  
**Assigned To**: Future sprint or integrated as needed  
**Estimated Effort**: Medium

**Description**:  
Storybook setup, component stories, component documentation, usage examples, and props documentation.

---

## Summary

### Immediate Actions Required
1. **Profile Picture Upload** (Sprint 2) - **VERIFICATION REQUIRED**
   - Code is complete, needs Firebase Storage rules verification and end-to-end testing
   - Estimated: 30-60 minutes (verification/testing only)

### High Priority Backlog
2. **Phone Authentication UI** (Sprint 2) - **DEFERRED TO BACKLOG**
   - Component fully implemented, integration deferred
   - Estimated: 1-2 hours (integration only, when needed)
   - **Decision**: Not needed for launch - moved to backlog

3. Account Linking (Sprint 2) - Sprint 8 or later
4. Count Card Export (Sprint 7) - Sprint 12
5. Workflow Notifications (Sprint 7) - Sprint 19
6. Sprint 7 Tasks 8 & 9 - Sprint 12 or dedicated sprint

### Medium Priority Backlog
7. Location History Tracking (Sprint 7)
8. GPS Location Capture (Sprint 7)
9. Individual Recruit List (Sprint 7)
10-16. Sprint 4 Advanced Features (Tasks 11-15)

### Properly Tracked (No Action Needed)
- Firestore Security Rules → Sprint 13 ✅
- Incident Alert Schemas → Sprint 18 ✅

---

## Tracking

This backlog will be updated as items are:
- Completed
- Assigned to specific sprints
- Reprioritized
- Cancelled

**Last Review**: January 18, 2026
