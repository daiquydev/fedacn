# Plan: kcal-decimal-refactor

## Overview
Refactoring the calculation and rendering of "kcal" (Calories) across the Fullstack platform (Frontend + Backend). 
Currently, the codebase uses `Math.round()` which rounds small values to integers (often `0`). This refactor implements Option B from the brainstorm: creating global helper functions (`roundKcal` in standard Utils) to ensure kcal precision up to 2 decimal places.

## Project Type
WEB and BACKEND (Fullstack)

## Success Criteria
- All occurrences of `Math.round()` applied to calories/kcal are replaced with `roundKcal()` (e.g. `Math.round(val * 100) / 100`).
- No calculations for small sets of exercises or food result in `0 kcal` unintentionally.
- The UI properly displays the kcal formats. 
- The Mongoose models seamlessly accept floating point inputs for kcal.
- `verify_all.py` and linter checks pass smoothly post-implementation.

## Tech Stack
- Frontend: React JS
- Backend: Node.js (Express), MongoDB / Mongoose
- Utility: Pure JavaScript/TypeScript Helper Functions

## File Structure
- **Backend Utility**: `c:\DATN\fedacn\DATN_BE\src\utils\math.utils.ts` (New file)
- **Frontend Utility**: `c:\DATN\fedacn\DATN_FE\src\utils\mathUtils.js` (New file)

## Task Breakdown
### Task 1: Create Global Helper Utilities
**Agent**: `backend-specialist` & `frontend-specialist`
**Skills**: `clean-code`
- **INPUT**: Codebase without centralized math precision utility.
- **OUTPUT**: `math.utils.ts` (BE) and `mathUtils.js` (FE) containing `export const roundKcal = (val) => Math.round(val * 100) / 100;`
- **VERIFY**: The utility is successfully exported and easily importable in both environments.

### Task 2: Refactor Backend Calculations
**Agent**: `backend-specialist`
**Skills**: `clean-code`
- **INPUT**: API routes, controllers, and services (e.g., `nutrition.routes.js`, `nutrition.services.ts`, `personalDashboard.services.ts`, `workoutSession.service.ts`) using `Math.round()` on calories.
- **OUTPUT**: Widespread application of `roundKcal()` within backend logic.
- **VERIFY**: Unit computations save floats accurately to MongoDB without throwing type format errors.

### Task 3: Refactor Frontend Calculations
**Agent**: `frontend-specialist`
**Skills**: `clean-code`
- **INPUT**: Frontend UI components (e.g., `UserProgressChart.jsx`, `TrainingDetail.jsx`, `Training.jsx`, `MyTraining.jsx`, `SportEventProgress.jsx`) wrapping metrics in `Math.round()`.
- **OUTPUT**: Global `import { roundKcal }` with its usage substituting raw Math.round forms. 
- **VERIFY**: UI renders numbers like `1.45 kcal` instead of `1 kcal`, properly displaying decimals.

### Task 4: UI Edge Cases and Decimals (Optional Formatting)
**Agent**: `frontend-specialist`
**Skills**: `frontend-design`
- **INPUT**: High-precision UI displays
- **OUTPUT**: Ensure strings don't render excessive zeroes or wrap unnaturally.
- **VERIFY**: Visually check floating components in the browser.

## Phase X: Verification
- [ ] Lint: Check `npm run lint` natively for unused imports or errors.
- [ ] Build: Verify both `npm run build` locally in `DATN_FE` and `DATN_BE`.
- [ ] DB Integrity: Start dev server, complete a workout / meal schedule, and open MongoDB to confirm float values were received correctly.
- [ ] UI Display check: Values exhibit `XX.XX` correctly.
