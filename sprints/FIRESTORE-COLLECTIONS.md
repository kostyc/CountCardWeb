# Firestore Collections Structure Documentation

**Project**: `countcard-94c5b`  
**Database**: Firestore (NoSQL document database)  
**Last Updated**: January 17, 2026

## Table of Contents

1. [Overview](#overview)
2. [Core Collections](#core-collections)
3. [Collection Relationships](#collection-relationships)
4. [Index Requirements](#index-requirements)
5. [Security Rules Considerations](#security-rules-considerations)
6. [Type Alignment](#type-alignment)
7. [Future Build Collections](#future-build-collections)

## Overview

This document provides comprehensive documentation of all Firestore collections used in the CountCard application. Each collection is documented with:
- Document ID format
- Field structure and types
- Required vs optional fields
- Subcollections (if any)
- Index requirements
- Relationships to other collections

**Note**: Collections are created automatically when the first document is written. You don't need to create them manually.

## Core Collections

### 1. `recruits` - Recruit Profiles and Information

**Purpose**: Stores recruit profile information and organizational assignments.

**Document ID Format**: `{recruitId}` (auto-generated UUID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recruitId` | string | ✅ | Unique recruit identifier |
| `firstName` | string | ✅ | First name |
| `lastName` | string | ✅ | Last name |
| `rank` | string | ✅ | USMC rank (E-5 through E-9 for Enlisted, O-1 through O-6 for Officers) |
| `status` | string | ✅ | Recruit status (Active, Graduated, Separated, etc.) |
| `regiment` | string | ❌ | Recruit Training Regiment (West/East) |
| `battalion` | string | ❌ | Battalion assignment |
| `company` | string | ❌ | Company assignment |
| `series` | string | ❌ | Series assignment (Lead Series, Follow Series) |
| `platoon` | string | ✅ | Platoon assignment (4-digit string format, e.g., "2001") |
| `photoUrl` | string | ❌ | Profile photo URL |
| `encryptedData` | map | ❌ | Encrypted sensitive data |
| `emergencyContactIds` | array[string] | ❌ | References to emergency contacts (document IDs) |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Indexes Required**:
- Single-field: `platoon`, `company`, `battalion`, `regiment`, `status`, `rank`, `createdAt`
- Composite: `(battalion, company, platoon)`, `(regiment, battalion, company)`, `(status, createdAt)`, `(platoon, status)`

**Type Alignment**: `RecruitProfile` in `types/models.ts`

---

### 2. `countCards` - Accountability Records

**Purpose**: Stores count card records for recruit accountability tracking.

**Document ID Format**: `{countCardId}` (auto-generated UUID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `countCardId` | string | ✅ | Unique count card identifier |
| `platoon` | string | ✅ | Platoon ID |
| `company` | string | ✅ | Company ID |
| `battalion` | string | ✅ | Battalion ID |
| `regiment` | string | ❌ | Regiment ID |
| `status` | string | ✅ | Workflow status (pending, approved, rejected, consolidated) |
| `workflowState` | string | ✅ | Current workflow step |
| `submittedBy` | string | ✅ | User ID of Drill Instructor who submitted |
| `submittedTo` | string | ❌ | User ID of Duty Senior Drill Instructor |
| `approvedBy` | string | ❌ | User ID of approver |
| `rejectedBy` | string | ❌ | User ID of rejector |
| `location` | string | ❌ | Location of count |
| `timestamp` | timestamp | ✅ | Count card timestamp |
| `recruitCounts` | map | ❌ | Recruit status counts |
| `workflowHistory` | array | ❌ | Workflow transition history |
| `encryptedData` | map | ❌ | Encrypted sensitive data |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Indexes Required**:
- Single-field: `status`, `workflowState`, `platoon`, `company`, `battalion`, `timestamp`, `submittedBy`, `createdAt`
- Composite: `(status, createdAt)`, `(battalion, company, status)`, `(workflowState, createdAt)`, `(platoon, status, timestamp)`, `(submittedBy, createdAt)`

**Type Alignment**: `CountCard` in `types/models.ts`

---

### 3. `platoons` - Platoon/Squad Organization

**Purpose**: Stores platoon organizational structure and hierarchy.

**Document ID Format**: `{platoonId}` (4-digit string, e.g., "2001")

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platoonId` | string | ✅ | 4-digit format platoon identifier |
| `seriesId` | string | ✅ | Parent series document ID |
| `platoon` | string | ✅ | Platoon number (4-digit, same as document ID) |
| `regiment` | string | ✅ | Regiment name (denormalized) |
| `battalion` | string | ✅ | Battalion name (denormalized) |
| `company` | string | ✅ | Company name (denormalized) |
| `series` | string | ❌ | Series name (denormalized) |
| `platoonName` | string | ❌ | Display name for platoon |
| `drillInstructors` | array[string] | ❌ | Array of user IDs (Drill Instructors assigned to platoon) |
| `recruitCount` | number | ❌ | Current recruit count |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Indexes Required**:
- Single-field: `series`, `company`, `battalion`, `regiment`, `seriesId`
- Composite: `(battalion, company, series)`, `(regiment, battalion, company)`, `(seriesId, platoon)`, `(regiment, battalion, company, series, platoon)`

**Type Alignment**: `Platoon` in `types/models.ts`

---

### 3a. `regiments` - Regiment (West/East)

**Purpose**: Top-level org entity for Recruit Training Regiments.

**Document ID Format**: `{name}` (e.g. "West", "East")

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Regiment name (West \| East) |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Type Alignment**: `RegimentDocument` in `types/models.ts`

---

### 3b. `battalions` - Battalion (1st, 2nd, 3rd, Support)

**Purpose**: Battalion org entity; parent is regiment.

**Document ID Format**: `{regimentId}_{name}` (e.g. "West_1st")

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Battalion name (1st \| 2nd \| 3rd \| Support) |
| `regimentId` | string | ✅ | Parent regiment document ID |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Indexes Required**: Composite: `(regimentId, name)`

**Type Alignment**: `BattalionDocument` in `types/models.ts`

---

### 3c. `companies` - Company (by Battalion)

**Purpose**: Company org entity; parent is battalion. Company names are constrained by battalion (see `lib/constants/organizations.ts`).

**Document ID Format**: `{battalionId}_{name}` (e.g. "West_1st_Alpha")

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Company name (Alpha, Bravo, … per battalion) |
| `battalionId` | string | ✅ | Parent battalion document ID |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Indexes Required**: Composite: `(battalionId, name)`

**Type Alignment**: `CompanyDocument` in `types/models.ts`

---

### 3d. `series` - Series (Lead, Follow)

**Purpose**: Series org entity; parent is company.

**Document ID Format**: `{companyId}_{name}` (e.g. "West_1st_Alpha_Lead")

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Series name (Lead \| Follow) |
| `companyId` | string | ✅ | Parent company document ID |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Indexes Required**: Composite: `(companyId, name)`

**Type Alignment**: `SeriesDocument` in `types/models.ts`

---

### 4. `emergencyContacts` - Emergency Contact Information

**Purpose**: Stores emergency contact information for recruits.

**Document ID Format**: `{contactId}` (auto-generated UUID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contactId` | string | ✅ | Unique contact identifier |
| `recruitId` | string | ✅ | Reference to recruit (document ID in `recruits` collection) |
| `contactName` | string | ✅ | Contact's full name |
| `relationship` | string | ✅ | Relationship to recruit (e.g., "Parent", "Spouse", "Guardian") |
| `phoneNumber` | string | ✅ | Primary phone number |
| `email` | string | ❌ | Email address |
| `address` | map | ❌ | Address information (street, city, state, zip) |
| `encryptedData` | map | ❌ | Encrypted sensitive data |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Relationships**: 
- References `recruits` collection via `recruitId` field
- Referenced by `recruits` collection via `emergencyContactIds` array

**Indexes Required**:
- Single-field: `recruitId`, `createdAt`
- Composite: `(recruitId, createdAt)`

**Type Alignment**: `EmergencyContact` in `types/models.ts`

---

### 5. `userProfiles` - User Account Profiles

**Purpose**: Stores extended user profile information for authenticated users.

**Document ID Format**: `{userId}` (Firebase Auth UID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | Firebase Auth UID (used as document ID) |
| `email` | string | ✅ | Email address |
| `phoneNumber` | string | ✅ | Phone number |
| `firstName` | string | ✅ | First name |
| `lastName` | string | ✅ | Last name |
| `rank` | string | ✅ | USMC rank |
| `displayName` | string | ✅ | Display name (Format: `[Rank] [Last Name]`) |
| `role` | string | ❌ | User role (Drill Instructor, Senior Drill Instructor, etc.) |
| `regiment` | string | ❌ | Organizational assignment - Regiment |
| `battalion` | string | ❌ | Organizational assignment - Battalion |
| `company` | string | ❌ | Organizational assignment - Company |
| `series` | string | ❌ | Organizational assignment - Series |
| `platoon` | string | ❌ | Organizational assignment - Platoon |
| `profilePictureUrl` | string | ❌ | Profile picture URL (Firebase Storage) |
| `companyLogoUrl` | string | ❌ | Company logo URL (Firebase Storage) |
| `battalionLogoUrl` | string | ❌ | Battalion logo URL (Firebase Storage) |
| `profileCompletion` | number | ❌ | Profile completion percentage (0-100) |
| `preferences` | map | ❌ | User preferences |
| `privacyPolicyAccepted` | boolean | ✅ | Privacy policy acceptance status |
| `privacyPolicyVersion` | string | ❌ | Privacy policy version accepted |
| `privacyPolicyAcceptedAt` | timestamp | ❌ | Privacy policy acceptance timestamp |
| `termsOfServiceAccepted` | boolean | ✅ | Terms of service acceptance status |
| `termsOfServiceVersion` | string | ❌ | Terms of service version accepted |
| `termsOfServiceAcceptedAt` | timestamp | ❌ | Terms of service acceptance timestamp |
| `idmeVerified` | boolean | ❌ | id.me verification status (future) |
| `idmeUuid` | string | ❌ | id.me user UUID (future) |
| `encryptedData` | map | ❌ | Encrypted sensitive data |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollections**: None

**Indexes Required**:
- Single-field: `role`, `battalion`, `company`, `platoon`, `regiment`, `email`, `createdAt`
- Composite: `(role, battalion)`, `(battalion, company)`, `(role, createdAt)`

**Type Alignment**: `UserProfileDocument` in `types/models.ts`

---

### 6. `conversations` - Human-to-Human Messaging

**Purpose**: Stores conversation threads between users (adapted from AIChatModel).

**Document ID Format**: `{conversationId}` (auto-generated UUID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | string | ✅ | Unique conversation identifier |
| `participants` | array[string] | ✅ | Array of user IDs (participants in conversation) |
| `lastMessage` | map | ❌ | Last message details (content, senderId, timestamp) |
| `lastMessageAt` | timestamp | ❌ | Timestamp of last message |
| `encrypted` | boolean | ✅ | Whether conversation is encrypted |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollection**: `messages`
- **Document ID Format**: `{messageId}` (auto-generated UUID)
- **Field Structure**:
  - `messageId` (string, required) - Unique message identifier
  - `senderId` (string, required) - User ID of sender
  - `content` (string, required) - Encrypted message content
  - `attachments` (array) - Attachment URLs
  - `encrypted` (boolean, required) - Whether message is encrypted
  - `createdAt` (timestamp, required) - Timestamp when message was created
  - `updatedAt` (timestamp) - Timestamp when message was last updated

**Indexes Required**:
- Single-field: `lastMessageAt`, `createdAt`
- Composite: `(participants, lastMessageAt)`, `(lastMessageAt, createdAt)`

**Type Alignment**: `Conversation` and `Message` in `types/models.ts`

---

### 7. `adminLogs` - Administrative Action Logs

**Purpose**: Stores immutable administrative action logs for audit purposes.

**Document ID Format**: `{logId}` (auto-generated UUID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `logId` | string | ✅ | Unique log entry identifier |
| `userId` | string | ✅ | User ID who performed the action |
| `action` | string | ✅ | Action type (CREATE, UPDATE, DELETE, etc.) |
| `resourceType` | string | ❌ | Resource type affected (recruit, countCard, etc.) |
| `resourceId` | string | ❌ | Resource ID affected |
| `details` | map | ❌ | Action details (before/after values, etc.) |
| `timestamp` | timestamp | ✅ | Timestamp when action occurred |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `createdBy` | string | ✅ | System identifier (always "system") |

**Note**: This collection is immutable - documents cannot be updated or deleted.

**Subcollections**: None

**Indexes Required**:
- Single-field: `userId`, `action`, `resourceType`, `timestamp`
- Composite: `(userId, timestamp)`, `(action, timestamp)`, `(resourceType, timestamp)`

**Type Alignment**: `AdminLogEntry` in `types/models.ts`

---

### 8. `encryptionKeys` - User Encryption Keys

**Purpose**: Stores encrypted encryption keys for user data encryption.

**Document ID Format**: `{userId}` (Firebase Auth UID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | Firebase Auth UID (used as document ID) |
| `encryptedKey` | string | ✅ | Encrypted encryption key |
| `keyVersion` | number | ✅ | Key version number |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |

**Subcollections**: None

**Security Note**: This collection contains sensitive encryption keys. Access should be restricted to the user's own keys only.

**Indexes Required**:
- Single-field: `userId`, `keyVersion`

**Type Alignment**: `EncryptionKey` in `types/models.ts`

---

### 9. `encryptionConfig` - Encryption Configuration

**Purpose**: Stores encryption configuration per user.

**Document ID Format**: `{userId}` (Firebase Auth UID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | Firebase Auth UID (used as document ID) |
| `algorithm` | string | ✅ | Encryption algorithm (e.g., "XChaCha20-Poly1305") |
| `keyRotationEnabled` | boolean | ❌ | Whether key rotation is enabled |
| `lastKeyRotation` | timestamp | ❌ | Timestamp of last key rotation |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |

**Subcollections**: None

**Security Note**: This collection contains encryption configuration. Access should be restricted to the user's own config only.

**Indexes Required**:
- Single-field: `userId`

**Type Alignment**: `EncryptionConfig` in `types/models.ts`

---

### 10. `incidentAlerts` - Mass Incident Alert Records (Sprint 18)

**Purpose**: Stores mass incident alert records for chain of command notification.

**Document ID Format**: `{alertId}` (auto-generated UUID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `alertId` | string | ✅ | Unique alert identifier |
| `initiatorUserId` | string | ✅ | User ID who initiated the alert |
| `battalion` | string | ✅ | Battalion assignment |
| `company` | string | ❌ | Company assignment |
| `platoon` | string | ❌ | Platoon assignment |
| `incidentType` | string | ✅ | Type of incident |
| `description` | string | ✅ | Incident description |
| `severity` | string | ✅ | Severity level (Low, Medium, High, Critical) |
| `location` | string | ❌ | Incident location |
| `status` | string | ✅ | Alert status (Active, Acknowledged, Resolved, Escalated) |
| `workflowState` | string | ✅ | Current workflow level |
| `messageThreadId` | string | ❌ | Reference to message thread |
| `notificationsSent` | array | ❌ | Notification tracking array |
| `encryptedData` | map | ❌ | Encrypted sensitive data |
| `createdAt` | timestamp | ✅ | Timestamp when document was created |
| `updatedAt` | timestamp | ✅ | Timestamp when document was last updated |
| `resolvedAt` | timestamp | ❌ | Timestamp when alert was resolved |
| `createdBy` | string | ✅ | User ID of the user who created the document |
| `updatedBy` | string | ❌ | User ID of the user who last updated the document |

**Subcollection**: `messages` - Alert message flow
- **Document ID Format**: `{messageId}` (auto-generated UUID)
- **Field Structure**: Same as `conversations/{conversationId}/messages`

**Indexes Required**:
- Single-field: `status`, `severity`, `battalion`, `company`, `platoon`, `createdAt`, `workflowState`
- Composite: `(battalion, status, createdAt)`, `(status, createdAt)`, `(severity, createdAt)`, `(workflowState, createdAt)`

**Type Alignment**: `IncidentAlert` in `types/models.ts`

---

### 11. `alertNotifications` - Notification Delivery Tracking (Sprint 18)

**Purpose**: Tracks notification delivery for incident alerts.

**Document ID Format**: `{notificationId}` (auto-generated UUID)

**Field Structure**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notificationId` | string | ✅ | Unique notification identifier |
| `alertId` | string | ✅ | Reference to incident alert (document ID in `incidentAlerts` collection) |
| `recipientUserId` | string | ✅ | User ID of notification recipient |
| `notificationType` | string | ✅ | Notification type (push, email, sms) |
| `sentAt` | timestamp | ✅ | Timestamp when notification was sent |
| `readAt` | timestamp | ❌ | Timestamp when notification was read |
| `acknowledgedAt` | timestamp | ❌ | Timestamp when notification was acknowledged |

**Subcollections**: None

**Relationships**: 
- References `incidentAlerts` collection via `alertId` field
- References `userProfiles` collection via `recipientUserId` field

**Indexes Required**:
- Single-field: `alertId`, `recipientUserId`, `sentAt`, `readAt`
- Composite: `(alertId, sentAt)`, `(recipientUserId, sentAt)`, `(alertId, recipientUserId)`

**Type Alignment**: `AlertNotification` in `types/models.ts`

---

## Collection Relationships

### Relationship Diagram

```
userProfiles (userId)
    │
    ├──> recruits (createdBy, updatedBy)
    ├──> countCards (submittedBy, approvedBy, rejectedBy)
    ├──> conversations (participants[])
    ├──> adminLogs (userId)
    ├──> incidentAlerts (initiatorUserId)
    └──> alertNotifications (recipientUserId)

recruits (recruitId)
    ├──> emergencyContacts (recruitId)
    └──> countCards (via organizational assignment)

platoons (platoonId)
    ├──> recruits (platoon)
    └──> countCards (platoon)

incidentAlerts (alertId)
    └──> alertNotifications (alertId)
    └──> incidentAlerts/{alertId}/messages (subcollection)

conversations (conversationId)
    └──> conversations/{conversationId}/messages (subcollection)
```

### Key Relationships

1. **User Profiles → Recruits**: Users create and manage recruits
2. **User Profiles → Count Cards**: Users submit and approve count cards
3. **Recruits → Emergency Contacts**: One-to-many relationship (recruit can have multiple emergency contacts)
4. **Platoons → Recruits**: Many-to-one relationship (platoon contains multiple recruits)
5. **Platoons → Count Cards**: Many-to-one relationship (platoon has multiple count cards)
6. **Incident Alerts → Alert Notifications**: One-to-many relationship (alert has multiple notifications)
7. **Conversations → Messages**: One-to-many relationship (conversation has multiple messages)

---

## Index Requirements

### Single-Field Indexes

Single-field indexes are automatically created by Firestore when you use a field in a WHERE clause, ORDER BY clause, or array-contains query. No manual configuration needed.

### Composite Indexes

Composite indexes must be explicitly defined in `firestore.indexes.json` and deployed using Firebase CLI.

**Current Composite Indexes** (defined in `firestore.indexes.json`):

1. **Recruits Collection**:
   - `(battalion, company, platoon)` - Organizational hierarchy filtering
   - `(regiment, battalion, company)` - Full hierarchy filtering
   - `(status, createdAt)` - Status-based sorting
   - `(platoon, status)` - Platoon-specific status filtering

2. **Count Cards Collection**:
   - `(status, createdAt)` - Status-based sorting
   - `(battalion, company, status)` - Organizational filtering with status
   - `(workflowState, createdAt)` - Workflow state tracking
   - `(platoon, status, timestamp)` - Platoon-specific queries
   - `(submittedBy, createdAt)` - User-specific history

3. **Platoons Collection**:
   - `(battalion, company, series)` - Organizational hierarchy
   - `(regiment, battalion, company)` - Full hierarchy

4. **User Profiles Collection**:
   - `(role, battalion)` - Role-based organizational queries
   - `(battalion, company)` - Organizational user queries
   - `(role, createdAt)` - Role-based creation tracking

5. **Conversations Collection**:
   - `(participants, lastMessageAt)` - User conversation lists
   - `(lastMessageAt, createdAt)` - Conversation sorting

6. **Admin Logs Collection**:
   - `(userId, timestamp)` - User-specific log queries
   - `(action, timestamp)` - Action-based queries
   - `(resourceType, timestamp)` - Resource type queries

**Deployment**: Indexes are defined in `firestore.indexes.json` but not yet deployed. Deploy using:
```bash
firebase deploy --only firestore:indexes
```

---

## Security Rules Considerations

### Access Control Patterns

1. **User-Specific Data**:
   - `userProfiles`: Users can read/write their own profile
   - `encryptionKeys`: Users can read/write their own keys
   - `encryptionConfig`: Users can read/write their own config

2. **Role-Based Access**:
   - `recruits`: Access based on role and organizational assignment
   - `countCards`: Access based on role and organizational assignment
   - `platoons`: Read access based on organizational assignment, write access for admins only

3. **Organizational Scope**:
   - Users can access data within their organizational scope (regiment, battalion, company, series, platoon)
   - Higher-level roles (Battalion Commander, etc.) can access lower-level data

4. **Immutable Collections**:
   - `adminLogs`: Write-only for system, read access based on role

5. **GDPR Compliance**:
   - Users can delete their own data
   - Admins can delete data within their scope
   - Deletion must be logged in `adminLogs`

### Security Rules Implementation

Security rules will be fully implemented in Sprint 13 (Security & Compliance phase). Current rules in `firestore.rules` are placeholders that deny all access.

**Planned Security Rules Structure**:
- Role-based access control using Firebase custom claims
- Organizational scope validation
- Data validation in rules
- GDPR compliance rules
- Audit logging requirements

---

## Type Alignment

### TypeScript Types

All collections align with TypeScript types defined in `types/models.ts`:

| Collection | TypeScript Type |
|------------|----------------|
| `recruits` | `RecruitProfile` |
| `countCards` | `CountCard` |
| `platoons` | `Platoon` |
| `emergencyContacts` | `EmergencyContact` |
| `userProfiles` | `UserProfileDocument` |
| `conversations` | `Conversation` |
| `conversations/{id}/messages` | `Message` |
| `adminLogs` | `AdminLogEntry` |
| `encryptionKeys` | `EncryptionKey` |
| `encryptionConfig` | `EncryptionConfig` |
| `incidentAlerts` | `IncidentAlert` |
| `alertNotifications` | `AlertNotification` |

### Service Layer Alignment

All collections have corresponding service functions in `lib/services/firestore/`:
- `recruits.ts` - Recruit service
- `countCards.ts` - Count card service
- `organizations.ts` - Platoon/organizational service
- `emergencyContacts.ts` - Emergency contact service
- `userProfiles.ts` - User profile service
- `conversations.ts` - Conversation service
- `adminLogs.ts` - Admin log service
- `logos.ts` - Logo service (for company/battalion logos)

---

## Future Build Collections

The following collections are documented but not yet implemented (placeholders for xAI future build):

### 12. `weaponsAccountability` - Weapons Accountability Records
- Similar structure to `countCards`
- Indexes required: Similar to countCards

### 13. `rcoAccountability` - RCO Accountability Records
- Similar structure to `countCards`
- Indexes required: Similar to countCards

### 14. `importHistory` - Import Operation History
- Tracks import operations for all accountability types
- Indexes required: `(userId, createdAt)`, `(importType, createdAt)`

### 15. `auditLogs` - Comprehensive Audit Log Records
- Permanent preservation for investigations
- Immutable records
- Indexes required: `(userId, timestamp)`, `(action, timestamp)`, `(resourceType, timestamp)`, `(investigationId, timestamp)`

### 16. `investigatorAssignments` - Investigator Role Assignments
- Investigator role assignments for audit log access
- Indexes required: `(investigatorUserId, status)`, `(assignedByUserId, createdAt)`, `(status, expiresAt)`

### 17. `officialLetters` - Official Letter/Document Storage
- Storage for official letters/documents
- Indexes required: `(assignmentId, createdAt)`

### 18. `auditLogAccess` - Audit Log Access Tracking
- Tracks who accessed audit logs and when
- Indexes required: `(investigatorUserId, accessedAt)`, `(auditLogId, accessedAt)`

### 19. `transferBatches` - Receiving custody transfer batches (Sprint 27)

- Pickup week roster, draft → published → in_transit → completed/rejected
- Subcollection: none; recruits reference via `activeTransferBatchId`
- Indexes: `(status, updatedAt)`, `(destinationAssignment.company, status)`

### 20. `recruits/{id}/progressEvents` - Training progress events (Sprint 27)

- PFT, CFT, drill, inspections, hiking, general comments
- Indexes: `(type, recordedAt)` on subcollection

### 21. `recruits/{id}/comments` - Append-only recruit comments (Sprint 27)

- Immutable comment thread per recruit

### 22. `diLeadershipCards` - DI 3x5 / leadership cards (Sprint 27)

- Dual signatures, append-only recommendations

---

## Related Documentation

- [SPRINT-OVERVIEW.md](./SPRINT-OVERVIEW.md) - Full project overview
- [FIRESTORE-SETUP-GUIDE.md](./FIRESTORE-SETUP-GUIDE.md) - Firestore setup and configuration
- [Sprint-5-2026-01-17.md](./Sprint-5-2026-01-17/Sprint-5-2026-01-17.md) - Sprint 5 documentation
- `types/models.ts` - TypeScript type definitions
- `firestore.indexes.json` - Firestore index definitions
- `firestore.rules` - Firestore security rules (placeholder)

---

**Last Updated**: January 17, 2026  
**Maintained By**: CountCard Development Team
