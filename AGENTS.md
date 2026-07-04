# CountCard Web Application

## Project Overview

CountCard is a web-based Marine Corps Drill Instructor accountability application for tracking and managing recruits. The application is built with Next.js, Firebase (Firestore), and implements end-to-end encryption with GDPR compliance.

## Technology Stack

- **Monorepo**: npm workspaces — `apps/web` (Next.js 16), `apps/expo` (Expo SDK 57 + Expo Router), `packages/*`, `functions/`
- **Language**: TypeScript
- **Database**: Firebase Firestore (project: `countcard-94c5b`)
- **Authentication**: Firebase Authentication (multi-provider)
- **Encryption**: `@countcard/encryption` — sodium-plus (web), native adapter (iOS/Android)
- **Styling**: Tailwind CSS 4+ (web), React Native StyleSheet / NativeWind (Expo)
- **Validation**: Zod (`@countcard/core`)

## Core Principles

### Planning & Design
- **Mobile in mind**: Always plan and design with mobile devices in mind. Many users will use phones; assume mobile is a primary context for layout, touch targets, and flows. Consider narrow viewports (e.g. 320px–390px) and 44px minimum touch targets from the start—not as an afterthought.

### Security & Compliance
- **GDPR Compliance**: All user data must be encrypted, exportable, and deletable
- **End-to-End Encryption**: All sensitive recruit data must be encrypted client-side before storage
- **PII Protection**: Personal Identifiable Information must be masked in UI by default
- **Secure Logging**: Never log PII, user IDs, or sensitive data
- **Input Validation**: All API inputs must be validated with Zod schemas
- **Rate Limiting**: Implement rate limits on all API endpoints (admins exempt)
- **CORS**: Restrict to specific origins (no wildcards in production)

### Authentication & Authorization
- **Multi-Provider Auth**: Support Google, Apple, Email/Password, Phone
- **Role-Based Access**: 
  - Drill Instructors (admin role)
  - Recruits (standard user role)
  - Super Admins (system administrators)
- **Custom Claims**: Use Firebase custom claims for role management
- **Server-Side Verification**: All API routes must verify authentication tokens server-side

### Data Models
- **Recruits**: Personal information, rank (E-5 through E-9, O-1 through O-6), status, platoon/squad assignment
- **Count Cards**: Accountability records with timestamps, location, status
- **Emergency Contacts**: Emergency contact information for recruits
- **Profile Data**: Extended recruit profiles with all relevant information

### Firebase Configuration
- **Project ID**: `countcard-94c5b`
- **Database Name**: `CountCard`
- **Collections**: `recruits`, `countCards`, `platoons`, `emergencyContacts`, `userProfiles`, `conversations`, `adminLogs`, `encryptionKeys`, `encryptionConfig`

### Encryption Requirements
- **Client-Side Encryption**: Use sodium-plus for XChaCha20-Poly1305 encryption
- **Key Management**: Each user has their own encryption keys
- **Key Recovery**: Implement recovery code system for key backup
- **Data Export**: Encrypted data must be exportable in GDPR-compliant format
- **Data Deletion**: Implement secure data deletion with confirmation workflow

## Project Rules

Detailed project-specific rules are located in `.cursor/rules/` directory:

- @engineering-workflow.mdc - Task execution procedure (always applied)
- @cursor-capabilities.mdc - Hooks, MCP, plugins, Cursor settings (always applied)
- @code-quality.mdc - Code quality standards and conventions
- @api-design.mdc - API design standards and best practices
- @ui-ux-guidelines.mdc - UI/UX best practices and design system references
- @debug-logging.mdc - Debug logging system usage
- @documentation-standards.mdc - Documentation requirements and standards
- @test-tracking.mdc - Test tracking procedures and status updates

## Development Workflow

- **Plans**: All plans live in this repo. Create and save plan files in the project only:
  - **Active plans**: `.cursor/plans/<name>.plan.md` — create plans here so they are easy to find and version with the repo.
  - **Completed plans**: `.cursor/plans/completed/<name>.plan.md` — move here when done; set frontmatter `status: completed` and `completedAt: 'YYYY-MM-DD'`.
  - Use `.cursor/plans/NEXT_STEPS_PROMPT.md` to continue from a plan; see `.cursor/plans/README.md` for folder structure.
- **Sprint Management**: Each sprint has its own folder in `sprints/` directory
- **Sprint Naming**: `Sprint-<Number>-<Date>.md` (e.g., `Sprint-1-2025-01-15.md`)
- **Completed Sprints**: Move to `sprints/Archive/` when completed
- **Code Reviews**: All code must be reviewed before merging
- **Testing**: Manual testing required for all features

## Response Format

- **No detailed summaries**: Do not provide lengthy summary structures after completing tasks
- **Concise responses**: Simply state the file to review and the next step
- **Direct communication**: Focus on actionable information only

## Notes

- This is a production application handling sensitive military personnel data
- Security and compliance are paramount
- All changes must be reviewed for security implications
- Follow Marine Corps regulations and guidelines for data handling
- Maintain audit logs for all administrative actions
- Documentation is a critical part of code quality and must be maintained alongside code
