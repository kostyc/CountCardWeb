# Plans

Plans for multi-step or feature work. All plan files are stored in this project so they are easy to find and version with the repo.

## Where to find plans

| Location | Purpose |
|----------|---------|
| **`.cursor/plans/`** (this folder) | Active plans — work in progress. Create new `.plan.md` files here. |
| **`.cursor/plans/completed/`** | Finished plans — moved here with `status: completed` and `completedAt` in frontmatter. |

## File naming

- Use descriptive names: `mobile_phone_usability.plan.md`, `auth_flow_refactor.plan.md`.
- Extension: `.plan.md`

## Continuing from a plan

See `NEXT_STEPS_PROMPT.md` in this folder for how to reference a plan and implement the next steps.

## Reference in chat

- Active: `@.cursor/plans/<name>.plan.md`
- Completed: `@.cursor/plans/completed/<name>.plan.md`
