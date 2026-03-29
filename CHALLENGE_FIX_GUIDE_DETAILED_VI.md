# 🔧 HƯỚNG DẪN CẢI THIỆN LOGIC THỬ THÁCH

## 📍 Vị Trí File Cần Sửa

```
DATN_FE/src/pages/Challenge/components/
├── ParticipantProgressModal.jsx  ◄── CHƯA CLICKABLE
├── DayChallengeModal.jsx          ◄── ENTRIES CHƯA EXPANDABLE
└── (Cần tạo mới):
    ├── NutritionDetailView.jsx
    ├── FitnessDetailView.jsx
    └── ActivityEntryDetailView.jsx
```

---

## Fix 1️⃣: ParticipantProgressModal - Make Calendar Clickable

### ❓ **Vấn Đề Hiện Tại:**
```
ParticipantProgressModal → Mini calendar
  └─ Ngày được highlight (active_days)
  └─ ❌ KHÔNG clickable
  └─ Chỉ thấy flat list tất cả entries
  └─ Không biết entry nào là ngày nào (phải scroll)
```

### ✅ **Giải Pháp:**

**File: [ParticipantProgressModal.jsx](DATN_FE/src/pages/Challenge/components/ParticipantProgressModal.jsx)**

#### **Step 1: Thêm state cho selected day**
```jsx
// Add at top of component:
const [selectedDayDetail, setSelectedDayDetail] = useState(null)  // ← NEW
```

#### **Step 2: Make calendar clickable**
```jsx
// CHANGE:
{allDays.map((day, idx) => {
  const isActive = activeSet.has(day)
  // ... other logic ...
  
  return (
    <div
      key={day}
      title={`Ngày ${idx + 1} (${day})`}
      onClick={() => setSelectedDayDetail(day)}  // ← ADD THIS
      className={`aspect-square rounded-md flex items-center justify-center text-[8px] font-bold cursor-pointer hover:opacity-80 ${
        // ... colors remain the same ...
      }`}
    >
      {isActive ? '✓' : new Date(day + 'T00:00:00').getDate()}
    </div>
  )
})}
```

#### **Step 3: Show filtered entries for selected day**
```jsx
// AFTER "Mini calendar" section, ADD:

{selectedDayDetail && (
  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border-2 border-orange-300">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400">
        📅 Chi tiết ngày {new Date(selectedDayDetail + 'T00:00:00').getDate()}
      </h4>
      <button
        onClick={() => setSelectedDayDetail(null)}
        className="text-xs text-gray-400 hover:text-gray-600 font-bold"
      >
        ✕ Đóng
      </button>
    </div>
    
    {progressEntries
      .filter(e => {
        const entryDate = format(new Date(e.date || e.createdAt), 'yyyy-MM-dd')
        return entryDate === selectedDayDetail
      })
      .map(entry => (
        <div
          key={entry._id}
          onClick={() => {
            // Later: setSelectedEntry(entry) to show detail
          }}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 cursor-pointer mb-2 transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                +{entry.value} {entry.unit}
                {entry.distance && ` • 📍 ${entry.distance}km`}
                {entry.duration_minutes && ` • ⏱️ ${entry.duration_minutes}p`}
                {entry.calories && ` • 🔥 ${entry.calories}kcal`}
              </p>
              {entry.notes && (
                <p className="text-[9px] text-gray-500 mt-1">{entry.notes}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    
    {progressEntries.filter(e => {
      const entryDate = format(new Date(e.date || e.createdAt), 'yyyy-MM-dd')
      return entryDate === selectedDayDetail
    }).length === 0 && (
      <p className="text-[9px] text-gray-400 text-center py-2">
        Không có check-in nào vào ngày này
      </p>
    )}
  </div>
)}
```

#### **Step 4: Update the main entries list**
```jsx
// CHANGE "Progress entries" section từ:
{progressEntries.length > 0 && (
  <div>
    <h4>📋 Chi tiết check-in</h4>
    <div>
      {progressEntries.slice(0, 15).map(entry => (
        // old code
      ))}
    </div>
  </div>
)}

// TO:
{progressEntries.length > 0 && !selectedDayDetail && (
  <div>
    <h4>📋 Tất cả check-in</h4>
    <p className="text-[9px] text-gray-400 mb-2">👆 Nhấn vô một ngày trên lịch để xem chi tiết</p>
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {progressEntries.slice(0, 15).map(entry => (
        // old code - show summary only
      ))}
    </div>
  </div>
)}
```

---

## Fix 2️⃣: DayChallengeModal - Make Entries Expandable

### ❓ **Vấn Đề Hiện Tại:**
```
DayChallengeModal → Show entries for selected day
  └─ Display: value + notes + distance/duration/calories
  └─ ❌ KHÔNG expandable
  └─ For GPS outdoor: não thể click để xem bản đồ
  └─ For nutrition: không thể click để xem ảnh
  └─ For fitness: không thể click để xem chi tiết
```

### ✅ **Giải Pháp:**

**File: [DayChallengeModal.jsx](DATN_FE/src/pages/Challenge/components/DayChallengeModal.jsx)**

#### **Step 1: Thêm state và import**
```jsx
// Add at top of component:
import ActivityEntryDetailView from './ActivityEntryDetailView'  // ← NEW
import NutritionDetailView from './NutritionDetailView'        // ← NEW
import FitnessDetailView from './FitnessDetailView'            // ← NEW

// Add in state:
const [selectedActivityEntry, setSelectedActivityEntry] = useState(null)  // ← NEW
```

#### **Step 2: Update the day entries display to be clickable**
```jsx
// FIND in DayChallengeModal:
// "const dayStats = useMemo(() => { ... }) section"
// Then CHANGE the entries rendering:

{dayEntries.length > 0 && (
  <div>
    <h4 className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-2">
      📋 Các lần thực hiện
    </h4>
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {dayEntries.map((entry, idx) => (
        <button
          key={idx}
          onClick={() => setSelectedActivityEntry(entry)}  // ← ADD THIS
          className="w-full text-left p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-orange-300 hover:shadow-sm transition-all group"
        >
          {/* Entry header with type-specific icons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {challenge?.challenge_type === 'outdoor_activity' && (
                <span>🗺️</span>
              )}
              {challenge?.challenge_type === 'nutrition' && (
                <span>📷</span>
              )}
              {challenge?.challenge_type === 'fitness' && (
                <span>💪</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                  #{idx + 1} • +{entry.value} {entry.unit}
                </p>
                <p className="text-[9px] text-gray-500 truncate">
                  {entry.notes || 'Không có ghi chú'}
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-2 ml-2">
              {entry.distance && (
                <span className="text-[9px] text-gray-500">📍 {entry.distance}km</span>
              )}
              {entry.duration_minutes && (
                <span className="text-[9px] text-gray-500">⏱️ {entry.duration_minutes}p</span>
              )}
              {entry.calories && (
                <span className="text-[9px] text-gray-500">🔥 {entry.calories}</span>
              )}
              <span className="text-orange-400 group-hover:text-orange-600">→</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
)}
```

#### **Step 3: Add detail view modal**
```jsx
// ADD at bottom of JSX (before closing </div>):

{selectedActivityEntry && (
  challenge?.challenge_type === 'outdoor_activity'
    ? <ActivityEntryDetailView
        entry={selectedActivityEntry}
        challenge={challenge}
        onClose={() => setSelectedActivityEntry(null)}
      />
    : challenge?.challenge_type === 'nutrition'
    ? <NutritionDetailView
        entry={selectedActivityEntry}
        onClose={() => setSelectedActivityEntry(null)}
      />
    : <FitnessDetailView
        entry={selectedActivityEntry}
        onClose={() => setSelectedActivityEntry(null)}
      />
)}
```

---

## 🆕 File 3: ActivityEntryDetailView Component

**Create file: [DATN_FE/src/pages/Challenge/components/ActivityEntryDetailView.jsx]()**

```jsx
import React from 'react'
import { FaTimes, FaMapMarkerAlt, FaClock, FaFire, FaRoad } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { getActivity } from '../../../apis/sportEventApi'
import ActivityDetailModal from '../../../components/SportEvent/ActivityDetailModal'

export default function ActivityEntryDetailView({ entry, challenge, onClose }) {
  const type = challenge?.challenge_type || 'fitness'

  // If outdoor with GPS tracking (has activity_id):
  if (entry.activity_id) {
    return (
      <ActivityDetailModal
        activityId={entry.activity_id}
        onClose={onClose}
        title="Chi tiết hoạt động"
      />
    )
  }

  // Manual outdoor input (no GPS):
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FaMapMarkerAlt /> Chi tiết hoạt động
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Activity type */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Loại hoạt động</p>
            <p className="text-base font-bold text-gray-800 dark:text-white">
              {entry.notes?.split(':')[0] || 'Hoạt động ngoài trời'}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">📍 Khoảng cách</p>
              <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                {entry.distance?.toFixed(1) || 0}
              </p>
              <p className="text-[9px] text-gray-500">km</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mb-1">⏱️ Thời gian</p>
              <p className="text-lg font-black text-purple-700 dark:text-purple-300">
                {entry.duration_minutes || 0}
              </p>
              <p className="text-[9px] text-gray-500">phút</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">🔥 Calo</p>
              <p className="text-lg font-black text-orange-700 dark:text-orange-300">
                {entry.calories || 0}
              </p>
              <p className="text-[9px] text-gray-500">kcal</p>
            </div>
          </div>

          {/* Calculated stats */}
          {entry.duration_minutes && entry.distance && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 dark:text-gray-400">Tốc độ:</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {entry.avg_speed?.toFixed(1) || (entry.distance / (entry.duration_minutes / 60)).toFixed(1)} km/h
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 dark:text-gray-400">Pace:</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {(() => {
                    const totalSec = entry.duration_minutes * 60
                    const paceS = totalSec / entry.distance
                    const pm = Math.floor(paceS / 60)
                    const ps = Math.floor(paceS % 60)
                    return `${pm}'${String(ps).padStart(2, '0')}"/km`
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{entry.notes}</p>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🆕 File 4: NutritionDetailView Component

**Create file: [DATN_FE/src/pages/Challenge/components/NutritionDetailView.jsx]()**

```jsx
import React from 'react'
import { FaTimes, FaUtensilsspoon } from 'react-icons/fa'
import { getImageUrl } from '../../../utils/imageUrl'

const MEAL_LABELS = {
  breakfast: '🌅 Bữa sáng',
  lunch: '☀️ Bữa trưa',
  dinner: '🌙 Bữa tối',
  snack: '🍎 Bữa phụ'
}

export default function NutritionDetailView({ entry, onClose }) {
  const mealType = entry.notes?.split(':')[0] || 'Bữa ăn'
  const imageUrl = entry.proof_image
    ? getImageUrl(entry.proof_image)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FaUtensilsspoon /> Chi tiết check-in
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Meal type */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Loại bữa ăn</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{mealType}</p>
          </div>

          {/* Image */}
          {imageUrl && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Ảnh bữa ăn</p>
              <img
                src={imageUrl}
                alt="Check-in"
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
              />
            </div>
          )}

          {/* Calories */}
          {entry.calories && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">🔥 Lượng calo</p>
              <p className="text-2xl font-black text-orange-700 dark:text-orange-300">
                {entry.calories}
              </p>
              <p className="text-sm text-gray-500 mt-1">kcal</p>
            </div>
          )}

          {/* Notes */}
          {entry.notes && entry.notes.includes(':') && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {entry.notes.split(':').slice(1).join(':').trim()}
              </p>
            </div>
          )}

          {/* Timestamp */}
          <div>
            <p className="text-xs text-gray-500">
              {new Date(entry.date || entry.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🆕 File 5: FitnessDetailView Component

**Create file: [DATN_FE/src/pages/Challenge/components/FitnessDetailView.jsx]()**

```jsx
import React from 'react'
import { FaTimes, FaDumbbell, FaClock, FaFire } from 'react-icons/fa'

const WORKOUT_TYPES = {
  cardio: '🏃 Cardio',
  strength: '🏋️ Tập tạ',
  yoga: '🧘 Yoga',
  hiit: '⚡ HIIT',
  stretching: '🤸 Giãn cơ',
  other: '💪 Khác'
}

export default function FitnessDetailView({ entry, onClose }) {
  const workoutType = entry.notes?.split(':')[0] || 'Tập luyện'
  const detailedNotes = entry.notes?.includes(':')
    ? entry.notes.split(':').slice(1).join(':').trim()
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FaDumbbell /> Chi tiết buổi tập
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Workout type */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Loại bài tập</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{workoutType}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mb-1 flex items-center justify-center gap-1">
                <FaClock size={12} /> Thời gian
              </p>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300">
                {entry.duration_minutes || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">phút</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1 flex items-center justify-center gap-1">
                <FaFire size={12} /> Calo đốt
              </p>
              <p className="text-2xl font-black text-orange-700 dark:text-orange-300">
                {entry.calories || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">kcal</p>
            </div>
          </div>

          {/* Notes */}
          {detailedNotes && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{detailedNotes}</p>
            </div>
          )}

          {/* Timestamp */}
          <div>
            <p className="text-xs text-gray-500">
              {new Date(entry.date || entry.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## ✅ CHECKLIST IMPLEMENTATION

```
PHASE 1: ParticipantProgressModal
  ☐ Step 1: Add selectedDayDetail state
  ☐ Step 2: Make mini calendar clickable
  ☐ Step 3: Show filtered entries for selected day
  ☐ Step 4: Update main entries list (hide if selected)
  ☐ Test: Can click day → see that day's entries

PHASE 2: DayChallengeModal
  ☐ Step 1: Add imports (3 new detail views)
  ☐ Step 2: Add selectedActivityEntry state
  ☐ Step 3: Make entries clickable
  ☐ Step 4: Show conditional detail modal
  ☐ Test: Can click entry → see detail

PHASE 3: Create Detail View Components
  ☐ ActivityEntryDetailView.jsx (outdoor)
  ☐ NutritionDetailView.jsx
  ☐ FitnessDetailView.jsx
  ☐ Test: Each shows correct info

PHASE 4: Testing
  ☐ Test nutrition: upload image → click → see image + calories
  ☐ Test fitness: manual → click → see duration + calories
  ☐ Test outdoor GPS: GPS → click → see map
  ☐ Test outdoor manual: manual → click → see stats (no map)
  ☐ Test participant: click day in calendar → see filtered entries
```

---

## 🎯 EXPECTED RESULT AFTER IMPLEMENTATION

```
BEFORE:
┌─ ParticipantProgressModal
│  ├─ Mini calendar (not clickable)
│  └─ Long list of all entries (hard to find)
│
└─ DayChallengeModal
   ├─ Entries showing stats
   └─ No way to expand/see details

AFTER:
┌─ ParticipantProgressModal
│  ├─ Mini calendar (CLICKABLE)
│  │  └─ Click day → show only that day's entries
│  │
│  └─ Filtered entries for selected day
│     ├─ Click entry → see detail view
│     └─ Shows specific info (image/map/stats)
│
└─ DayChallengeModal
   ├─ Entries showing stats (CLICKABLE)
   │  └─ Click entry → show detail modal
   │
   └─ Detail modals appear based on type:
      ├─ Outdoor GPS → ActivityDetailModal (with map)
      ├─ Outdoor manual → ActivityEntryDetailView (stats only)
      ├─ Nutrition → NutritionDetailView (image + calories)
      └─ Fitness → FitnessDetailView (duration + calories)
```

---

**Last Updated: 2024-03-29**
