# Project Plan: Interactive Strava Sync

## Phase 1: Context & Requirements
- **Goal:** Replace the automatic blind pull of Strava activities with an interactive selection modal.
- **Problem:** Users currently have no control over which activities get synced from Strava, risking the inclusion of irrelevant data (e.g., short walks) into competitive event progress.
- **Solution (Option A):** Implement a two-step sync process using a preview endpoint and a confirmation endpoint, visualized via a Frontend modal.

## Phase 2: Architecture Design

### Backend Changes (`DATN_BE`)
1. **Controller & Routes (`strava.routes.ts`, `strava.controller.ts`):**
   - Add `GET /preview-activities` -> Returns raw activities from Strava for the user (last 7 days by default).
   - Add `POST /import-activities` -> Replaces `/sync-event/:eventId`. Takes `activityIds` as payload.

2. **Service (`strava.service.ts`):**
   - `previewActivities(userId, eventId)`: Exchange tokens, fetch activities from Strava, filter out already synced ones (by checking `SportEventProgressModel` with those IDs), return a pristine list of un-synced activities.
   - `importActivities(userId, eventId, activityIds)`: Fetch specific activities or match from a recent pull, calculate Calories/Distance, and create both `SportEventProgressModel` and `ActivityTrackingModel`.

### Frontend Changes (`DATN_FE`)
1. **API Integration (`userApi.js`):**
   - Implement `previewStravaActivities(eventId)`
   - Implement `importStravaActivities(eventId, activityIds)`

2. **UI Component (`StravaSyncModal.jsx`):**
   - A new modal containing a checklist of activities.
   - Displays Name, Date, Distance, Duration, and estimated Calories.
   - States: `loading`, `empty` (no new activities), `importing`.

3. **Progress Page (`SportEventProgress.jsx`):**
   - Remap the "Đồng bộ Strava" button to `setIsOpenStravaModal(true)` instead of invoking the hardcoded sync.

## Phase 3: Task Breakdown

- [ ] **Task 1: Backend API - Preview Route**
  - Implement parsing and token validation for preview. Check against existing `stravaActivityId` elements in DB to only return "New/Unsynced" activities.
- [ ] **Task 2: Backend API - Import Route**
  - Refactor data insertion logic from previous function to handle an explicit array of Strava IDs.
- [ ] **Task 3: Frontend API Setup**
  - Build Axios bindings in `userApi.js`.
- [ ] **Task 4: UI Modal Construction**
  - Create `StravaSyncModal.jsx` with beautiful Tailwind designs matching the existing admin/user layout.
- [ ] **Task 5: Frontend Wiring**
  - Integrate modal into `SportEventProgress.jsx`, handle query invalidation for charts upon successful import.

## Phase 4: Verification Checklist
- [ ] Run `npm run dev` and test previewing without importing.
- [ ] Verify checking 1 item imports 1 item to both databases.
- [ ] Ensure that a previously imported item no longer appears in the Preview list.
- [ ] Verify Calorie logic fallback calculates accurate kcal values.
