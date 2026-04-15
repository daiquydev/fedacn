# Project Plan: Outdoor GPS Training (Option C)

## Goal
Implement a new "Outdoor Training" mode directly within the `Training.jsx` page. This allows users to track GPS activities (running, cycling, etc.) outside of specific sport events or challenges, saving them as personal activities.

## 🔴 User Review Required
Please review this implementation plan. Key decisions made:
1. **Database:** We will **reuse** the existing `activity_tracking` collection for personal activities by keeping `eventId` and `challengeId` as `null`. We will add a new `name` field to the schema to identify personal workouts.
2. **Architecture:** We will create a new set of API routes (`/personal-activities`) specifically for managing these standalone activities, to keep the logic decoupled from Sport Events.
3. **Frontend:** We will keep the user in `Training.jsx` to ensure a consistent experience across all training modes.

---

## Proposed Changes

### 1. Database & Backend Schema
We will update the existing `ActivityTracking` schema to accommodate personal activities.

#### [MODIFY] `DATN_BE/src/models/schemas/activityTracking.schema.ts`
- Add a new optional field: `name: { type: String, default: 'Hoạt động cá nhân' }` to allow users to name their personal GPS sessions.

### 2. Backend Routes, Controllers & Services
We need dedicated routes for standalone personal activities that do not depend on `eventId`.

#### [NEW] `DATN_BE/src/services/userServices/personalActivity.services.ts`
- `startActivity`: Initialize a new activity with `eventId: null`, `challengeId: null`, and the provided `name` and `activityType`.
- `updateActivity`: Update GPS route and stats (reuse logic from existing activity service).
- `completeActivity`: Mark status as completed, calculate final calories/distance.
- `discardActivity`: Hard delete or mark as discarded.
- `getUserActivities`: Fetch history of personal activities.

#### [NEW] `DATN_BE/src/controllers/userControllers/personalActivity.controller.ts`
- Wrapper controllers for the new personal activity services.

#### [NEW] `DATN_BE/src/routes/userRoutes/personalActivity.routes.ts`
- `POST /` - Start activity
- `GET /` - Get history
- `PUT /:id` - Update (auto-save GPS)
- `POST /:id/complete` - Complete
- `POST /:id/discard` - Discard

#### [MODIFY] `DATN_BE/src/routes/userRoutes/index.ts`
- Mount the new `personalActivityRouter` at `/personal-activities`.

---

### 3. Frontend APIs & Hooks

#### [NEW] `DATN_FE/src/apis/personalActivityApi.js`
- Expose async functions mapping to the new `/personal-activities` endpoints:
  - `startPersonalActivity(data)`
  - `updatePersonalActivity(id, data)`
  - `completePersonalActivity(id, data)`
  - `discardPersonalActivity(id)`

#### [MODIFY] `DATN_FE/src/hooks/useActivityTracking.js` (Minor if needed)
- Ensure the hook works seamlessly without an `eventId`. (It already operates independently in state, so minimal or no changes expected).

---

### 4. Frontend UI Components

#### [NEW] `DATN_FE/src/pages/Training/components/OutdoorSetupStep.jsx`
- **Form UI:** 
  - Input for "Tên bài tập" (e.g., "Chạy bộ sáng chủ nhật").
  - Dropdown for "Thể loại" (Fetched dynamically via `sportCategoryApi.getAll()`).
  - Input for "Quãng đường mục tiêu (km)" (Optional).
- **Actions:** Button to start GPS tracking.

#### [NEW] `DATN_FE/src/pages/Training/components/OutdoorTrackingStep.jsx`
- **Map Integration:** Instantiate Goong Map.
- **HUD Interface:** Reuse the glassmorphism HUD design from `ActivityTracking.jsx` (Speed, Calories, Time, Progress Bar).
- **Integration with Hook:** Uses `useActivityTracking` to manage state.
- **Auto-save:** Polls `updatePersonalActivity` every 30 seconds.
- **Completion Flow:** Modals for discarding or completing the session, navigating back to `/training/my-Trainings` upon completion.

#### [MODIFY] `DATN_FE/src/pages/Training/Training.jsx`
- Include the 4th option ("Hoạt động ngoài trời") in the `ModeSelection` grid.
- Add new state variables for the outdoor flow: 
  - `mode === 'outdoor'`
  - `outdoorStep` (`'setup'` or `'tracking'`)
  - `outdoorTarget` configuration.
- Render `OutdoorSetupStep` or `OutdoorTrackingStep` based on the internal state.

---

## Open Questions

1. **Target Unit:** Do you want the target goal to strictly be Distance (km), or should the user be able to choose between tracking Time (minutes) vs Distance (km)? 
   *(Current assumption: strictly Distance/km like the user request mentioned).*
2. **History Display:** Currently `/training/my-Trainings` shows `WorkoutSession` history. Because we are using `activity_tracking` to store GPS data, the "My Trainings" history page will need to fetch from BOTH `WorkoutSession` and `PersonalActivity` (and merge them), OR we can add a new Tab specifically for "Hoạt động ngoài trời". How would you prefer this to be displayed on the history list?

---

## Verification Plan

### Automated Tests
- N/A - Manual verification required for GPS maps.

### Manual Verification
1. Open the `/training` page, verify the 4th option "Hoạt động ngoài trời" displays correctly.
2. Select it, fill out the Setup form (Name, Category, Target KM).
3. Verify Goong map renders and centers on current location.
4. Simulate movement/Start tracking -> Verify elapsed time, pace, and calories update.
5. Complete activity -> Verify redirect to `/training/my-Trainings`.
6. Verify the DB (`activity_tracking` collection) successfully saved the record with `eventId: null` and the correct `<name>`.
