# Sprint: MCRD San Diego COUNT CARD (Depot Order 1513.6)

## Policy references

- **MCO 1510.32F** — Recruit Training Order (zero-error accountability mandate)
- **Depot Order 1513.6** — RTR West SOP; count card form `MCRD 1513/6 (09-14)`
- **Depot Order 6200.1** — Heat injury / hydration (supplementary tracking)

## Scope

Mobile-first yellow grid count card (11 columns, 6 platoon rows) with company-level Training Day (F-1 always Friday).

## Workflow states (MCRD grid)

```
draft → submitted (DI) → under_review (SDI) → approved (CDI) → consolidated (1stSgt/Series) → final_approval (BSM/Co XO/CO)
         ↑________________________ reject _________________________|
```

## Manual test checklist

- [ ] Company member sets F-1 Friday on `company/training-day`
- [ ] T-DAY appears read-only on new grid count card
- [ ] Compact view fits iPhone SE width without horizontal scroll
- [ ] Expand full grid shows all 11 columns with sticky PLT
- [ ] TOTAL auto-calculates (BR+LD+SB+DENT+GG+OTH)
- [ ] Save draft / submit workflow
- [ ] Copy to clipboard exports grid text
