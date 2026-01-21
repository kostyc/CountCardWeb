# Cursor Indexing Best Practices for Multi-Platform Projects

## Overview

This guide explains how to configure Cursor indexing for optimal performance when working with multiple platforms (Web, Android, iOS) in the same development environment.

## Current Setup

- **Web Project**: CountCardWeb (Next.js/TypeScript)
- **Android Projects**: FITREP_RS_ANDROID (Kotlin)
- **iOS Projects**: FITREP_RS_V3.2.x (Swift)

## How `.cursorignore` Works

The `.cursorignore` file tells Cursor which files to exclude from semantic indexing. This:
- **Improves performance** by reducing the number of files indexed
- **Reduces noise** by excluding irrelevant platform-specific code
- **Speeds up searches** by focusing on relevant files
- **Lowers costs** by reducing token usage in AI context

## Platform-Specific Prompts

Use these prompts in your Android and iOS projects to set up their `.cursorignore` files.

---

## Prompt for Android Project

Copy and paste this into Cursor when working on your Android project:

```
Create a .cursorignore file for this Android/Kotlin project. Exclude:
- Build outputs (/build/, /.gradle/, /app/build/)
- Dependencies (node_modules, .next, iOS files)
- Platform-specific files from web (Next.js, React, TypeScript web files)
- Platform-specific files from iOS (Swift, Xcode projects)
- Android build artifacts (*.apk, *.aab, local.properties)
- Include patterns for Kotlin, Java, Gradle files that should be indexed
```

---

## Prompt for iOS/Apple Project

Copy and paste this into Cursor when working on your iOS/Swift project:

```
Create a .cursorignore file for this iOS/Swift project. Exclude:
- Build outputs (/build/, /DerivedData/, xcuserdata)
- Dependencies (node_modules, .next, Android files)
- Platform-specific files from web (Next.js, React, TypeScript web files)
- Platform-specific files from Android (Kotlin, Java, Gradle files)
- Xcode artifacts (*.xcuserstate, Pods, Swift modules)
- Include patterns for Swift, Objective-C files that should be indexed
```

---

## Best Practices

### 1. Platform Isolation
Each platform project should have its own `.cursorignore` that excludes files from other platforms.

### 2. Shared Code Handling
If you share code between platforms:
- **Include** shared business logic, models, and utilities
- **Exclude** platform-specific implementations
- Document shared dependencies in `.cursorrules`

### 3. Build Artifacts
Always exclude:
- Build outputs (`/build/`, `/.next/`, `/DerivedData/`)
- Dependencies (`/node_modules/`, `/Pods/`, `/.gradle/`)
- Generated files (`*.tsbuildinfo`, `*.swiftmodule`)

### 4. Workspace Strategy
- **Recommended**: Open each platform as a separate Cursor workspace
- **Alternative**: Use a monorepo with platform-specific folders and comprehensive `.cursorignore`

### 5. Verification
After creating `.cursorignore`:
- Check that Cursor is indexing the right files
- Verify searches return relevant results
- Confirm AI suggestions are platform-appropriate

## File Patterns Reference

### Web (Next.js/React/TypeScript)
**Include**: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.css`, `*.json` (config)
**Exclude**: `/.next/`, `/node_modules/`, `*.swift`, `*.kt`, `*.java`

### Android (Kotlin/Java)
**Include**: `*.kt`, `*.java`, `*.xml`, `*.gradle`, `*.gradle.kts`
**Exclude**: `/build/`, `/.gradle/`, `*.swift`, `*.tsx`, `/.next/`

### iOS (Swift/Objective-C)
**Include**: `*.swift`, `*.m`, `*.h`, `*.mm`, `*.xcodeproj/`, `*.xcworkspace/`
**Exclude**: `/DerivedData/`, `/Pods/`, `*.kt`, `*.java`, `/.next/`

## Troubleshooting

### Cursor is indexing too many files
- Check `.cursorignore` syntax (similar to `.gitignore`)
- Verify patterns match your file structure
- Restart Cursor to reload ignore rules

### Missing relevant files in search
- Review `.cursorignore` for overly broad patterns
- Use `!` prefix to negate exclusions if needed
- Check file extensions aren't accidentally excluded

### Slow indexing performance
- Ensure build outputs are excluded
- Exclude large dependency directories
- Consider excluding test files if not needed for context

## Additional Resources

- [Cursor Documentation](https://cursor.sh/docs)
- [Gitignore Pattern Reference](https://git-scm.com/docs/gitignore)
