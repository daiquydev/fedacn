# PLAN: Strava Manual Sync & Config Fix

## 1. Goal Description
The objective is to implement "Option A" from our brainstorm, replacing the automatic webhook functionality with a manual, strict "PULL" mechanism for Strava. Additionally, we need to fix the `client_id=undefined` environment variable issue by centralizing Strava credentials into the app's `config.ts` system.

## 2. Analysis & Constraints
- **Config Bug Fix:** Currently, `dotenv.config()` might not behave correctly if instantiated out of order. We must migrate `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, etc., to `src/constants/config.ts` and use `envConfig...`.
- **Database Schema Updates:**
  - `SportEvent`: Needs a field `requireStrava` (boolean) to lock progress syncing solely to Strava.
  - `SportEventProgress`: Needs a field `stravaActivityId` (string, unique sparse) to ensure an activity fetched from Strava is completely un-duplicatable and isn't stacked twice.
- **Data Pull Logic:** The user will click a "Sync" button passing the `eventId`. The backend will fetch the event's `startDate` and `endDate`. It will then call the Strava API `/athlete/activities?after={start}&before={end}`, filter out activities already existing in `SportEventProgress` by `stravaActivityId`, and calculate new distance to update progress.

## 3. Project Plan (Tasks)

### Phase 1: Fixing Environment Constants
- [ ] **Modify `DATN_BE/src/constants/config.ts`**:
  - Export `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`, `STRAVA_VERIFY_TOKEN`.
- [ ] **Update `DATN_BE/src/services/userServices/strava.service.ts`**:
  - Replace `process.env.STRAVA_CLIENT_ID` with `envConfig.STRAVA_CLIENT_ID`.
- [ ] **Test Auth URL Generation**:
  - Prove that `/api/strava/auth` correctly outputs the Strava authorization URL with `client_id={id}` instead of `undefined`.

### Phase 2: Schema Refactoring
- [ ] **Modify `DATN_BE/src/models/schemas/sportEvent.schema.ts`**:
  - Add `requireStrava: { type: Boolean, default: false }`.
- [ ] **Modify `DATN_BE/src/models/schemas/sportEventProgress.schema.ts`**:
  - Add `stravaActivityId: { type: String, default: null }`.
  - Add a sparse index on `stravaActivityId` to quickly find pre-synced duplicates.

### Phase 3: Backend API - Sync Logic
- [ ] **Create Route `POST /api/strava/sync-event/:eventId`** in `strava.routes.ts`.
- [ ] **Create Controller** `syncStravaEventController`.
- [ ] **Build Service `syncActivitiesForEvent` inside `strava.service.ts`**:
  - Verify user is connected to Strava.
  - Refresh Token if needed.
  - Find SportEvent by ID, check if it's currently active.
  - Call Strava API: `GET https://www.strava.com/api/v3/athlete/activities?after={event_startDate_epoch}&page=1&per_page=50`.
  - Filter `activity.type` against event rules (e.g., 'Run', 'Walk', 'Ride').
  - Exclude activities where `stravaActivityId` already exists in `SportEventProgress` for this user and event.
  - Loop map valid activities, push into `SportEventProgress`.
  - Return the summary: `{ syncedCount: 2, totalDistanceAdded: 5, newActivities: [...] }`.

### Phase 4: Frontend "PULL" Button
- [ ] **Update Event Creation UI**:
  - (Admin) Add checkbox toggle `"Yêu cầu dữ liệu GPS từ Strava"` (`requireStrava`) in the Create Event / Edit Event form (`CreateSportEvent.jsx` & `EditSportEvent.jsx`).
- [ ] **Update Event Detail / Progress Tracking UI (`EventDetail.jsx` or similar)**:
  - If `event.requireStrava` is true:
    - Normal manual add form/button should be disabled or hidden.
    - Render a prominent orange `[Tải dữ liệu từ Strava]` button.
    - Attach the `POST -> /api/strava/sync-event/eventId` API call.
    - Map the API response `syncedCount` into a success toast notification: `"Đã đồng bộ thành công X chuyến đi mới!"`.

## 4. Verification Checkpoints
- [ ] User can Auth successfully with ID mapping fixed.
- [ ] Repeatedly clicking "Tải dữ liệu" does not stack distances (No duplicate progress entries).
- [ ] Backend rate respects Strava 15-minute API quota (we can fetch up to 100 requests per 15 minutes seamlessly).
