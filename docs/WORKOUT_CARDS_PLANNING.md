# Workout Cards — Future Planning

Production feature: create workout record cards on **future** dates (`PLANNED`), start them (`IN_PROGRESS`), complete (`COMPLETED`), or skip (`SKIPPED`). Existing history + `workout_logs` flows stay the source of truth for completed/logged work; **stats use COMPLETED logs only**.

## 1. DB Migration

`database/migrations/104_workout_cards_planning.sql`

- Table `workout_cards` (`status`, `scheduled_date`, sets payload, `display_order`, FKs)
- Table `workout_card_templates`
- Indexes on `(user_id, scheduled_date, status)`, scope+date, status+date

Applied automatically on Render boot via `AUTO_MIGRATE_ON_BOOT`.

## 2. API (`/api/v1/workout-cards`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | List cards (date/status filters) |
| POST | `/` | Create (future → default `PLANNED`) |
| PATCH | `/:id` | Edit plan fields |
| PATCH | `/:id/status` | Status transitions |
| PATCH | `/:id/move-date` | Reschedule |
| POST | `/:id/copy` | Copy to another date |
| DELETE | `/:id` | Delete own card |
| GET | `/missed` | Past `PLANNED` |
| POST | `/:id/resolve-missed` | move_today / move_date / delete / dismiss |
| GET | `/stats` | Plan vs complete rates |
| GET | `/calendar-summary` | Per-day counts for calendar dots |
| GET/POST/DELETE | `/templates`… | Save / list / delete / apply templates |

Also: existing `PUT /workout-logs` unchanged for real logging.

## 3. Frontend files (high level)

- `frontend/src/api/workout-card.api.ts`
- `HistoryListPanel` / `HistoryRecordCard` / `HistoryDateCalendar` — merge plans, badges, start/copy/move, calendar dots
- `HomePlannedWorkoutCard` — today’s planned strip
- Machine detail / recommend result — `?planDate=` create planned card
- i18n `machines.history.plan*`

## 4. Backend files

- `repositories/workout-card.repository.ts`
- `services/workout-card.service.ts`
- `controllers/workout-card.controller.ts`
- `routes/workout-card.routes.ts`
- `jobs/workout-card-reminder.job.ts` (hourly inbox `push_schedule` for today’s PLANNED)

## 5. Status flow

```
create (future) → PLANNED
create (today/past, default) → COMPLETED
PLANNED --[운동 시작]--> IN_PROGRESS --[기록 저장/완료]--> COMPLETED
PLANNED|IN_PROGRESS --[무시/건너뜀]--> SKIPPED
PLANNED (past) --[미완료 배너]--> move_today | move_date | delete | SKIPPED
```

`COMPLETED` upserts `workout_logs` so lifted volume / insights keep using logs only.

## 6. Test checklist

- [ ] Create card on future date → blue 예정 badge
- [ ] 운동 시작 → 진행중; edit sets/order while planned/in progress
- [ ] Complete via status or log save → 완료; appears in stats as completed
- [ ] Copy card to another future date
- [ ] Move card date; unique conflict returns 409
- [ ] Day delete still works for logged history
- [ ] Calendar shows dots on planned days; future month selectable
- [ ] Home shows today planned card when count > 0
- [ ] Missed banner actions work
- [ ] Template save + apply on a date
- [ ] PLANNED excluded from lifted volume totals
- [ ] Other users cannot mutate cards (401/403)

## 7. Performance

- Scoped indexes on `scheduled_date` + `status` + member/user
- Calendar summary aggregated in SQL
- Records still loads history/logs; cards fetched in parallel with staleTime

## 8. Future routines

`workout_cards.scheduled_date` + templates payload are enough to hang:

- Weekly recurrence job inserting PLANNED rows
- “Every Monday” templates
- Auto-generate from last week’s COMPLETED cards

No schema rewrite required for those extensions.
