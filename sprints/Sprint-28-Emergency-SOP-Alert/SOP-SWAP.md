# SOP swap path (when official medical SOP arrives)

Placeholder checklist lives in:

`packages/core/src/constants/incidentSopTemplates.ts`

## Steps

1. Replace task `label` / `instructions` / order under `MEDICAL_TASKS` (and other types if provided).
2. Bump `PLACEHOLDER_SOP_VERSION` (or set `sopSource: 'official'` and a new version string).
3. New alerts spawn the updated tasks. Existing open alerts keep their original task docs.
4. Optional follow-up: store templates in Firestore `incidentSopConfig/{incidentType}` so command can update without an app release.

Do **not** treat current placeholder text as official MCRD / depot doctrine until command signs off.
