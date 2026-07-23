# Sprint 28 — Test Matrix

**SOP note**: Checklist labels are placeholders until command provides official medical SOP.

| # | Flow | Route | Pass criteria |
|---|------|-------|---------------|
| 1 | Emergency CTA | Dashboard | Red Emergency control visible; opens create flow |
| 2 | Create medical alert | `/emergency/new` | Default type medical_injury; requires battalion + company; confirm creates alert + tasks |
| 3 | Other types | `/emergency/new` | Heat / missing / security / other spawn their templates; **same company CoC recipients** |
| 4 | Banner | Any tab | Second account **on the notify list** (e.g. same-platoon DI, CDI, series CDR, or company triad) sees red banner; another battalion peer **not** on CoC does **not** |
| 5 | Acknowledge | Banner / detail | Acknowledge removes “needs ack” for that user |
| 6 | Claim task | `/emergency/[id]` | User claims open task; status → claimed |
| 7 | Complete task | `/emergency/[id]` | Claimed task → done |
| 8 | Reassign | `/emergency/[id]` | SDI/CDI+ can reassign claimed task to another user id |
| 9 | Notify battalion | `/emergency/[id]` | Only `company_commander` sees **Notify battalion command**; adds Bn CO / XO / SgtMaj to `notifiedUserIds`; non-CO escalate fails |
| 10 | Resolve | `/emergency/[id]` | SDI/CDI+ resolves; banner clears for listeners |
| 11 | List | `/emergency` | Shows only alerts where current user is in `notifiedUserIds` |

## Auth before rules deploy

```bash
cd /Users/daddymac/Projects/Countcard
gcloud auth login
firebase login --reauth
gcloud auth application-default login
./scripts/verify-countcard-auth.sh
firebase deploy --only firestore:rules,firestore:indexes
```
