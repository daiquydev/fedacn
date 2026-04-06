# Implementation Plan: Progress Filtering (Option A)

## Context
When checking into a challenge outside of the allowed time window or submitting an invalid food image, the system should allow the user to submit it and create a history record, but it should **not** count towards the cumulative daily or total challenge progress. Currently, the UI sums all records, and the Backend backend does not consistently exclude `ai_review_valid === false`.

## Goal
Implement Option A: Modify existing sum logic in both the frontend and backend to filter out records where `validation_status === 'invalid_time'` or `ai_review_valid === false`.

## Phase -1: Context Check & Socratic Gate
- **Clarification:** The user has explicitly selected Option A. As there are no breaking schema changes, we can proceed directly to implementation.

## Phase 1: Backend Updates (`challenge.services.ts`)
- **Location:** `c:\DATN\fedacn\DATN_BE\src\services\userServices\challenge.services.ts`
- **Actions:**
  1. In `addProgress`: Find `todaysProgressList` query. Update the `$match` object to include `ai_review_valid: { $ne: false }`. (Note: `validation_status: { $ne: 'invalid_time' }` is already present).
  2. In `getParticipants`: Find `todayAgg` aggregation `$match` stage. Update to include `ai_review_valid: { $ne: false }`.
  3. In `deleteProgress`: Find `allEntries` query used for updating stats. Update it to include `ai_review_valid: { $ne: false }`.

## Phase 2: Frontend Updates (`DayChallengeModal.jsx`)
- **Location:** `c:\DATN\fedacn\DATN_FE\src\pages\Challenge\components\DayChallengeModal.jsx`
- **Actions:**
  1. Locate the logic that calculates `currentProgress` (the `$sum` of today's activities).
  2. Modify the `.reduce` or calculation function to skip any entries where `validation_status === 'invalid_time'` OR `ai_review_valid === false`.
  3. Example concept:
     ```javascript
     const validEntries = todayEntries.filter(
         e => e.validation_status !== 'invalid_time' && e.ai_review_valid !== false
     );
     const currentProgress = validEntries.reduce((sum, e) => sum + e.value, 0);
     ```

## Phase X: Verification
- [ ] Check if a newly submitted late check-in shows "Trễ giờ" but leaves the daily progress bubble unchanged.
- [ ] Check if a declined image (AI false) leaves the daily progress unchanged.
- [ ] Backend streaks and completions ignore these invalid entries.
- [ ] Run `npm run lint` successfully.

---
**Agent Assignments:**
- Backend Specialist: Phase 1
- Frontend Specialist: Phase 2
- Orchestrator: Coordinator & Review
