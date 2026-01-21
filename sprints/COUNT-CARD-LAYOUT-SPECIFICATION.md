# Count Card Layout Specification

## Document Purpose
This document defines the visual layout, structure, and interface design for the Count Card system in the CountCard web application. This specification will guide the implementation of Sprint 6: Count Card System.

## Overview
Count Cards are accountability records created by Drill Instructors to track recruit status. The layout must support the complete workflow from creation through final approval, with role-based views and actions.

---

## Layout Structure

### 1. Count Card Creation/Edit Form (Drill Instructor View)

#### Header Section
```
┌─────────────────────────────────────────────────────────────────┐
│  T-DAY: [____]          COUNT CARD          DATE: [MM/DD/YYYY] │
│                                                                  │
│  SERIES: [Lead Series / Follow Series Dropdown]                │
│  [Company Logo]  [Battalion Logo]                                │
│                                                                  │
│  Organizational Information:                                    │
│  Regiment: [West/East Dropdown]                                 │
│  Battalion: [1st/2nd/3rd/Support Dropdown]                      │
│  Company: [Auto-populated based on Battalion]                   │
│  [Background Color: ○ White  ○ Yellow  ○ Blue  ○ Red]          │
│  (Yellow = 2nd Battalion, Blue = 3rd Battalion, Red = 1st     │
│   Battalion, Support Battalion default = Yellow)              │
└─────────────────────────────────────────────────────────────────┘
```

#### Count Card Grid Section
```
┌─────────────────────────────────────────────────────────────────┐
│  COUNT CARD DATA GRID                                            │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────┐│
│  │ PLT  │ T/S  │ T/P  │ WPN  │ RCO  │ BR   │ LD   │ SB   │ DENT │ GG   │ OTH  │ TOTAL  ││
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼────────┤│
│  │[____]│ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [____] ││
│  │[____]│ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [____] ││
│  │[____]│ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [____] ││
│  │[____]│ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [____] ││
│  │[____]│ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [____] ││
│  │[____]│ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [____] ││
│  │[____]│ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [__] │ [____] ││
│  ├──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴────────┤│
│  │ TOTAL                                                                        │ [____] ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [+ Add Row] Button (adds new platoon row)                     │
│  [Delete Row] Button (removes selected row)                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Field Definitions (Grid Columns)
- **PLT (Platoon)** - 4-digit platoon identifier (e.g., "2001", "2002")
- **T/S (Total Strength)** - Total number of recruits assigned to platoon
- **T/P (Total Present)** - Total number of recruits present
- **WPN (Weapons)** - Number of recruits with weapons
- **RCO (RCO)** - RCO count
- **BR (Bed Rest)** - Number of recruits on bed rest
- **LD (Light Duty)** - Number of recruits on light duty
- **SB (Sick Bay)** - Number of recruits in sick bay
- **DENT (Dental)** - Number of recruits at dental appointment
- **GG (Gear Guard)** - Number of recruits on gear guard
- **OTH (Other)** - Number of recruits with other status (click to add comments)
- **TOTAL** - Calculated field: BR + LD + SB + DENT + GG + OTH

#### Other (OTH) Comments Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Other (OTH) Comments:                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Row 1 (Platoon [____]): [Comments for this row's OTH]      │  │
│  │ Row 2 (Platoon [____]): [Comments for this row's OTH]      │  │
│  │ Row 3 (Platoon [____]): [Comments for this row's OTH]      │  │
│  │ ...                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  (Comments are required when OTH > 0)                            │
└─────────────────────────────────────────────────────────────────┘
```

#### Additional Notes Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Additional Notes:                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Multi-line text area for general notes]                  │  │
│  │                                                            │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Notes & Comments Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Additional Notes:                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Multi-line text area for general notes]                  │  │
│  │                                                            │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Action Buttons (Drill Instructor)
```
┌─────────────────────────────────────────────────────────────────┐
│  [Save Draft]  [Preview]  [Submit to Senior Drill Instructor]  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Count Card Review/Approval View (Senior Drill Instructor)

#### Header (Same as Creation)
```
┌─────────────────────────────────────────────────────────────────┐
│  COUNT CARD REVIEW                                               │
│  Status: [Pending Approval]                                     │
│  Submitted by: [Drill Instructor Name]                          │
│  Submitted on: [Date/Time]                                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Organizational Information (Read-Only)
```
┌─────────────────────────────────────────────────────────────────┐
│  Organizational Information: (Read-Only)                         │
│  Regiment: West  |  Battalion: 2nd  |  Company: Alpha          │
│  Series: Lead Series  |  Platoon: 2001                          │
└─────────────────────────────────────────────────────────────────┘
```

#### Count Card Grid Summary (Read-Only with Expandable Details)
```
┌─────────────────────────────────────────────────────────────────┐
│  Count Card Summary:                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Total Strength: 137  |  Total Present: 133              │  │
│  │ Weapons: 133  |  RCO: 0  |  Total (BR+LD+SB+DENT+GG+OTH): 4│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [View Full Count Card Grid] Button (Expandable)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Expanded count card grid with all platoon rows]         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Review Actions Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Review & Approval:                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Review Comments:                                          │  │
│  │ [Multi-line text area]                                    │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Actions:                                                       │
│  [Approve & Forward]  [Request Changes]  [Reject]              │
│                                                                  │
│  Forward to:                                                    │
│  ☑ Company 1stSgt                                              │
│  ☑ Series Commander                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Count Card Consolidation View (Company 1stSgt / Series Commander)

#### Header
```
┌─────────────────────────────────────────────────────────────────┐
│  COUNT CARD CONSOLIDATION                                       │
│  Status: [Pending Consolidation]                               │
│  Multiple count cards from: [Series/Company Name]               │
└─────────────────────────────────────────────────────────────────┘
```

#### Consolidated Summary View
```
┌─────────────────────────────────────────────────────────────────┐
│  Consolidated Count Card Summary                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Date Range: [Start Date] to [End Date]                   │  │
│  │                                                           │  │
│  │ Count Cards Included: [3]                               │  │
│  │ ┌─────────────────────────────────────────────────────┐ │  │
│  │ │ Platoon 2001: T/S: 45 | T/P: 42 | WPN: 42 | Total: 3│ │  │
│  │ │ Platoon 2002: T/S: 48 | T/P: 47 | WPN: 47 | Total: 1│ │  │
│  │ │ Platoon 2003: T/S: 44 | T/P: 44 | WPN: 44 | Total: 0│ │  │
│  │ └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │ Company/Series Totals:                                   │  │
│  │ T/S: 137  |  T/P: 133  |  WPN: 133  |  Total: 4          │  │
│  │ (Total = BR+LD+SB+DENT+GG+OTH)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Individual Count Card Details (Expandable)
```
┌─────────────────────────────────────────────────────────────────┐
│  [▼] Platoon 2001 - Submitted by DI [Name] on [Date/Time]     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Full count card details when expanded]                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [▼] Platoon 2002 - Submitted by DI [Name] on [Date/Time]     │
│  [▼] Platoon 2003 - Submitted by DI [Name] on [Date/Time]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Consolidation Actions
```
┌─────────────────────────────────────────────────────────────────┐
│  Consolidation Comments:                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Multi-line text area]                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Forward to:                                                    │
│  ☑ Company XO                                                  │
│  ☑ Company Commander                                            │
│  ☑ Battalion SgtMaj                                             │
│                                                                  │
│  [Approve & Forward Consolidated]  [Request Changes]           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Count Card List View (All Roles)

#### Filter & Search Bar
```
┌─────────────────────────────────────────────────────────────────┐
│  [Search...]  [Filter ▼]  [Date Range: From ___ To ___]        │
│                                                                  │
│  Filters:                                                       │
│  Status: [All ▼]  |  Regiment: [All ▼]  |  Battalion: [All ▼]   │
│  Company: [All ▼]  |  Series: [All ▼]  |  Platoon: [____]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Count Card Table
```
┌─────────────────────────────────────────────────────────────────┐
│  Count Cards                                                    │
│  ┌──────┬──────┬──────────┬──────────┬──────────┬──────────┬────────┐│
│  │Date  │T-Day│Series    │Status    │Submitted │Submitted │Actions ││
│  │      │     │          │          │By        │To        │        ││
│  ├──────┼──────┼──────────┼──────────┼──────────┼──────────┼────────┤│
│  │01/15 │ 15  │Lead      │Pending   │DI Smith  │SDI Jones│[View]  ││
│  │01/15 │ 15  │Follow    │Approved  │DI Brown  │SDI Jones│[View]  ││
│  │01/15 │ 15  │Lead      │Consolid. │SDI Jones │1stSgt   │[View]  ││
│  └──────┴──────┴──────────┴──────────┴──────────┴──────────┴────────┘│
│                                                                  │
│  Summary: T/S: 137 | T/P: 133 | WPN: 133 | Total: 4           │
└─────────────────────────────────────────────────────────────────┘
```

#### Status Badges (Color-Coded)
- **Draft** - Gray (not yet submitted)
- **Pending Approval** - Yellow (awaiting review)
- **Approved** - Green (approved, forwarded)
- **Rejected** - Red (rejected, needs changes)
- **Consolidated** - Blue (consolidated, forwarded)
- **Final** - Dark Green (final approval received)

---

### 5. Count Card Detail View (Read-Only for Reviewers)

#### Workflow History Timeline
```
┌─────────────────────────────────────────────────────────────────┐
│  Workflow History:                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ● Created by DI Smith on 01/15/2025 08:00 AM            │  │
│  │   └─ Status: Draft                                       │  │
│  │                                                           │  │
│  │ ● Submitted to SDI Jones on 01/15/2025 08:30 AM         │  │
│  │   └─ Status: Pending Approval                          │  │
│  │                                                           │  │
│  │ ● Approved by SDI Jones on 01/15/2025 09:00 AM         │  │
│  │   └─ Comment: "All accounted for"                        │  │
│  │   └─ Forwarded to: Company 1stSgt, Series Commander    │  │
│  │                                                           │  │
│  │ ● Consolidated by 1stSgt Johnson on 01/15/2025 10:00 AM│  │
│  │   └─ Status: Consolidated                                │  │
│  │   └─ Forwarded to: Company XO, Company Commander,       │  │
│  │                     Battalion SgtMaj                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Field Definitions

### Header Fields
1. **T-DAY (Training Day)** - Training day number (numeric input)
2. **DATE** - Date of the count card (MM/DD/YYYY format)
3. **SERIES** - Lead Series or Follow Series (dropdown)

### Organizational Fields (Required)
1. **Regiment** - West or East (dropdown)
2. **Battalion** - 1st, 2nd, 3rd, or Support (dropdown)
3. **Company** - Auto-populated based on Battalion
4. **Background Color** - User-selectable:
   - **White** - Default for all battalions
   - **Yellow** - 2nd Battalion (default for Support Battalion)
   - **Blue** - 3rd Battalion
   - **Red** - 1st Battalion

### Count Card Grid Fields (Per Row/Platoon)

#### Required Fields
1. **PLT (Platoon)** - 4-digit platoon identifier (e.g., "2001", "2002")
2. **T/S (Total Strength)** - Total number of recruits assigned to platoon (numeric)
3. **T/P (Total Present)** - Total number of recruits present (numeric)
4. **WPN (Weapons)** - Number of recruits with weapons (numeric)
5. **RCO (RCO)** - RCO count (numeric)
6. **BR (Bed Rest)** - Number of recruits on bed rest (numeric)
7. **LD (Light Duty)** - Number of recruits on light duty (numeric)
8. **SB (Sick Bay)** - Number of recruits in sick bay (numeric)
9. **DENT (Dental)** - Number of recruits at dental appointment (numeric)
10. **GG (Gear Guard)** - Number of recruits on gear guard (numeric)
11. **OTH (Other)** - Number of recruits with other status (numeric)
12. **TOTAL** - **Calculated field**: BR + LD + SB + DENT + GG + OTH (auto-calculated, read-only)

#### Optional Fields
1. **OTH Comments** - Comments required when OTH > 0 (multi-line text per row)
2. **Additional Notes** - General notes about the count card (multi-line text area)
3. **Review Comments** - Comments from reviewers (workflow)
4. **GPS Coordinates** - Auto-captured if location services enabled

### Validation Rules
1. **PLT**: Must be exactly 4 digits
2. **T/S**: Must be >= T/P (Total Strength must be greater than or equal to Total Present)
3. **T/P**: Must be <= T/S
4. **TOTAL Calculation**: Must equal BR + LD + SB + DENT + GG + OTH
5. **OTH Comments**: Required when OTH > 0
6. **At least one row**: Must have at least one platoon row with data
7. **Date**: Cannot be in the future
8. **Organizational Hierarchy**: Must be valid (e.g., Alpha Company only in 2nd Battalion)

---

## Visual Design Guidelines

### Count Card Background Colors
- **Default**: White (#FFFFFF)
- **Yellow**: #FFEB3B (2nd Battalion default, Support Battalion default)
- **Blue**: #2196F3 (3rd Battalion)
- **Red**: #F44336 (1st Battalion)
- **User Selection**: Users can change background color via color picker/selector
- **Support Battalion**: Defaults to Yellow but can be changed

### Application Color Scheme (MARPAT Theme)
- **Primary Background**: Dark green/tan (MARPAT digital)
- **Card Container**: White/Yellow/Blue/Red (based on user selection)
- **Header**: Dark green with white text
- **Grid Borders**: Black or dark gray (#000000 or #333333)
- **Grid Header**: Dark background with white text
- **Status Colors** (for workflow badges):
  - Draft: #6B7280 (Gray)
  - Pending: #F59E0B (Yellow/Amber)
  - Approved: #10B981 (Green)
  - Rejected: #EF4444 (Red)
  - Consolidated: #3B82F6 (Blue)
  - Final: #059669 (Dark Green)

### Typography
- **Headers**: Bold, 18-24px, Military-style font
- **Body Text**: 14-16px, Readable sans-serif
- **Labels**: 12-14px, Medium weight
- **Status Badges**: 11-12px, Bold, Uppercase

### Spacing
- **Card Padding**: 24px
- **Section Spacing**: 32px between major sections
- **Field Spacing**: 16px between form fields
- **Table Row Height**: 48px minimum

### Responsive Design
- **Mobile**: Single column, stacked sections
- **Tablet**: Two-column layout for date/time
- **Desktop**: Full multi-column layout
- **Touch Targets**: Minimum 44x44px for mobile

---

## Role-Based View Variations

### Drill Instructor
- **Can**: Create, edit (draft), submit count cards
- **Cannot**: Approve, reject, or consolidate
- **Sees**: Only their own platoon's count cards

### Senior Drill Instructor
- **Can**: Review, approve, reject, forward count cards
- **Cannot**: Create new count cards (unless also DI)
- **Sees**: All count cards in their series

### Company 1stSgt / Series Commander
- **Can**: Consolidate, forward consolidated count cards
- **Sees**: All count cards in their company/series
- **Special View**: Consolidation interface with multiple count cards

### Chief Drill Instructor and Above
- **Can**: View all count cards in their organizational scope
- **Can**: Approve, reject, forward (based on role)
- **Sees**: Consolidated views and individual count cards

---

## Data Validation Rules

1. **T-DAY**: Must be a positive integer
2. **Date**: Cannot be in the future, required field
3. **PLT (Platoon)**: Must be exactly 4 digits, required per row
4. **T/S (Total Strength)**: Must be a non-negative integer, required
5. **T/P (Total Present)**: Must be a non-negative integer, required, must be <= T/S
6. **WPN, RCO, BR, LD, SB, DENT, GG, OTH**: Must be non-negative integers
7. **TOTAL**: Auto-calculated as BR + LD + SB + DENT + GG + OTH (read-only)
8. **OTH Comments**: Required when OTH > 0 for that row
9. **At least one row**: Must have at least one platoon row with valid data
10. **Organizational Hierarchy**: Must be valid (e.g., Alpha Company only in 2nd Battalion)
11. **Background Color**: Must be one of: White, Yellow, Blue, Red
12. **Support Battalion**: Defaults to Yellow but can be changed by user

---

## Accessibility Requirements

1. **WCAG 2.1 AA Compliance**
2. **Keyboard Navigation**: All actions accessible via keyboard
3. **Screen Reader Support**: Proper ARIA labels and roles
4. **Color Contrast**: Minimum 4.5:1 for text
5. **Focus Indicators**: Clear focus states for all interactive elements

---

## Technical Implementation Notes

### Form State Management
- **Draft State**: Auto-save every 30 seconds
- **Validation**: Real-time validation on field blur
- **Error Display**: Inline error messages below fields

### Performance Considerations
- **Grid Rendering**: Optimize for up to 10 platoon rows per count card
- **Auto-calculation**: Real-time calculation of TOTAL column as user types
- **Caching**: Cache organizational structure data
- **Background Color**: Persist user's color selection per count card

### Security
- **Encryption**: All count card data encrypted client-side
- **Audit Trail**: All actions logged with timestamp and user
- **Role Verification**: Server-side role verification for all actions

---

## Approval Workflow

1. **Draft** → Drill Instructor creates and saves
2. **Submitted** → Drill Instructor submits to SDI
3. **Pending Approval** → SDI reviews
4. **Approved** → SDI approves and forwards
5. **Rejected** → SDI rejects, returns to DI for changes
6. **Consolidated** → 1stSgt/Series Commander consolidates
7. **Final** → Forwarded to final approvers

---

## Next Steps

1. **Review this specification** with stakeholders
2. **Create mockups** based on this specification
3. **Get approval** before Sprint 6 implementation
4. **Update Sprint 6** tasks with approved layout details

---

## Revision History

- **Version 1.0** - Initial specification created
- **Version 2.0** - Updated to match physical count card format:
  - Changed from recruit list to grid format
  - Added T-DAY, PLT, T/S, T/P, WPN, RCO, BR, LD, SB, DENT, GG, OTH fields
  - Added TOTAL calculation (BR+LD+SB+DENT+GG+OTH)
  - Added OTH comments field
  - Updated background color options (White, Yellow, Blue, Red)
  - Support Battalion defaults to Yellow
  - Updated field definitions and validation rules
- **Date**: [Current Date]
- **Author**: AI Assistant
- **Status**: Pending Approval
