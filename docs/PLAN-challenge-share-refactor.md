# PLAN: Challenge Share Refactor (Option B)

## Overview

Hiện tại `ActivityPreviewCard` xử lý cả 2 loại: Sport Event và Challenge activity trong một component duy nhất, dẫn đến:
1. **Bug navigation**: Click vào bài chia sẻ `challenge-activity` không navigate đến `/challenge/:id`
2. **Thiếu error/deleted state**: `ActivityPreviewCard` trả về `null` khi activity không tồn tại (invisible)
3. **UI không đồng bộ**: `ChallengeShareModal` không sync `challenge.visibility` → `defaultPrivacy`
4. **Không có challenge info** trong footer của `ActivityPreviewCard` khi type là challenge

**Option B** tách thành 2 component riêng, theo pattern đã có của `SportEventPreviewCard` / `ChallengePreviewCard`.

---

## Project Type: WEB — `frontend-specialist`

---

## Success Criteria

- [ ] Click bài chia sẻ `[challenge-activity:...]` → navigate `/challenge/:id`
- [ ] Click bài chia sẻ `[activity:...]` → navigate `/sport-event/:id` (không đổi)
- [ ] Khi challenge đã bị xóa → hiển thị "Thử thách này đã bị xóa hoặc không còn tồn tại"
- [ ] Khi sport event đã bị xóa → hiển thị "Sự kiện này đã bị xóa hoặc không còn tồn tại"
- [ ] `ChallengeShareModal` mặc định privacy theo `challenge.visibility`
- [ ] `PostCard` route đúng đến component tương ứng

---

## Tech Stack

- React + JSX (không thay đổi)
- `@tanstack/react-query` (đã có)
- `@goongmaps/goong-js` (đã có — giữ nguyên cho map GPS)
- `react-router-dom` (đã có)

---

## File Structure

```
DATN_FE/src/components/Post/
├── ActivityPreviewCard.jsx          [MODIFY] — chỉ xử lý Sport Event activity
├── ChallengeActivityPreviewCard.jsx [NEW]    — xử lý Challenge activity
DATN_FE/src/components/Challenge/
├── ChallengeShareModal.jsx          [MODIFY] — thêm defaultPrivacy từ visibility
DATN_FE/src/components/CardComponents/PostCard/
├── PostCard.jsx                     [MODIFY] — route đúng component, thêm import mới
DATN_FE/src/components/Post/
├── SportEventPreviewCard.jsx        [MODIFY] — refine deleted message (optional polish)
├── ChallengePreviewCard.jsx         [MODIFY] — refine deleted message (optional polish)
```

---

## Task Breakdown

### Task 1 — Refactor `ActivityPreviewCard.jsx` (Event-only)
**Agent:** `frontend-specialist`

**INPUT:** `ActivityPreviewCard.jsx` hiện xử lý cả event lẫn challenge

**OUTPUT:**
- Xóa toàn bộ logic `isChallenge`, `challengeId` prop, query `getChallenge`
- Giữ lại `extractActivityIds` và `cleanActivityMarker` (vẫn parse cả 2 marker để `cleanActivityMarker` hoạt động đúng trong `PostCard`)
- `handleNavigate` chỉ navigate `sport-event/:id`
- Thêm `isError` state hiển thị: _"🏃 Hoạt động này hoặc sự kiện thể thao đã không còn tồn tại"_
- Props: `{ activityId, eventId }` (bỏ `challengeId`)

**VERIFY:** PostCard không còn truyền `challengeId` vào component này; bài event-activity vẫn navigate đúng

**Dependencies:** None

---

### Task 2 — Tạo `ChallengeActivityPreviewCard.jsx` [NEW]
**Agent:** `frontend-specialist`

**INPUT:** Copy logic từ `ActivityPreviewCard.jsx` (phần challenge)

**OUTPUT:** Component mới `ChallengeActivityPreviewCard` với:
- Props: `{ activityId, challengeId }`
- Query: `getChallengeActivity(challengeId, activityId)` để lấy stats + gpsRoute
- Query: `getChallenge(challengeId)` để lấy tên, loại thử thách cho banner header + footer
- Navigation: `navigate('/challenge/:challengeId')`
- UI theme màu **cam/amber** (phân biệt với event theme đỏ/cam)
- Loading skeleton: giống pattern hiện có
- `isError` / deleted state: _"🏆 Hoạt động này hoặc thử thách đã không còn tồn tại"_
- Map GPS: Goong map (đã có — copy logic từ file cũ)
- Export pattern:
  ```js
  export function extractChallengeActivityIds(content) { ... }
  export function cleanChallengeActivityMarker(content) { ... }
  export default function ChallengeActivityPreviewCard({ activityId, challengeId }) { ... }
  ```

**VERIFY:** PostCard render `ChallengeActivityPreviewCard` khi content có `[challenge-activity:...]`; click navigate `/challenge/:id`

**Dependencies:** Task 1 (để biết phần nào đã remove khỏi `ActivityPreviewCard`)

---

### Task 3 — Update `PostCard.jsx`
**Agent:** `frontend-specialist`

**INPUT:** `PostCard.jsx` gọi `ActivityPreviewCard` với cả `eventId` và `challengeId`

**OUTPUT:**
- Import thêm `ChallengeActivityPreviewCard, { extractChallengeActivityIds, cleanChallengeActivityMarker }` 
- Thay đổi routing logic:
  - Nếu marker là `[activity:...]` → render `<ActivityPreviewCard activityId={...} eventId={...} />`
  - Nếu marker là `[challenge-activity:...]` → render `<ChallengeActivityPreviewCard activityId={...} challengeId={...} />`
- Cập nhật `cleanActivityMarker` chain trong `content` display (giữ cả 2 cleaner)
- Áp dụng ở **cả 2 nơi** trong `PostCard` (type 0 và type shared/repost)

**VERIFY:** PostCard render đúng component theo loại marker; không còn truyền `challengeId` vào `ActivityPreviewCard`

**Dependencies:** Task 1, Task 2

---

### Task 4 — Update `ChallengeShareModal.jsx`
**Agent:** `frontend-specialist`

**INPUT:** `ChallengeShareModal` không sync privacy với `challenge.visibility`

**OUTPUT:**
- Thêm map `visibilityToPrivacy`: `{ public: 0, friends: 1, private: 2 }`
- Set `defaultPrivacy` dựa vào `challenge?.visibility`
- `useState(defaultPrivacy)` thay vì `useState(0)`
- Tương tự pattern đã có trong `ActivityShareModal.jsx`

**VERIFY:** Mở share modal cho challenge có `visibility: 'friends'` → mặc định chọn "Người theo dõi"

**Dependencies:** None (có thể thực hiện song song với Task 1)

---

### Task 5 — Polish: Refine Deleted State messages
**Agent:** `frontend-specialist`

**INPUT:** `SportEventPreviewCard` và `ChallengePreviewCard` có deleted message nhưng không đủ rõ

**OUTPUT:**
- `SportEventPreviewCard` isError: _"🏃 Sự kiện thể thao này đã bị xóa hoặc không còn tồn tại"_
- `ChallengePreviewCard` isError: _"🏆 Thử thách này đã bị xóa hoặc không còn tồn tại"_
- Đồng nhất style: icon lớn hơn, text rõ hơn, không chỉ là text nhỏ mờ

**VERIFY:** Giả lập bằng eventId/challengeId không tồn tại → thấy card deleted đẹp

**Dependencies:** None (độc lập)

---

## Dependency Graph

```
Task 4 ──────────────────────────────────────────┐
Task 5 ──────────────────────────────────────────┤
Task 1 ──────────────┐                           │
Task 2 ──────────────┼──→ Task 3 (PostCard)       │
                              ↓                   │
                        ✅ Done                  ✅ Done
```

Tasks 1, 2, 4, 5 có thể thực hiện song song.
Task 3 phải sau Task 1 và Task 2.

---

## Phase X: Verification Checklist

### Manual Test
1. Mở `/home` → tìm bài có `[challenge-activity:...]`
   → Click vào card → phải navigate đến `/challenge/:id`
2. Mở `/home` → tìm bài có `[activity:...]`
   → Click vào card → phải navigate đến `/sport-event/:id`
3. Vào `ChallengeDetail` → Click "Chia sẻ thử thách"
   → Modal mở → Privacy mặc định phải khớp `challenge.visibility`
4. Fake một `challengeId` không tồn tại trong bài viết
   → Xem `ChallengeActivityPreviewCard` hiển thị deleted state

### Code Check
- [ ] Không còn `challengeId` prop trong `ActivityPreviewCard`
- [ ] `PostCard` import và route đúng 2 component riêng biệt
- [ ] Không có broken import

### Build Check
```bash
cd c:\DATN\fedacn\DATN_FE
npm run build
```
→ Không có lỗi TypeScript/ESLint

---

*Plan created: 2026-04-05*
