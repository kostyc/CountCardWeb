# User Rules Update Recommendations

## Summary

The current User Rules contain Swift/iOS-specific content that does not apply to this web-based Next.js project. The following changes are recommended.

## Recommended User Rules (Updated)

### Keep These Rules (Apply to All Projects)

```markdown
# User Rules (Global - applies to all projects)

## Sprint Management
Any sprint that is created will have its own folder to store the sprint itself and all relevant .md files, scripts, etc.
```

**Note**: The Engineering Workflow has been moved to Project Rules (`.cursor/rules/ENGINEERING-WORKFLOW.md`) so it applies only to this project, not globally.

## Remove From User Rules (iOS/Swift Specific)

**REMOVE THIS ENTIRE SECTION** - It only applies to iOS/Swift projects, not web projects:

```markdown
All Swift packages (Core, Models, Services, Theme) are located in the **parent directory** of this project, not within the project directory itself.

- **Project Root**: `/Users/daddymac/Documents/App Development/FITREP_RS_V3.1.0_Build102/`
- **Package Parent Directory**: `/Users/daddymac/Documents/App Development/`
- **Package Paths** (relative to project root):
  - `../Core`
  - `../Models`
  - `../Services`
  - `../Theme`

### When Working with Packages:
1. **Always search for package files in the parent directory**, not in the project's local directories
2. **When modifying package code**, edit files in `/Users/daddymac/Documents/App Development/{PackageName}/`
3. **Xcode project references** use `XCLocalSwiftPackageReference` with relative paths (`../PackageName`)
4. **Do not create or modify packages within the project directory** - they must be in the parent directory
```

## Action Required

1. **Open Cursor Settings** → **Rules** (or User Rules section)
2. **Remove** the Swift packages section (shown above)
3. **Remove** the Engineering Workflow section (it's now in Project Rules: `.cursor/rules/ENGINEERING-WORKFLOW.md`)
4. **Keep** only the Sprint Management section
5. **Save** the updated User Rules

## Notes

- User Rules apply globally to all projects
- Project-specific rules are now in `.cursor/rules/` directory (Project Rules)
- Engineering Workflow is now a Project Rule (applies only to this project)
- Swift package rules should only exist as Project Rules for iOS/Swift projects (e.g., FITREP projects)

## Engineering Workflow Location

The full engineering workflow procedure has been moved to:
- **Project Rules**: `.cursor/rules/ENGINEERING-WORKFLOW.md`

This ensures the detailed procedure applies only to this project, not globally to all your projects.
