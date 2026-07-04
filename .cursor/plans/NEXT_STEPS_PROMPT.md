# Next Steps

Use this prompt to continue implementation from a plan.

---

## Prompt for AI Assistant

Review the plan referenced below and implement the next step(s). Update the plan's frontmatter (e.g. `todos` or `status`) as work is completed.

### Active plan

- **Plan file**: (Replace with the plan path, e.g. `@.cursor/plans/<name>_<hash>.plan.md`)
- **Next step**: (Replace with step number or description)

### Example

```
Review @.cursor/plans/my_feature_abc123.plan.md and implement the next unchecked section.
```

### Sprint-driven work

For sprint-driven tasks, you may instead reference the current sprint document:

```
Review @sprints/Sprint-<N>-<Name>/Sprint-<N>-<Name>.md and implement the next item.
```

---

## Plan file format

Create `.plan.md` files in `.cursor/plans/` with:

- **Frontmatter**: `name`, `overview`, optional `todos` (id, content, status), `isProject: false`
- **Body**: Current state, target flow (Mermaid optional), implementation sections, files to add/modify, acceptance criteria

When a plan is complete, move it to `.cursor/plans/completed/` and set `status: completed` and `completedAt: 'YYYY-MM-DD'` in frontmatter. **Then check** whether Firestore indexes or rules (and any other Firebase config) need updates — see @.cursor/rules/engineering-workflow.mdc step 5.
