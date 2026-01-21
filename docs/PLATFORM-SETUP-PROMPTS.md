# Platform Setup Prompts for Cursor Indexing

Use these prompts in Cursor when setting up `.cursorignore` files for your Android and iOS projects.

---

## Prompt for Android Project

Copy and paste this into Cursor when working on your Android/Kotlin project (e.g., `FITREP_RS_ANDROID`):

```
Create a .cursorignore file for this Android/Kotlin project to optimize Cursor indexing. 

The file should exclude:
- Build outputs: /build/, /.gradle/, /app/build/, /app/.cxx/
- Dependencies: node_modules/, .next/, Pods/, DerivedData/
- Platform-specific files from web projects: *.tsx, *.jsx, .next/, node_modules/, *.ts (except if used in Android)
- Platform-specific files from iOS: *.swift, *.m, *.h, *.mm, *.xcodeproj/, *.xcworkspace/, ios/, DerivedData/, *.pbxproj, *.plist
- Android build artifacts: *.apk, *.aab, local.properties, proguard/, mapping.txt
- Generated files: R.java, BuildConfig.java, *.class files in build directories
- IDE files: .idea/, .vscode/, *.iml (except project-level)
- Logs and temporary files: *.log, *.tmp, .DS_Store

The file should INCLUDE (not exclude):
- Kotlin source files: *.kt
- Java source files: *.java
- Android resources: *.xml, *.png, *.jpg (in res/)
- Gradle files: *.gradle, *.gradle.kts, build.gradle, settings.gradle
- Android manifest: AndroidManifest.xml
- ProGuard rules: proguard-rules.pro (if in source)

Format the file with clear sections and comments explaining each exclusion category.
```

---

## Prompt for iOS/Apple Project

Copy and paste this into Cursor when working on your iOS/Swift project (e.g., `FITREP_RS_V3.2.6_Build109`):

```
Create a .cursorignore file for this iOS/Swift project to optimize Cursor indexing.

The file should exclude:
- Build outputs: /build/, /DerivedData/, *.xcuserstate, *.xcuserdatad/, xcuserdata/
- Dependencies: node_modules/, .next/, Pods/, Podfile.lock, .gradle/
- Platform-specific files from web projects: *.tsx, *.jsx, .next/, node_modules/, *.ts (except if used in iOS)
- Platform-specific files from Android: *.kt, *.java, *.gradle, *.gradle.kts, android/, gradle/, *.apk, *.aab
- Xcode artifacts: *.xcworkspace/xcuserdata/, *.xcodeproj/xcuserdata/, *.xcarchive
- Swift build artifacts: *.swiftmodule, *.pcm, *.o, *.dSYM (in build directories)
- CocoaPods: Pods/, Podfile.lock (but include Podfile for reference)
- Generated files: *.generated.swift (if auto-generated), build artifacts
- IDE files: .vscode/, .idea/, *.swp, *.swo
- Logs and temporary files: *.log, *.tmp, .DS_Store

The file should INCLUDE (not exclude):
- Swift source files: *.swift
- Objective-C files: *.m, *.h, *.mm
- Xcode project files: *.xcodeproj/, *.xcworkspace/ (project structure, not user data)
- Info.plist and configuration: *.plist (project configs)
- Storyboards and XIBs: *.storyboard, *.xib (UI definitions)
- Asset catalogs: *.xcassets/
- Swift Package Manager: Package.swift, Packages/ (if using SPM)

Format the file with clear sections and comments explaining each exclusion category.
```

---

## Usage Instructions

1. **Open your Android or iOS project** in Cursor
2. **Copy the appropriate prompt** from above
3. **Paste it into Cursor's chat** and send
4. **Review the generated `.cursorignore` file** to ensure it matches your project structure
5. **Restart Cursor** to apply the new indexing rules

## Verification

After creating the `.cursorignore` file:

1. Check that Cursor is indexing the right files:
   - Open Cursor's file search (Cmd+P)
   - Search for platform-specific files (e.g., `*.kt` in Android, `*.swift` in iOS)
   - Verify they appear in search results

2. Test semantic search:
   - Use Cursor's code search to find functions/classes
   - Verify results are relevant to the current platform

3. Check AI context:
   - Ask Cursor about your codebase
   - Verify suggestions are platform-appropriate

## Notes

- `.cursorignore` uses the same pattern syntax as `.gitignore`
- Patterns are relative to the project root
- Use `!` prefix to negate exclusions if needed
- Restart Cursor after creating/modifying `.cursorignore` to apply changes
