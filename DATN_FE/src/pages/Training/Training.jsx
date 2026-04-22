import { roundKcal } from '../../utils/mathUtils'
import { formatExerciseCategoryVi, formatExerciseDifficultyVi } from '../../utils/exerciseLabels'
import { useSafeMutation } from '../../hooks/useSafeMutation'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Model from 'react-body-highlighter'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  FaDumbbell, FaChevronLeft, FaChevronRight, FaCheck, FaTrash, FaPlus, FaPlay,
  FaStopwatch, FaWeight, FaRunning, FaTimes, FaRedo, FaInfoCircle, FaGripVertical,
  FaBrain, FaFire, FaHeartbeat, FaUserAlt, FaArrowRight,
  FaBookmark, FaCalendarAlt
} from 'react-icons/fa'
import { GiMuscleUp, GiWeightLiftingUp, GiJumpingRope, GiBiceps } from 'react-icons/gi'
import { MdFitnessCenter } from 'react-icons/md'
import { toast } from 'react-hot-toast'
import { filterExercises, suggestExercisesByKcal, getAllExercises } from '../../apis/exerciseApi'
import { createWorkoutSession, completeWorkoutSession } from '../../apis/workoutSessionApi'
import { getEquipment } from '../../apis/equipmentApi'
import { getMuscleGroups } from '../../apis/muscleGroupApi'
import { getSavedWorkouts as apiGetSavedWorkouts,
  createSavedWorkout as apiCreateSavedWorkout,
  deleteSavedWorkout as apiDeleteSavedWorkout,
  updateSavedWorkoutSchedule as apiUpdateSavedWorkoutSchedule
} from '../../apis/savedWorkoutApi'
import { addChallengeProgress } from '../../apis/challengeApi'
import ConfirmBox from '../../components/GlobalComponents/ConfirmBox'
import ExerciseDetailModal from '../../components/ExerciseDetailModal'

import OutdoorSetupStep from './components/OutdoorSetupStep'
import OutdoorTrackingStep from './components/OutdoorTrackingStep'

// Fallback muscle labels for head/neck (non-selectable)
const FALLBACK_LABELS = { 'head': 'Đầu', 'neck': 'Cổ' }

// Các vùng SVG không trùng name_en trong DB: ánh xạ sang nhóm cơ gần nhất.
// Lưu ý: 'neck' (cổ trước) và 'trapezius' (cơ thang mặt sau) là hai id khác nhau
// trong react-body-highlighter — không map neck→trapezius ở đây; dùng body_part_ids
// (DB) + HIGHLIGHT_EXTRAS để vừa chọn vừa tô đúng cả hai vùng.
const SVG_TO_MUSCLE_MAP = {
  'head': null,
  'knees': 'quadriceps',
  'left-soleus': 'calves',
  'right-soleus': 'calves',
  'left-fingers': 'forearm',
  'right-fingers': 'forearm',
  'left-hand': 'forearm',
  'right-hand': 'forearm',
  'left-ankle': 'calves',
  'right-ankle': 'calves',
  'left-feet': 'calves',
  'right-feet': 'calves',
  'left-tibialis': 'calves',
  'right-tibialis': 'calves',
  'left-shin': 'calves',
  'right-shin': 'calves',
  'left-wrist': 'forearm',
  'right-wrist': 'forearm'
}

// Bổ sung id SVG hợp lệ của thư viện để tô cùng màu với nhóm cơ (khi DB chỉ có id chính).
const HIGHLIGHT_EXTRAS_BY_GROUP = {
  trapezius: ['neck'],
  quadriceps: ['knees'],
  calves: ['left-soleus', 'right-soleus']
}

// Activity level options
const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Ít vận động', desc: 'Ngồi nhiều, không tập' },
  { value: 1.375, label: 'Nhẹ', desc: '1-3 ngày/tuần' },
  { value: 1.55, label: 'Vừa phải', desc: '3-5 ngày/tuần' },
  { value: 1.725, label: 'Năng động', desc: '6-7 ngày/tuần' },
  { value: 1.9, label: 'Rất năng động', desc: 'Tập 2 lần/ngày' },
]

// Day labels for schedule
const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const DAY_FULL_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

// ─── Saved Workouts localStorage fallback (kept for reminder check only) ──────
const SAVED_WORKOUTS_KEY = 'feda_saved_workouts'
const _getCachedWorkouts = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_WORKOUTS_KEY) || '[]') } catch { return [] }
}
const _cacheWorkouts = (list) => {
  try { localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(list)) } catch { }
}

// Format schedule display
const formatScheduleLabel = (schedule) => {
  if (!schedule) return null
  const days = (schedule.days_of_week || []).map(d => DAY_LABELS[d]).join(', ')
  const time = schedule.time_of_day || ''
  return `${days}${time ? ` lúc ${time}` : ''}`
}

const parseTime = (timeStr) => {
  if (!timeStr) return new Date()
  const [hours, minutes] = timeStr.split(':')
  const d = new Date()
  d.setHours(parseInt(hours, 10))
  d.setMinutes(parseInt(minutes, 10))
  d.setSeconds(0)
  d.setMilliseconds(0)
  return d
}

// ─── SaveWorkoutModal (3-step: tên → hỏi lịch → form lịch) ─────────────────
const SaveWorkoutModal = ({ exerciseSets, onSaved, onClose }) => {
  const [step, setStep] = React.useState('name') // 'name' | 'ask' | 'schedule'
  const [workoutName, setWorkoutName] = React.useState('')
  const [schedule, setSchedule] = React.useState({
    days_of_week: [],
    time_of_day: '07:00',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    reminder: false
  })

  const toggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }))
  }

  const handleSaveName = () => {
    if (!workoutName.trim()) return
    setStep('ask')
  }

  const handleSaveWithoutSchedule = () => {
    onSaved(workoutName.trim(), exerciseSets, null)
  }

  const handleSaveWithSchedule = () => {
    if (schedule.days_of_week.length === 0) return
    if (schedule.reminder) {
      Notification.requestPermission().catch(() => { })
    }
    onSaved(workoutName.trim(), exerciseSets, schedule)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaBookmark className="text-white" />
            <h3 className="font-bold text-white text-lg">
              {step === 'name' ? 'Lưu bài tập' : step === 'ask' ? 'Đặt lịch tập?' : 'Cài đặt lịch tập'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Đặt tên */}
          {step === 'name' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên bài tập
                </label>
                <input
                  autoFocus
                  value={workoutName}
                  onChange={e => setWorkoutName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  placeholder="Nhập tên lịch tập"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-amber-400 outline-none transition text-sm"
                />
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  📋 {exerciseSets.length} bài tập • {exerciseSets.reduce((a, ex) => a + ex.sets.length, 0)} sets sẽ được lưu
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Hủy
                </button>
                <button onClick={handleSaveName} disabled={!workoutName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm disabled:opacity-40 hover:from-amber-500 hover:to-orange-600 transition flex items-center justify-center gap-2">
                  <FaCheck /> Tiếp tục
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Hỏi có muốn đặt lịch không */}
          {step === 'ask' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <FaCalendarAlt className="text-blue-600 text-2xl" />
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Bạn có muốn đặt lịch tập lại không?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Đặt lịch để nhớ tập đều đặn mỗi tuần 💪
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveWithoutSchedule}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <FaBookmark /> Lưu thôi
                </button>
                <button onClick={() => setStep('schedule')}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-700 shadow-lg transition">
                  <FaCalendarAlt /> Đặt lịch!
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Form lịch */}
          {step === 'schedule' && (
            <div className="space-y-4">
              {/* Ngày trong tuần */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📅 Ngày tập trong tuần
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_LABELS.map((label, idx) => (
                    <button key={idx} onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${schedule.days_of_week.includes(idx)
                        ? 'bg-blue-600 text-white shadow-md scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                        }`}>
                      {label}
                    </button>
                  ))}
                </div>
                {schedule.days_of_week.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Đã chọn: {schedule.days_of_week.map(d => DAY_FULL_LABELS[d]).join(', ')}
                  </p>
                )}
              </div>

              {/* Giờ tập */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ⏰ Giờ tập
                </label>
                <DatePicker
                  selected={parseTime(schedule.time_of_day)}
                  onChange={date => {
                    if (date) {
                      const h = String(date.getHours()).padStart(2, '0')
                      const m = String(date.getMinutes()).padStart(2, '0')
                      setSchedule(prev => ({ ...prev, time_of_day: `${h}:${m}` }))
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Giờ"
                  dateFormat="HH:mm"
                  timeFormat="HH:mm"
                  className="px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-400 outline-none transition text-sm w-full"
                  wrapperClassName="w-full"
                />
              </div>

              {/* Khoảng thời gian */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">📆 Từ ngày</label>
                  <input type="date" value={schedule.start_date}
                    onChange={e => setSchedule(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-400 outline-none text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">📆 Đến ngày</label>
                  <input type="date" value={schedule.end_date}
                    min={schedule.start_date}
                    onChange={e => setSchedule(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-400 outline-none text-sm transition"
                  />
                </div>
              </div>

              {/* Nhắc nhở */}
              <button onClick={() => setSchedule(prev => ({ ...prev, reminder: !prev.reminder }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition text-left ${schedule.reminder
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                  }`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${schedule.reminder ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                  }`}>
                  {schedule.reminder && <FaCheck className="text-white text-[10px]" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">🔔 Nhắc nhở khi mở app</p>
                  <p className="text-xs text-gray-500">Hiển thị thông báo vào ngày tập theo lịch</p>
                </div>
              </button>

              <div className="flex gap-3">
                <button onClick={() => setStep('ask')} className="py-2.5 px-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 font-medium text-sm hover:bg-gray-50 transition">
                  <FaChevronLeft />
                </button>
                <button onClick={handleSaveWithSchedule}
                  disabled={schedule.days_of_week.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm disabled:opacity-40 hover:from-blue-600 hover:to-purple-700 shadow-lg transition flex items-center justify-center gap-2">
                  <FaBookmark /> Lưu & Đặt lịch
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SavedWorkoutsModal (danh sách bài đã lưu) ─────────────────────────────
const SavedWorkoutsModal = ({ workouts = [], onLoad, onClose, onDelete, onUpdateSchedule, isLoading }) => {
  const [editingSchedule, setEditingSchedule] = React.useState(null)
  const [tempSchedule, setTempSchedule] = React.useState(null)

  const handleDelete = (id) => {
    onDelete(id)
  }

  const handleEditSchedule = (w) => {
    setEditingSchedule(w._id)
    setTempSchedule(w.schedule || {
      days_of_week: [], time_of_day: '07:00',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      reminder: false
    })
  }

  const handleSaveSchedule = () => {
    onUpdateSchedule(editingSchedule, tempSchedule)
    setEditingSchedule(null)
  }

  const toggleDay = (day) => {
    setTempSchedule(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }))
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-400 border-t-transparent mx-auto mb-3" />
          <p className="text-gray-500">Đang tải bài tập đã lưu...</p>
        </div>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
          <FaBookmark className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có bài tập nào được lưu</p>
          <p className="text-sm text-gray-400 mt-1">Lưu bài tập từ bước Chuẩn bị để sử dụng lại sau</p>
          <button onClick={onClose} className="mt-5 px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 transition">Đóng</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <FaBookmark className="text-white" />
            <h3 className="font-bold text-white text-lg">Bài tập đã lưu</h3>
            <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">{workouts.length}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition"><FaTimes /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {workouts.map(w => (
            <div key={w._id} className="border-2 border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
              {/* Info row */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{w.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {w.exercises?.length || 0} bài • {(w.exercises || []).reduce((a, ex) => a + (ex.sets?.length || 0), 0)} sets •
                      Lưu lúc {new Date(w.saved_at || w.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    {w.schedule && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                        <FaCalendarAlt className="text-[10px]" />
                        {formatScheduleLabel(w.schedule)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => handleEditSchedule(w)} title="Đặt / Sửa lịch"
                      className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 transition text-sm">
                      <FaCalendarAlt />
                    </button>
                    <button onClick={() => handleDelete(w._id)} title="Xóa"
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition text-sm">
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <button onClick={() => onLoad(w)}
                  className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-700 shadow-md transition">
                  <FaPlay /> Tập ngay!
                </button>
              </div>

              {/* Edit schedule panel */}
              {editingSchedule === w._id && tempSchedule && (
                <div className="border-t-2 border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Cài đặt lịch tập</p>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 block">📅 Ngày tập</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAY_LABELS.map((label, idx) => (
                        <button key={idx} onClick={() => toggleDay(idx)}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${tempSchedule.days_of_week.includes(idx)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-700 text-gray-600 border border-gray-200 dark:border-gray-600 hover:border-blue-300'
                            }`}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">⏰ Giờ tập</label>
                      <DatePicker
                        selected={parseTime(tempSchedule.time_of_day)}
                        onChange={date => {
                          if (date) {
                            const h = String(date.getHours()).padStart(2, '0')
                            const m = String(date.getMinutes()).padStart(2, '0')
                            setTempSchedule(p => ({ ...p, time_of_day: `${h}:${m}` }))
                          }
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Giờ"
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:border-blue-400"
                        wrapperClassName="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">🔔 Nhắc nhở</label>
                      <button onClick={() => setTempSchedule(p => ({ ...p, reminder: !p.reminder }))}
                        className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium transition ${tempSchedule.reminder ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                        {tempSchedule.reminder ? '✅ Bật' : '○ Tắt'}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingSchedule(null)} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-100 transition">Hủy</button>
                    <button onClick={handleSaveSchedule} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition">Lưu lịch</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Mode Selection Screen
const ModeSelection = ({ onSelect, savedWorkouts = [] }) => (
  <div>
    <div className="text-center mb-4">
      <h2 className="text-2xl font-bold mb-1">Chọn chế độ luyện tập</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm">Bạn muốn tập theo cách nào?</p>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <button onClick={() => onSelect('normal')}
        className="group relative p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left">
        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
          <FaDumbbell className="text-white text-lg" />
        </div>
        <h3 className="text-base font-bold mb-0.5 text-blue-700 dark:text-blue-300">Tùy chỉnh</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Tự chọn thiết bị, nhóm cơ và bài tập theo ý muốn</p>
        <div className="mt-2 flex items-center gap-1 text-blue-600 font-medium text-xs">
          Bắt đầu <FaArrowRight className="text-[10px]" />
        </div>
      </button>
      <button onClick={() => onSelect('ai_workout')}
        className="group relative p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:border-purple-500 hover:shadow-xl transition-all duration-300 text-left">
        <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold rounded-full">AI</div>
        <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
          <FaBrain className="text-white text-lg" />
        </div>
        <h3 className="text-base font-bold mb-0.5 text-purple-700 dark:text-purple-300">AI Gợi ý Tập Luyện 🤖</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Mô tả tình trạng sức khỏe, AI bác sĩ tư vấn và gợi ý bài tập phù hợp</p>
        <div className="mt-2 flex items-center gap-1 text-purple-600 font-medium text-xs">
          Bắt đầu <FaArrowRight className="text-[10px]" />
        </div>
      </button>

      <button onClick={() => onSelect('outdoor')}
        className="group relative p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:border-amber-500 hover:shadow-xl transition-all duration-300 text-left">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
          <FaRunning className="text-white text-lg" />
        </div>
        <h3 className="text-base font-bold mb-0.5 text-orange-700 dark:text-orange-300">Hoạt động ngoài trời</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Chạy bộ, đạp xe… ghi hoạt động theo thời gian thực trên bản đồ</p>
        <div className="mt-2 flex items-center gap-1 text-orange-600 font-medium text-xs">
          Bắt đầu <FaArrowRight className="text-[10px]" />
        </div>
      </button>

      {/* Card bài tập đã lưu – luôn hiện, khi empty thì hiện prompt */}
      <button onClick={() => onSelect('saved')}
        className="group relative p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
          <FaBookmark className="text-white text-lg" />
        </div>
        {savedWorkouts.length > 0 ? (
          <>
            <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-bold rounded-full">
              {savedWorkouts.length}
            </div>
            <h3 className="text-base font-bold mb-0.5 text-emerald-700 dark:text-emerald-300">Bài tập đã lưu 📋</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {savedWorkouts.slice(0, 2).map(w => w.name).join(', ')}{savedWorkouts.length > 2 ? '...' : ''}
            </p>
            <div className="mt-1.5 space-y-0.5">
              {savedWorkouts.slice(0, 1).map(w => w.schedule && (
                <div key={w._id || w.id} className="flex items-center gap-1 text-[10px] text-emerald-600">
                  <FaCalendarAlt className="text-[9px]" />
                  <span>{w.name}: {formatScheduleLabel(w.schedule)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1 text-emerald-600 font-medium text-xs">
              Xem danh sách <FaArrowRight className="text-[10px]" />
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-bold mb-0.5 text-emerald-700 dark:text-emerald-300">Bài tập đã lưu 📋</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Chưa có bài nào. Lưu sau khi chuẩn bị!<br />
              <span className="text-[10px]">Vào bước "Chuẩn bị" → nhấn "🔖 Lưu bài tập"</span>
            </p>
            <div className="mt-2 flex items-center gap-1 text-emerald-600 font-medium text-xs">
              Xem thêm <FaArrowRight className="text-[10px]" />
            </div>
          </>
        )}
      </button>
    </div>
  </div>
)

// Smart Step 1: Body metrics input
const MetricsStep = ({ metrics, onChange, onCalculate }) => {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-3">
          <FaUserAlt /> Nhập chỉ số cơ thể
        </div>
        <h2 className="text-xl font-bold mb-1">Thông tin cơ thể của bạn</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Để tính lượng kcal phù hợp cho buổi tập</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cân nặng (kg)</label>
          <input type="number" value={metrics.weight} onChange={e => onChange('weight', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition" placeholder="Nhập cân nặng (kg)" min="30" max="300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chiều cao (cm)</label>
          <input type="number" value={metrics.height} onChange={e => onChange('height', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition" placeholder="Nhập chiều cao (cm)" min="100" max="250" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tuổi</label>
          <input type="number" value={metrics.age} onChange={e => onChange('age', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition" placeholder="Nhập độ tuổi" min="10" max="100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
          <select value={metrics.gender} onChange={e => onChange('gender', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-400 outline-none transition">
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian tập (phút)</label>
          <input type="number" value={metrics.duration} onChange={e => onChange('duration', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition" placeholder="Nhập thời gian tập (phút)" min="10" max="180" />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mức độ hoạt động</label>
        <div className="grid grid-cols-1 gap-2">
          {ACTIVITY_LEVELS.map(lvl => (
            <button key={lvl.value} onClick={() => onChange('activity_level', lvl.value)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition text-left ${metrics.activity_level === lvl.value
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${metrics.activity_level === lvl.value ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                }`}>
                {metrics.activity_level === lvl.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <p className="font-medium text-sm">{lvl.label}</p>
                <p className="text-xs text-gray-400">{lvl.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <button onClick={onCalculate}
        disabled={!metrics.weight || !metrics.height || !metrics.age}
        className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 shadow-lg disabled:opacity-40 transition">
        <FaFire /> Tính toán chỉ số
      </button>
    </div>
  )
}

// Smart Step 2: Show computed kcal target
const KcalResultStep = ({ result, onConfirm, onBack }) => {
  const { bmr, tdee, targetKcal, duration, activityLabel } = result
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-3">
          <FaHeartbeat /> Kết quả tính toán
        </div>
        <h2 className="text-xl font-bold mb-1">Chỉ số của bạn</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Dựa trên thông tin cơ thể và mức hoạt động</p>
      </div>
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-500 font-medium mb-1">BMR</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{roundKcal(bmr)}</p>
            <p className="text-xs text-gray-400">kcal/ngày (nghỉ ngơi)</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
            <p className="text-xs text-green-500 font-medium mb-1">TDEE</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{roundKcal(tdee)}</p>
            <p className="text-xs text-gray-400">kcal/ngày ({activityLabel})</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-center text-white shadow-lg">
          <FaFire className="text-3xl mx-auto mb-2 opacity-90" />
          <p className="text-sm font-medium opacity-90 mb-1">Mục tiêu đốt kcal buổi tập</p>
          <p className="text-5xl font-black mb-1">{targetKcal}</p>
          <p className="text-sm opacity-80">kcal trong {duration} phút</p>
        </div>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-600 font-semibold mb-1">💡 Cách tính</p>
        <p className="text-xs text-gray-500">Mục tiêu = (TDEE / 24h) × ({duration} phút / 60) × 1.2 (hệ số tập luyện), làm tròn lên 50</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <FaChevronLeft /> Sửa lại
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-600 shadow-lg transition">
          Chọn thiết bị <FaChevronRight />
        </button>
      </div>
    </div>
  )
}

// AI Description Step
const DIFF_COLOR_AI = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700', expert: 'bg-red-100 text-red-700' }

const AIDescriptionStep = ({ onConfirm, onBack }) => {
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState('idle')
  const [healthAnalysis, setHealthAnalysis] = React.useState('')
  const [suggestedExercises, setSuggestedExercises] = React.useState([])
  const [selectedAIExercises, setSelectedAIExercises] = React.useState([])
  const [allExercises, setAllExercises] = React.useState([])
  const [swappingIndex, setSwappingIndex] = React.useState(null)
  const [error, setError] = React.useState('')
  const [detailExercise, setDetailExercise] = React.useState(null)

  React.useEffect(() => {
    getAllExercises().then(res => setAllExercises(res?.data?.result || [])).catch(() => { })
  }, [])

  const runAnalysis = async () => {
    if (description.trim().length < 10) return
    setStatus('loading')
    setError('')
    try {
      const http = (await import('../../utils/http')).default
      const res = await http.post('/ai/analyze-workout-description', {
        description: description.trim(),
        availableExercises: allExercises
      })
      const data = res?.data
      setHealthAnalysis(data?.health_analysis || '')
      const exercises = data?.suggested_exercises || []
      setSuggestedExercises(exercises)
      setSelectedAIExercises([...exercises])
      setStatus('done')
    } catch {
      setError('Không thể kết nối AI. Vui lòng thử lại.')
      setStatus('error')
    }
  }

  const handleSwap = async (idx) => {
    setSwappingIndex(idx)
    try {
      const currentIds = suggestedExercises.map(e => e._id)
      const pool = allExercises.filter(e => !currentIds.includes(e._id))
      if (pool.length === 0) { setSwappingIndex(null); return }
      const http = (await import('../../utils/http')).default
      const res = await http.post('/ai/analyze-workout-description', {
        description: description.trim(),
        availableExercises: pool.slice(0, 20)
      })
      const data = res?.data
      const replacement = data?.suggested_exercises?.[0]
      if (replacement) {
        setSuggestedExercises(prev => { const u = [...prev]; u[idx] = replacement; return u })
        setSelectedAIExercises(prev => {
          const old = suggestedExercises[idx]
          const wasSelected = prev.some(s => s._id === old?._id)
          if (wasSelected) return prev.map(s => s._id === old?._id ? replacement : s)
          return prev
        })
      } else {
        const random = pool[Math.floor(Math.random() * pool.length)]
        const rep = { ...random, reason: 'Bài tập thay thế phù hợp với tình trạng của bạn.' }
        setSuggestedExercises(prev => { const u = [...prev]; u[idx] = rep; return u })
        setSelectedAIExercises(prev => {
          const old = suggestedExercises[idx]
          const wasSelected = prev.some(s => s._id === old?._id)
          if (wasSelected) return prev.map(s => s._id === old?._id ? rep : s)
          return prev
        })
      }
    } catch {
      const currentIds = suggestedExercises.map(e => e._id)
      const pool = allExercises.filter(e => !currentIds.includes(e._id))
      if (pool.length > 0) {
        const random = pool[Math.floor(Math.random() * pool.length)]
        const rep = { ...random, reason: 'Bài tập thay thế phù hợp.' }
        setSuggestedExercises(prev => { const u = [...prev]; u[idx] = rep; return u })
        setSelectedAIExercises(prev => {
          const old = suggestedExercises[idx]
          const wasSelected = prev.some(s => s._id === old?._id)
          if (wasSelected) return prev.map(s => s._id === old?._id ? rep : s)
          return prev
        })
      }
    } finally { setSwappingIndex(null) }
  }

  const toggleAIEx = (ex) => {
    const already = selectedAIExercises.some(s => s._id === ex._id)
    if (already) {
      setSelectedAIExercises(prev => prev.filter(s => s._id !== ex._id))
    } else {
      setSelectedAIExercises(prev => [...prev, ex])
    }
  }

  const onDragEndAI = (result) => {
    if (!result.destination) return
    const items = Array.from(selectedAIExercises)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    setSelectedAIExercises(items)
  }

  return (
    <div>
      <ExerciseDetailModal
        exercise={detailExercise}
        onClose={() => setDetailExercise(null)}
        aiReason={detailExercise?.reason}
      />
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-3">
          <FaBrain /> AI Gợi ý Tập Luyện
        </div>
        <h2 className="text-xl font-bold mb-1">Mô tả tình trạng sức khỏe của bạn</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">AI bác sĩ sẽ phân tích và gợi ý bài tập phù hợp</p>
      </div>

      {(status === 'idle' || status === 'error') && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả tình trạng và mục tiêu tập luyện
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-400 outline-none transition resize-none text-sm"
              placeholder="Nhập lưu ý của bạn..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length} ký tự</p>
          </div>
          {status === 'error' && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={onBack}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <FaChevronLeft /> Quay lại
            </button>
            <button onClick={runAnalysis} disabled={description.trim().length < 10 || allExercises.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 shadow-lg transition">
              <FaBrain /> Phân tích AI
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-14">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            <FaBrain className="absolute inset-0 m-auto text-purple-600 text-xl" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">AI bác sĩ đang phân tích tình trạng của bạn...</p>
          <p className="text-xs text-gray-400 mt-1">Tiếm kiếm bài tập phù hợp từ kho dữ liệu</p>
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <FaHeartbeat className="text-pink-500" />
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Đánh giá sức khỏe từ bác sĩ</p>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{healthAnalysis}</p>
          </div>

          {/* Selected exercises with drag-drop */}
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">📌 Đã chọn ({selectedAIExercises.length}/{suggestedExercises.length} bài) — kéo để sắp xếp lại</p>
            {selectedAIExercises.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">Chưa chọn bài tập nào</p>
            )}
            {selectedAIExercises.length > 0 && (
              <DragDropContext onDragEnd={onDragEndAI}>
                <Droppable droppableId="ai-selected-exercises">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5 mb-3">
                      {selectedAIExercises.map((ex, idx) => (
                        <Draggable key={ex._id} draggableId={`ai-${ex._id}`} index={idx}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-900/20 transition-shadow
                                ${snapshot.isDragging ? 'shadow-xl ring-2 ring-green-400' : ''}`}>
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-green-400 hover:text-green-600">
                                <FaGripVertical />
                              </div>
                              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{ex.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{ex.name_vi}</p>
                              </div>
                              {ex.difficulty && (
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex-shrink-0
                                  ${ex.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : ex.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                  {formatExerciseDifficultyVi(ex.difficulty)}
                                </span>
                              )}
                              <button type="button" onClick={(e) => { e.stopPropagation(); setDetailExercise(ex) }} className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition flex-shrink-0" title="Chi tiết bài tập">
                                <FaInfoCircle className="text-sm" />
                              </button>
                              <button type="button" onClick={() => toggleAIEx(ex)} className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 text-xs flex-shrink-0" title="Bỏ chọn">
                                <FaTimes />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          {/* All suggested exercises */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FaDumbbell className="text-blue-500" />
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Bài tập gợi ý ({suggestedExercises.length} bài)</p>
            </div>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {suggestedExercises.map((ex, idx) => {
                const isSelected = selectedAIExercises.some(s => s._id === ex._id)
                return (
                  <div key={ex._id || idx} className={`flex gap-3 p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md
                    ${isSelected
                      ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleAIEx(ex)}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all
                        ${isSelected ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'}`}>
                        {isSelected ? <FaCheck /> : <GiBiceps className="text-lg" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-sm">{ex.name}</p>
                          {ex.difficulty && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${DIFF_COLOR_AI[ex.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                              {formatExerciseDifficultyVi(ex.difficulty)}
                            </span>
                          )}
                          {ex.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                              {formatExerciseCategoryVi(ex.category)}
                            </span>
                          )}
                        </div>
                        {ex.name_vi && <p className="text-[11px] text-gray-400 mb-1">{ex.name_vi}</p>}
                        {ex.reason && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <span className="text-[10px]">💡</span>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">{ex.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setDetailExercise(ex) }}
                        title="Chi tiết bài tập"
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition">
                        <FaInfoCircle className="text-sm" />
                      </button>
                      <button type="button" onClick={() => handleSwap(idx)} disabled={swappingIndex !== null}
                        title="Đổi bài tập khác"
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-500 hover:text-blue-600 transition disabled:opacity-40">
                        {swappingIndex === idx ? <FaRedo className="animate-spin text-sm" /> : <FaRedo className="text-sm" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStatus('idle')}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <FaChevronLeft /> Nhập lại
            </button>
            <button onClick={() => onConfirm(selectedAIExercises)} disabled={selectedAIExercises.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 shadow-lg transition">
              <FaPlay /> Bắt đầu luyện tập ({selectedAIExercises.length})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Step indicator
const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center mb-8">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
            ${index < currentStep ? 'bg-green-500 text-white' : index === currentStep ? 'bg-blue-600 text-white ring-4 ring-blue-200' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
            {index < currentStep ? <FaCheck /> : index + 1}
          </div>
          <span className={`mt-2 text-xs font-medium ${index <= currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
            {step.name}
          </span>
        </div>
        {index < steps.length - 1 && (
          <div className={`w-16 h-1 mx-2 mt-[-1rem] rounded ${index < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
)

/** Ảnh thiết bị từ API (vd. plate.png) có thể thiếu trên CDN — fallback icon cho máy/đĩa tạ */
function TrainingEquipmentIcon({ image_url, name, name_en }) {
  const [imgFailed, setImgFailed] = useState(false)
  const usePlateFallback = name_en === 'plate' && (imgFailed || !String(image_url || '').trim())
  if (usePlateFallback) {
    return (
      <MdFitnessCenter
        className="w-12 h-12 mb-2 text-slate-600 dark:text-slate-300 shrink-0"
        aria-hidden
      />
    )
  }
  return (
    <img
      src={image_url}
      alt={name}
      className="w-12 h-12 object-contain mb-2"
      onError={() => {
        if (name_en === 'plate') setImgFailed(true)
      }}
    />
  )
}

// Step 1: Equipment Selection
const EquipmentStep = ({ selectedEquipment, onToggle, equipmentList = [] }) => {
  if (equipmentList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-500">Đang tải thiết bị...</p>
      </div>
    )
  }
  return (
    <div>
      <h2 className="text-xl font-bold mb-2 text-center">Chọn thiết bị của bạn</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6">Chọn các thiết bị bạn có sẵn để tập luyện</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {equipmentList.map(eq => {
          const isSelected = selectedEquipment.includes(eq.name_en)
          return (
            <button
              key={eq._id}
              onClick={() => onToggle(eq.name_en)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center
                ${isSelected
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-md'}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <FaCheck className="text-white text-xs" />
                </div>
              )}
              <TrainingEquipmentIcon image_url={eq.image_url} name={eq.name} name_en={eq.name_en} />
              <span className="font-semibold text-sm">{eq.name}</span>
              <span className="text-xs text-gray-400 mt-1">{eq.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Step 2: Muscle Selection
const MuscleStep = ({ selectedMuscles, onToggle, muscleGroups = [] }) => {
  const [hoveredMuscle, setHoveredMuscle] = useState(null)

  // Build label map from DB data
  const muscleLabels = useMemo(() => {
    const labels = { ...FALLBACK_LABELS }
    muscleGroups.forEach(mg => { labels[mg.name_en] = mg.name })
    return labels
  }, [muscleGroups])

  const allMuscleKeys = useMemo(() => muscleGroups.map(mg => mg.name_en), [muscleGroups])

  const resolveSvgToGroupKey = useCallback((svgId) => {
    if (Object.prototype.hasOwnProperty.call(SVG_TO_MUSCLE_MAP, svgId)) {
      const mapped = SVG_TO_MUSCLE_MAP[svgId]
      return mapped === null ? null : mapped
    }
    if (allMuscleKeys.includes(svgId)) return svgId
    const matched = muscleGroups.find(mg => (mg.body_part_ids || []).includes(svgId))
    if (matched) return matched.name_en
    if (svgId === 'neck') return 'trapezius'
    return null
  }, [allMuscleKeys, muscleGroups])

  const bodyData = useMemo(() => {
    return selectedMuscles.map(nameEn => {
      const mg = muscleGroups.find(m => m.name_en === nameEn)
      const fromDb = (mg?.body_part_ids || []).filter(Boolean)
      let muscles = fromDb.length ? [...fromDb] : [nameEn]
      const extras = HIGHLIGHT_EXTRAS_BY_GROUP[nameEn]
      if (extras) {
        for (const id of extras) {
          if (!muscles.includes(id)) muscles.push(id)
        }
      }
      return {
        name: muscleLabels[nameEn] || nameEn,
        muscles
      }
    })
  }, [selectedMuscles, muscleLabels, muscleGroups])

  const handleClick = useCallback(({ muscle }) => {
    const groupKey = resolveSvgToGroupKey(muscle)
    if (groupKey == null) return
    onToggle(groupKey)
  }, [onToggle, resolveSvgToGroupKey])

  const handleMouseOver = useCallback((e) => {
    const target = e.target
    if (target.tagName === 'polygon' || target.tagName === 'path') {
      const muscleId = target.getAttribute('data-muscle') || target.id
      if (!muscleId) return
      const groupKey = resolveSvgToGroupKey(muscleId)
      if (groupKey == null) return
      setHoveredMuscle(groupKey)
    }
  }, [resolveSvgToGroupKey])

  return (
    <div>
      <h2 className="text-xl font-bold mb-2 text-center">Chọn nhóm cơ muốn tập</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-2">Click vào phần cơ thể để chọn nhóm cơ</p>

      {/* Fixed-height area for selected muscles + hover tooltip to prevent body model shift */}
      <div className="min-h-[60px] flex flex-col items-center justify-center mb-2">
        {selectedMuscles.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedMuscles.map(m => (
              <span key={m} className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                {muscleLabels[m] || m}
                <button onClick={() => onToggle(m)} className="ml-2 hover:text-red-500">
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Chưa chọn nhóm cơ nào</p>
        )}
        {hoveredMuscle && (
          <span className="mt-1 inline-block px-3 py-1 bg-gray-800 text-white text-xs rounded-full">
            {muscleLabels[hoveredMuscle] || hoveredMuscle}
          </span>
        )}
      </div>

      {/* Body SVG models */}
      <style>{`
        .body-model-container .rbh polygon,
        .body-model-container .rbh path {
          cursor: pointer;
          transition: opacity 0.2s ease, fill 0.2s ease;
          stroke: #e5e7eb;
          stroke-width: 0.3;
        }
        .body-model-container .rbh polygon:hover,
        .body-model-container .rbh path:hover {
          opacity: 0.7;
          filter: brightness(1.2);
          stroke: #3B82F6;
          stroke-width: 1;
        }
      `}</style>

      <div className="flex justify-center gap-8 flex-wrap" onMouseOver={handleMouseOver} onMouseOut={() => setHoveredMuscle(null)}>
        <div className="text-center body-model-container">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Mặt trước
          </p>
          <Model
            data={bodyData}
            style={{ width: '18rem' }}
            onClick={handleClick}
            type="anterior"
            highlightedColors={['#3B82F6', '#2563EB']}
            bodyColor="#D1D5DB"
          />
        </div>
        <div className="text-center body-model-container">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Mặt sau
          </p>
          <Model
            data={bodyData}
            style={{ width: '18rem' }}
            onClick={handleClick}
            type="posterior"
            highlightedColors={['#3B82F6', '#2563EB']}
            bodyColor="#D1D5DB"
          />
        </div>
      </div>
    </div>
  )
}

// Step 3: Exercise List
const ExerciseListStep = ({ exercises, isLoading, selectedExercises, onToggle, onReorder }) => {
  const [detailEx, setDetailEx] = useState(null)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-500">Đang tìm bài tập phù hợp...</p>
      </div>
    )
  }

  const onDragEnd = (result) => {
    if (!result.destination) return
    const items = Array.from(selectedExercises)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    onReorder(items)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2 text-center">Danh sách bài tập</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
        Tìm thấy <strong className="text-blue-600">{exercises.length}</strong> bài tập.
        Đã chọn <strong className="text-green-600">{selectedExercises.length}</strong>.
      </p>

      <ExerciseDetailModal exercise={detailEx} onClose={() => setDetailEx(null)} />

      {/* Selected exercises with drag-drop */}
      {selectedExercises.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">📌 Đã chọn — kéo để sắp xếp lại</p>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="selected-exercises">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                  {selectedExercises.map((ex, idx) => (
                    <Draggable key={ex._id} draggableId={ex._id} index={idx}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-900/20 transition-shadow
                            ${snapshot.isDragging ? 'shadow-xl ring-2 ring-green-400' : ''}`}>
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-green-400 hover:text-green-600">
                            <FaGripVertical />
                          </div>
                          <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{ex.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{ex.name_vi}</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDetailEx(ex) }} className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition flex-shrink-0" title="Chi tiết bài tập">
                            <FaInfoCircle className="text-sm" />
                          </button>
                          <button type="button" onClick={() => onToggle(ex)} className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 text-xs" title="Bỏ chọn">
                            <FaTimes />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* All exercises */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tất cả bài tập</p>
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {exercises.map((ex) => {
          const isSelected = selectedExercises.some(s => s._id === ex._id)
          return (
            <div key={ex._id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md
                ${isSelected
                  ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 opacity-60'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => onToggle(ex)}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all
                  ${isSelected ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                  {isSelected ? <FaCheck /> : <GiBiceps />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{ex.name}</p>
                  <p className="text-xs text-gray-400 truncate">{ex.name_vi}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold
                  ${ex.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                    ex.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'}`}>
                  {formatExerciseDifficultyVi(ex.difficulty)}
                </span>
                {ex.default_sets?.length > 0 && (
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-lg text-[10px] font-semibold">
                    {ex.default_sets.length}s · {ex.default_sets[0]?.reps}r
                  </span>
                )}
                <button onClick={(e) => { e.stopPropagation(); setDetailEx(ex) }}
                  className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition" title="Xem chi tiết">
                  <FaInfoCircle />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Smart Step 5: AI-suggested exercises with kcal tracking
const SmartExerciseSuggestStep = ({ suggestData, selectedExercises, onChangeSelected, onConfirm, onBack, targetKcal }) => {
  const [showAll, setShowAll] = useState(false)
  const [detailEx, setDetailEx] = useState(null)
  const allExercises = suggestData?.all_exercises || []

  const totalKcal = selectedExercises.reduce((sum, ex) => sum + (ex.estimated_kcal || 0), 0)
  const pct = Math.min(100, Math.round((totalKcal / targetKcal) * 100))
  const isEnough = totalKcal >= targetKcal

  const toggleEx = (ex) => {
    const already = selectedExercises.some(s => s._id === ex._id)
    if (already) {
      onChangeSelected(selectedExercises.filter(s => s._id !== ex._id))
    } else {
      onChangeSelected([...selectedExercises, ex])
    }
  }

  const notSelected = allExercises.filter(ex => !selectedExercises.some(s => s._id === ex._id))

  const onDragEndSmart = (result) => {
    if (!result.destination) return
    const items = Array.from(selectedExercises)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    onChangeSelected(items)
  }

  return (
    <div>
      <ExerciseDetailModal exercise={detailEx} onClose={() => setDetailEx(null)} />
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-2">
          <FaBrain /> Gợi ý bài tập thông minh
        </div>
        <h2 className="text-xl font-bold mb-1">Bài tập được gợi ý cho bạn</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Có thể thêm, bỏ hoặc sắp xếp lại bài tập</p>
      </div>

      {/* Kcal Progress */}
      <div className={`rounded-xl p-4 mb-4 ${isEnough ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tổng kcal đã chọn</span>
          <span className={`text-lg font-black ${isEnough ? 'text-green-600' : 'text-orange-600'}`}>
            {totalKcal} / {targetKcal} kcal
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isEnough ? 'bg-green-500' : 'bg-orange-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs mt-1.5 text-gray-500 text-right">
          {isEnough ? '✅ Đạt mục tiêu!' : `⚡ Còn thiếu ${targetKcal - totalKcal} kcal`}
        </p>
      </div>

      {/* Selected exercises with drag-drop */}
      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">📌 Đã chọn ({selectedExercises.length} bài) — kéo để sắp xếp lại</p>
      <div className="mb-4">
        {selectedExercises.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Chưa có bài tập nào được chọn</p>
        )}
        {selectedExercises.length > 0 && (
          <DragDropContext onDragEnd={onDragEndSmart}>
            <Droppable droppableId="smart-selected-exercises">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                  {selectedExercises.map((ex, idx) => (
                    <Draggable key={ex._id} draggableId={`smart-${ex._id}`} index={idx}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-900/20 transition-shadow
                            ${snapshot.isDragging ? 'shadow-xl ring-2 ring-green-400' : ''}`}>
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-green-400 hover:text-green-600">
                            <FaGripVertical />
                          </div>
                          <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{ex.name}</p>
                            <p className="text-[10px] text-gray-400">{ex.name_vi}</p>
                          </div>
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg flex-shrink-0">🔥 {ex.estimated_kcal} kcal</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDetailEx(ex) }} className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition flex-shrink-0" title="Chi tiết bài tập">
                            <FaInfoCircle className="text-sm" />
                          </button>
                          <button type="button" onClick={() => toggleEx(ex)} className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 text-xs flex-shrink-0">
                            <FaTimes />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add more exercises */}
      {notSelected.length > 0 && (
        <div>
          <button onClick={() => setShowAll(v => !v)}
            className="w-full py-2 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition mb-2">
            <FaPlus /> {showAll ? 'Ẩn bớt' : `Thêm bài tập khác (${notSelected.length})`}
          </button>
          {showAll && (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {notSelected.map(ex => (
                <div key={ex._id} className="flex items-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleEx(ex)}>
                    <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm flex-shrink-0">
                      <GiBiceps className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{ex.name}</p>
                      <p className="text-xs text-gray-400 truncate">{ex.name_vi}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${ex.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : ex.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {formatExerciseDifficultyVi(ex.difficulty)}
                      </span>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">🔥 {ex.estimated_kcal}</span>
                      <FaPlus className="text-blue-500 text-xs" />
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setDetailEx(ex) }} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition flex-shrink-0" title="Chi tiết bài tập">
                    <FaInfoCircle className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isEnough && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">⚠️ Tổng kcal chưa đạt mục tiêu. Bạn có thể thêm bài tập hoặc tiếp tục nếu muốn.</p>
        </div>
      )}

      <div className="flex gap-3 mt-5">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <FaChevronLeft /> Quay lại
        </button>
        <button onClick={() => onConfirm(selectedExercises)} disabled={selectedExercises.length === 0}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 shadow-lg disabled:opacity-40 transition">
          <FaDumbbell /> Chuẩn bị tập ({selectedExercises.length})
        </button>
      </div>
    </div>
  )
}

// Step 4: Setup - Review and edit sets before starting (no timer)
const SetupStep = ({ selectedExercises, onStartWorkout, onBack, onSave }) => {
  const [exerciseSets, setExerciseSets] = useState(() =>
    selectedExercises.map(ex => ({
      exercise_id: ex._id,
      exercise_name: ex.name,
      exercise_name_vi: ex.name_vi,
      calories_per_unit_default: ex.default_sets?.[0]?.calories_per_unit ?? 10,
      duration_default: ex.duration_default,
      rest_time_default: ex.rest_time_default,
      sets: (ex.default_sets && ex.default_sets.length > 0)
        ? ex.default_sets.map(s => ({ ...s, completed: false }))
        : [{ set_number: 1, reps: 10, weight: 1, calories_per_unit: 10, completed: false }]
    }))
  )
  const [expandedEx, setExpandedEx] = useState(0)

  const updateSet = (exIdx, setIdx, field, value) => {
    setExerciseSets(prev => {
      const u = [...prev]
      u[exIdx] = { ...u[exIdx], sets: u[exIdx].sets.map((s, i) => i === setIdx ? { ...s, [field]: Number(value) } : s) }
      return u
    })
  }
  const addSet = (exIdx) => {
    setExerciseSets(prev => {
      const u = [...prev]; const last = u[exIdx].sets[u[exIdx].sets.length - 1]
      u[exIdx] = { ...u[exIdx], sets: [...u[exIdx].sets, { set_number: u[exIdx].sets.length + 1, reps: last?.reps || 10, weight: last?.weight || 1, calories_per_unit: last?.calories_per_unit ?? 10, completed: false }] }
      return u
    })
  }
  const dupSet = (exIdx, setIdx) => {
    setExerciseSets(prev => {
      const u = [...prev]; const s = u[exIdx].sets[setIdx]
      const newSets = [...u[exIdx].sets]; newSets.splice(setIdx + 1, 0, { ...s, completed: false })
      u[exIdx] = { ...u[exIdx], sets: newSets.map((s, i) => ({ ...s, set_number: i + 1 })) }
      return u
    })
  }
  const removeSet = (exIdx, setIdx) => {
    setExerciseSets(prev => {
      const u = [...prev]; if (u[exIdx].sets.length <= 1) return prev
      u[exIdx] = { ...u[exIdx], sets: u[exIdx].sets.filter((_, i) => i !== setIdx).map((s, i) => ({ ...s, set_number: i + 1 })) }
      return u
    })
  }

  const totalSets = exerciseSets.reduce((acc, ex) => acc + ex.sets.length, 0)

  return (
    <div>
      <h2 className="text-xl font-bold mb-1 text-center">Chuẩn bị tập luyện</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-4 text-sm">
        Chỉnh sửa set tập cho phù hợp. Nhấn <strong className="text-green-600">Bắt đầu tập</strong> để bắt đầu tính giờ.
      </p>
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full text-sm">
          <FaDumbbell className="text-blue-600" /> {exerciseSets.length} bài tập • {totalSets} sets
        </span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {exerciseSets.map((ex, exIdx) => (
          <div key={exIdx} className="border rounded-xl overflow-hidden dark:border-gray-700">
            <button onClick={() => setExpandedEx(expandedEx === exIdx ? -1 : exIdx)}
              className={`w-full flex items-center justify-between p-3 text-left transition ${expandedEx === exIdx ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{exIdx + 1}</span>
                <div>
                  <p className="font-medium text-sm">{ex.exercise_name}</p>
                  {ex.exercise_name_vi && <p className="text-xs text-gray-400">{ex.exercise_name_vi}</p>}
                </div>
              </div>
              <span className="text-xs text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">{ex.sets.length} sets</span>
            </button>
            {expandedEx === exIdx && (
              <div className="p-4">
                {/* Set table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 mb-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="px-3 py-2 text-[11px] font-bold text-gray-500 text-center w-12">SET</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-gray-500 text-center">Reps (S&#7889; l&#7847;n)</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-gray-500 text-center">Weight (M&#7913;c t&#7841;)</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-orange-500 text-center">kcal</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {ex.sets.map((set, si) => {
                        const kcal = ((set.reps || 0) * (set.weight || 0) * (set.calories_per_unit ?? 10))
                        return (
                          <tr key={si} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition">
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 text-xs font-bold">{set.set_number}</span>
                            </td>
                            <td className="px-2 py-2">
                              <input type="number" value={set.reps} onChange={e => updateSet(exIdx, si, 'reps', e.target.value)} min={1}
                                onBlur={e => updateSet(exIdx, si, 'reps', Math.max(1, Number(e.target.value) || 1))}
                                className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-center focus:ring-2 focus:ring-blue-300 outline-none" />
                            </td>
                            <td className="px-2 py-2">
                              <div className="relative">
                                <input type="number" value={set.weight} onChange={e => updateSet(exIdx, si, 'weight', e.target.value)} min={1} step={0.5}
                                  onBlur={e => updateSet(exIdx, si, 'weight', Math.max(1, Number(e.target.value) || 1))}
                                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-center focus:ring-2 focus:ring-blue-300 outline-none pr-8" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">kg</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="font-bold text-orange-600">{kcal.toFixed(0)}</span>
                              <span className="text-[10px] text-orange-400 ml-0.5">kcal</span>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button onClick={() => removeSet(exIdx, si)} title="X&#243;a" className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition text-xs"><FaTrash /></button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Total + Add */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-600 font-semibold">
                    &#128293; T&#7893;ng: {ex.sets.reduce((a, s) => a + (s.reps || 0) * (s.weight || 0) * (s.calories_per_unit ?? 10), 0).toFixed(0)} kcal
                  </span>
                  <button onClick={() => addSet(exIdx)} className="px-3 py-1.5 border border-dashed border-blue-300 rounded-lg text-blue-600 text-xs flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                    <FaPlus /> Th&#234;m set
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-5 flex-wrap">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <FaChevronLeft /> Quay l&#7841;i
        </button>
        {onSave && (
          <button onClick={() => onSave(exerciseSets)}
            className="flex-1 py-3 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition">
            <FaBookmark /> L&#432;u b&#224;i t&#7853;p
          </button>
        )}
        <button onClick={() => onStartWorkout(exerciseSets)}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 shadow-lg text-lg transition">
          <FaPlay /> B&#7855;t &#273;&#7847;u t&#7853;p!
        </button>
      </div>
    </div>
  )
}

// Step 5: Active Workout Session (timer running) — Set-by-Set with Time Gate
const WorkoutSessionStep = ({ exerciseSets: initialSets, sessionId, onComplete, onQuit }) => {
  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [exerciseSets, setExerciseSets] = useState(initialSets)
  const [timer, setTimer] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Per-set time gate: track when each set becomes "active" (startTime)
  const [setStartTimes, setSetStartTimes] = useState({}) // key: "exIdx-setIdx" => timestamp
  const [now, setNow] = useState(Date.now())
  // Track total paused time per set to freeze time gate during pause
  const [pauseStartTime, setPauseStartTime] = useState(null) // when pause started
  const [setPausedDurations, setSetPausedDurations] = useState({}) // key: "exIdx-setIdx" => accumulated ms paused

  // Rest timer between sets
  const [restCountdown, setRestCountdown] = useState(0)
  const [restDurationBase, setRestDurationBase] = useState(1)
  const [isResting, setIsResting] = useState(false)

  // Giây/rep từ Admin (duration_default), tối thiểu 1. Giá trị > 25 (dữ liệu cũ kiểu 30–45) coi như 3s/rep.
  const getSecondsPerRep = (ex) => {
    const raw = Number(ex?.duration_default)
    if (!Number.isFinite(raw) || raw < 1) return 3
    if (raw > 25) return 3
    return Math.min(120, Math.max(1, Math.round(raw)))
  }

  const getRestSeconds = (ex) => {
    const raw = Number(ex?.rest_time_default)
    if (!Number.isFinite(raw) || raw < 0) return 0
    return Math.min(600, Math.round(raw))
  }

  // Thời gian tối thiểu mỗi set = (số rep) × (giây/rep do Admin cấu hình), tối thiểu 5 giây
  const getMinTimeForSet = (set, ex) => Math.max((set.reps || 1) * getSecondsPerRep(ex), 5)

  // Main session timer
  React.useEffect(() => {
    let interval
    if (!isPaused) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isPaused])

  // Track pause start/end to accumulate paused durations per set
  React.useEffect(() => {
    if (isPaused) {
      setPauseStartTime(Date.now())
    } else if (pauseStartTime) {
      // Resuming: add paused duration to all active (started but uncompleted) sets
      const pausedMs = Date.now() - pauseStartTime
      setSetPausedDurations(prev => {
        const updated = { ...prev }
        Object.keys(setStartTimes).forEach(key => {
          const [exIdx, setIdx] = key.split('-').map(Number)
          const set = exerciseSets[exIdx]?.sets[setIdx]
          if (set && !set.completed && !set.skipped) {
            updated[key] = (updated[key] || 0) + pausedMs
          }
        })
        return updated
      })
      setPauseStartTime(null)
    }
  }, [isPaused])

  // Tick `now` every second for time gate countdowns (only when not paused)
  React.useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [isPaused])

  // Auto-start tracking the first uncompleted set of current exercise
  React.useEffect(() => {
    const ex = exerciseSets[currentExIndex]
    if (!ex) return
    const firstUncompleted = ex.sets.findIndex(s => !s.completed && !s.skipped)
    if (firstUncompleted === -1) return
    const key = `${currentExIndex}-${firstUncompleted}`
    if (!setStartTimes[key]) {
      setSetStartTimes(prev => ({ ...prev, [key]: Date.now() }))
    }
  }, [currentExIndex, exerciseSets])

  // Rest timer countdown
  React.useEffect(() => {
    if (!isResting || restCountdown <= 0) return
    const interval = setInterval(() => {
      setRestCountdown(prev => {
        if (prev <= 1) {
          setIsResting(false)
          // Start tracking the next uncompleted set
          const ex = exerciseSets[currentExIndex]
          if (ex) {
            const nextIdx = ex.sets.findIndex(s => !s.completed && !s.skipped)
            if (nextIdx !== -1) {
              const key = `${currentExIndex}-${nextIdx}`
              setSetStartTimes(prev2 => ({ ...prev2, [key]: Date.now() }))
            }
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isResting, restCountdown, currentExIndex, exerciseSets])

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const currentExercise = exerciseSets[currentExIndex]
  const isCurrentCompleted = currentExercise?.sets.every(s => s.completed || s.skipped)
  const completedExCount = exerciseSets.filter(ex => ex.sets.every(s => s.completed || s.skipped)).length
  const completedSetCount = currentExercise?.sets.filter(s => s.completed).length || 0
  const skippedSetCount = currentExercise?.sets.filter(s => s.skipped).length || 0
  const allDone = completedExCount === exerciseSets.length

  const totalCalories = useMemo(() => {
    let cal = 0
    exerciseSets.forEach(ex => { ex.sets.forEach(s => { if (s.completed) cal += (s.reps || 0) * (s.weight || 0) * (s.calories_per_unit ?? 10) }) })
    return Math.round(cal)
  }, [exerciseSets])

  // Get remaining gate time for a specific set (accounts for paused time)
  const getGateRemaining = (exIdx, setIdx) => {
    const key = `${exIdx}-${setIdx}`
    const start = setStartTimes[key]
    if (!start) return Infinity
    const set = exerciseSets[exIdx]?.sets[setIdx]
    if (!set) return Infinity
    const ex = exerciseSets[exIdx]
    const minTime = getMinTimeForSet(set, ex)
    const pausedMs = setPausedDurations[key] || 0
    // If currently paused, also add current pause duration
    const currentPauseMs = (isPaused && pauseStartTime) ? (Date.now() - pauseStartTime) : 0
    const elapsed = Math.floor((now - start - pausedMs - currentPauseMs) / 1000)
    return Math.max(minTime - elapsed, 0)
  }

  // Check if a set can be completed (time gate passed + it's the next uncompleted set)
  const canCompleteSet = (setIdx) => {
    const set = currentExercise?.sets[setIdx]
    if (!set || set.completed || set.skipped) return false
    if (isResting || isPaused) return false
    // Must be the first uncompleted set (sequential order)
    const firstUncompleted = currentExercise.sets.findIndex(s => !s.completed && !s.skipped)
    if (setIdx !== firstUncompleted) return false
    return getGateRemaining(currentExIndex, setIdx) === 0
  }

  // Complete a single set
  const completeSet = (setIdx) => {
    if (!canCompleteSet(setIdx)) return

    setExerciseSets(prev => {
      const updated = [...prev]
      updated[currentExIndex] = {
        ...updated[currentExIndex],
        sets: updated[currentExIndex].sets.map((s, i) =>
          i === setIdx ? { ...s, completed: true } : s
        )
      }
      return updated
    })

    // Check if there are more uncompleted sets in this exercise
    const remainingUncompleted = currentExercise.sets.filter((s, i) => i !== setIdx && !s.completed && !s.skipped)
    if (remainingUncompleted.length > 0) {
      const restSec = getRestSeconds(currentExercise)
      const nextIdx = currentExercise.sets.findIndex((s, i) => i > setIdx && !s.completed && !s.skipped)
      if (restSec <= 0 && nextIdx !== -1) {
        const key = `${currentExIndex}-${nextIdx}`
        setSetStartTimes(prev2 => ({ ...prev2, [key]: Date.now() }))
        toast(`Set ${setIdx + 1} hoàn thành!`, { icon: '✅', duration: 2000 })
      } else {
        setRestDurationBase(restSec)
        setRestCountdown(restSec)
        setIsResting(true)
        toast(`Set ${setIdx + 1} hoàn thành! Nghỉ ${restSec}s...`, { icon: '✅', duration: 2000 })
      }
    } else {
      // All sets done for this exercise
      toast.success(`Hoàn thành: ${currentExercise.exercise_name} 💪`)
      // Auto-advance to next uncompleted exercise
      const nextIdx = exerciseSets.findIndex((ex, i) => i > currentExIndex && !ex.sets.every(s => s.completed || s.skipped))
      if (nextIdx !== -1) {
        setTimeout(() => setCurrentExIndex(nextIdx), 500)
      }
    }
  }

  // Skip (drop) the active set — user can't finish it
  const skipSet = (setIdx) => {
    const set = currentExercise?.sets[setIdx]
    if (!set || set.completed || set.skipped) return
    // Must be the active (first uncompleted) set
    const firstUncompleted = currentExercise.sets.findIndex(s => !s.completed && !s.skipped)
    if (setIdx !== firstUncompleted) return

    setExerciseSets(prev => {
      const updated = [...prev]
      updated[currentExIndex] = {
        ...updated[currentExIndex],
        sets: updated[currentExIndex].sets.map((s, i) =>
          i === setIdx ? { ...s, skipped: true } : s
        )
      }
      return updated
    })

    toast(`Set ${setIdx + 1} đã bỏ qua`, { icon: '⏭️', duration: 1500 })

    // Check remaining
    const remainingUncompleted = currentExercise.sets.filter((s, i) => i !== setIdx && !s.completed && !s.skipped)
    if (remainingUncompleted.length > 0) {
      // No rest timer for skipped sets — go straight to next
      const nextIdx = currentExercise.sets.findIndex((s, i) => i > setIdx && !s.completed && !s.skipped)
      if (nextIdx !== -1) {
        const key = `${currentExIndex}-${nextIdx}`
        setSetStartTimes(prev => ({ ...prev, [key]: Date.now() }))
      }
    } else {
      // All sets done/skipped for this exercise
      const hasAnyCompleted = currentExercise.sets.some((s, i) => i !== setIdx && s.completed)
      if (hasAnyCompleted) {
        toast.success(`Hoàn thành: ${currentExercise.exercise_name} 💪`)
      }
      const nextExIdx = exerciseSets.findIndex((ex, i) => i > currentExIndex && !ex.sets.every(s => s.completed || s.skipped))
      if (nextExIdx !== -1) {
        setTimeout(() => setCurrentExIndex(nextExIdx), 500)
      }
    }
  }

  // Skip rest timer
  const skipRest = () => {
    setIsResting(false)
    setRestCountdown(0)
    // Start tracking the next uncompleted set
    const nextIdx = currentExercise.sets.findIndex(s => !s.completed && !s.skipped)
    if (nextIdx !== -1) {
      const key = `${currentExIndex}-${nextIdx}`
      setSetStartTimes(prev => ({ ...prev, [key]: Date.now() }))
    }
  }

  // When switching exercise, reset resting state
  const handleSwitchExercise = (idx) => {
    setIsResting(false)
    setRestCountdown(0)
    setCurrentExIndex(idx)
  }

  // Find the active (first uncompleted/non-skipped) set index for current exercise
  const activeSetIdx = currentExercise?.sets.findIndex(s => !s.completed && !s.skipped) ?? -1

  return (
    <div>
      {/* Timer + Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-orange-600 mb-1"><FaStopwatch className="text-xs" /> <span className="text-[10px] font-medium">Thời gian</span></div>
          <div className="text-lg font-bold font-mono">{formatTime(timer)}</div>
          <button onClick={() => setIsPaused(!isPaused)} className="text-[10px] text-orange-600 hover:underline">{isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}</button>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1"><FaRunning className="text-xs" /> <span className="text-[10px] font-medium">Bài tập</span></div>
          <div className="text-lg font-bold">{completedExCount}/{exerciseSets.length}</div>
          <div className="text-[10px] text-gray-500">{exerciseSets.length > 0 ? Math.round(completedExCount / exerciseSets.length * 100) : 0}%</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-red-500 mb-1"><span className="text-xs">🔥</span> <span className="text-[10px] font-medium">kcal đã đốt</span></div>
          <div className="text-lg font-bold">{totalCalories.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">kcal</div>
        </div>
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]"/>
          </div>
          <div className="relative">
            <p className="text-xs font-medium opacity-90 mb-1">⏸ NGHỈ GIỮA SET</p>
            <div className="text-5xl font-black font-mono my-2">{restCountdown}s</div>
            <div className="w-full bg-white/20 rounded-full h-2 mb-3">
              <div className="bg-white rounded-full h-2 transition-all duration-1000" style={{ width: `${(restCountdown / Math.max(restDurationBase, 1)) * 100}%` }}/>
            </div>
            <button onClick={skipRest}
              className="px-5 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium backdrop-blur-sm transition">
              Bỏ qua nghỉ ▶
            </button>
          </div>
        </div>
      )}

      {/* Current exercise card */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 mb-4 ${isCurrentCompleted ? 'border-green-400' : 'border-blue-200 dark:border-blue-800'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-blue-600 font-medium">Bài tập {currentExIndex + 1} / {exerciseSets.length}</p>
            <h3 className="text-lg font-bold">{currentExercise.exercise_name}</h3>
          </div>
          {isCurrentCompleted
            ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Đã hoàn thành</span>
            : <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full text-[10px] font-medium">
                {completedSetCount}/{currentExercise.sets.length} sets
                {skippedSetCount > 0 && <span className="text-gray-400 ml-1">({skippedSetCount} bỏ)</span>}
              </span>
          }
        </div>

        {/* Set-by-set list */}
        <div className="space-y-2">
          {currentExercise.sets.map((set, si) => {
            const isActive = si === activeSetIdx
            const gateRemaining = getGateRemaining(currentExIndex, si)
            const canComplete = canCompleteSet(si)
            const kcal = ((set.reps || 0) * (set.weight || 0) * (set.calories_per_unit ?? 10))

            return (
              <div key={si} className={`rounded-xl border-2 p-3 transition-all duration-300
                ${set.completed
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                  : set.skipped
                    ? 'border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 opacity-60'
                    : isActive
                      ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-600 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 opacity-50'
                }`}>
                <div className="flex items-center gap-3">
                  {/* Set number badge */}
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
                    ${set.completed ? 'bg-green-500 text-white' : set.skipped ? 'bg-gray-400 text-white' : isActive ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                    {set.completed ? <FaCheck /> : set.skipped ? <FaTimes /> : set.set_number}
                  </span>

                  {/* Set info */}
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-3 text-sm ${set.skipped ? 'line-through text-gray-400' : ''}`}>
                      <span className="font-medium">{set.reps} <span className="text-gray-400 text-xs">lần</span></span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="font-medium">{set.weight} <span className="text-gray-400 text-xs">kg</span></span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="font-bold text-orange-600">{kcal.toFixed(0)} <span className="text-[10px] text-orange-400">kcal</span></span>
                    </div>
                    {/* Time gate progress for active set */}
                    {isActive && !set.completed && !set.skipped && gateRemaining > 0 && (
                      <div className="mt-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ${isPaused ? 'opacity-50' : ''}`}
                              style={{ width: `${Math.max(0, (1 - gateRemaining / getMinTimeForSet(set, currentExercise)) * 100)}%` }}/>
                          </div>
                          <span className={`text-[10px] font-mono font-bold w-8 text-right ${isPaused ? 'text-orange-500' : 'text-blue-500'}`}>
                            {isPaused ? '⏸' : `${gateRemaining}s`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {set.completed ? (
                    <span className="text-green-500 text-xs font-bold px-2">XONG</span>
                  ) : set.skipped ? (
                    <span className="text-gray-400 text-xs font-bold px-2">BỎ</span>
                  ) : isActive ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Skip (drop) set button */}
                      <button
                        onClick={() => skipSet(si)}
                        className="px-2 py-2 rounded-lg text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                        title="Bỏ set này">
                        <FaTimes />
                      </button>
                      {/* Complete set button */}
                      <button
                        onClick={() => completeSet(si)}
                        disabled={!canComplete}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all
                          ${canComplete
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}>
                        {canComplete
                          ? <><FaCheck /> Xong</>
                          : <><FaStopwatch /> {gateRemaining}s</>
                        }
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 px-2">Chờ...</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Exercise nav */}
      <div className="flex gap-3 mb-4">
        <button onClick={() => currentExIndex > 0 && handleSwitchExercise(currentExIndex - 1)} disabled={currentExIndex === 0}
          className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium disabled:opacity-30 flex items-center justify-center gap-2">
          <FaChevronLeft /> Bài trước
        </button>
        <button onClick={() => currentExIndex < exerciseSets.length - 1 && handleSwitchExercise(currentExIndex + 1)} disabled={currentExIndex === exerciseSets.length - 1}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-30 flex items-center justify-center gap-2">
          Bài tiếp <FaChevronRight />
        </button>
      </div>

      {/* Exercise list */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Tất cả bài tập:</p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {exerciseSets.map((ex, i) => {
            const done = ex.sets.every(s => s.completed)
            const setsDone = ex.sets.filter(s => s.completed).length
            return (
              <button key={i} onClick={() => handleSwitchExercise(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition
                  ${i === currentExIndex ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 font-medium' :
                    done ? 'bg-green-50 dark:bg-green-900/20 text-green-700' :
                      'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px]
                  ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {done ? <FaCheck /> : i + 1}
                </span>
                <span className="flex-1 truncate">{ex.exercise_name}</span>
                {done
                  ? <span className="text-green-500 text-xs font-bold">✓</span>
                  : setsDone > 0 && <span className="text-[10px] text-blue-500 font-medium">{setsDone}/{ex.sets.length}</span>
                }
              </button>
            )
          })}
        </div>
      </div>

      {/* Single bottom button: Bỏ tập OR Hoàn thành */}
      {allDone ? (
        <button onClick={() => onComplete(exerciseSets, timer)}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 shadow-lg text-lg">
          <FaCheck /> Hoàn thành tập luyện 🎉
        </button>
      ) : (
        <button onClick={onQuit}
          className="w-full py-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 font-medium flex items-center justify-center gap-2 hover:bg-red-200">
          <FaTimes /> Bỏ tập
        </button>
      )}
    </div>
  )
}

// Helper: compute target kcal from metrics
function computeMetrics(metrics) {
  const { weight, height, age, gender, activity_level, duration } = metrics
  const w = Number(weight), h = Number(height), a = Number(age), lvl = Number(activity_level), dur = Number(duration)
  let bmr = gender === 'female'
    ? 447.593 + 9.247 * w + 3.098 * h - 4.330 * a
    : 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
  const tdee = bmr * lvl
  // kcal for session: (tdee / 24h) * (dur / 60) * 1.2, rounded up to nearest 50
  const raw = (tdee / 24) * (dur / 60) * 1.2
  const targetKcal = Math.ceil(raw / 50) * 50
  return { bmr, tdee, targetKcal }
}

// Main Component
export default function Training() {
  const navigate = useNavigate()
  const location = useLocation()
  const [openQuitConfirm, setOpenQuitConfirm] = useState(false)

  // Mode: null (selecting), 'normal', 'smart', 'from_calculator'
  const [mode, setMode] = useState(null)

  // Normal mode step: 0=equipment, 1=muscles, 2=exercises, 3=setup, 4=workout
  const [currentStep, setCurrentStep] = useState(0)

  // Smart mode step: 'metrics','kcal','equipment','muscles','suggest','setup','workout'
  const [smartStep, setSmartStep] = useState('metrics')

  // Outdoor mode
  const [outdoorStep, setOutdoorStep] = useState('setup')
  const [outdoorData, setOutdoorData] = useState(null)

  // Shared state
  const [selectedEquipment, setSelectedEquipment] = useState([])
  const [selectedMuscles, setSelectedMuscles] = useState([])
  const [selectedExercises, setSelectedExercises] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [preparedSets, setPreparedSets] = useState(null)

  // Smart mode state
  const [metrics, setMetrics] = useState({ weight: '', height: '', age: '', gender: 'male', activity_level: 1.55, duration: 45 })
  const [kcalResult, setKcalResult] = useState(null)
  const [suggestData, setSuggestData] = useState(null)
  const [isSuggesting, setIsSuggesting] = useState(false)

  // Saved workouts - loaded from BE API
  const { data: savedWorkoutsData, isLoading: isSavedWorkoutsLoading, refetch: refetchSavedWorkouts } = useQuery({
    queryKey: ['savedWorkouts'],
    queryFn: apiGetSavedWorkouts
  })
  const savedWorkouts = savedWorkoutsData?.data?.result || []

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [currentExerciseSetsToSave, setCurrentExerciseSetsToSave] = useState(null)
  const [showSavedModal, setShowSavedModal] = useState(false)

  // useMutation: tạo bài tập đã lưu
  const createSavedWorkoutMutation = useSafeMutation({
    mutationFn: (data) => apiCreateSavedWorkout(data),
    onSuccess: (_, variables) => {
      refetchSavedWorkouts()
      _cacheWorkouts(savedWorkouts) // update local cache for offline reminder
      toast.success(variables.schedule
        ? `📊 Đã lưu bài tập và cài lịch tập thành công!`
        : `✅ Đã lưu bài tập thành công!`
      )
      setShowSaveModal(false)
      setCurrentExerciseSetsToSave(null)
    },
    onError: () => toast.error('Không thể lưu bài tập. Vui lòng thử lại.')
  })

  // useMutation: xóa bài tập đã lưu
  const deleteSavedWorkoutMutation = useSafeMutation({
    mutationFn: (id) => apiDeleteSavedWorkout(id),
    onSuccess: () => { refetchSavedWorkouts(); toast.success('Đã xóa bài tập') },
    onError: () => toast.error('Không thể xóa. Vui lòng thử lại.')
  })

  // useMutation: cập nhật lịch tập của bài đã lưu
  const updateScheduleMutation = useSafeMutation({
    mutationFn: ({ id, schedule }) => apiUpdateSavedWorkoutSchedule(id, schedule),
    onSuccess: () => { refetchSavedWorkouts(); toast.success('Cập nhật lịch tập thành công!') },
    onError: () => toast.error('Không thể cập nhật lịch')
  })

  const normalSteps = [
    { id: 'equipment', name: 'Thiết bị' },
    { id: 'muscles', name: 'Nhóm cơ' },
    { id: 'exercises', name: 'Bài tập' },
    { id: 'setup', name: 'Chuẩn bị' },
    { id: 'workout', name: 'Tập luyện' }
  ]
  const smartStepsList = [
    { id: 'metrics', name: 'Chỉ số' },
    { id: 'kcal', name: 'Mục tiêu' },
    { id: 'equipment', name: 'Thiết bị' },
    { id: 'muscles', name: 'Nhóm cơ' },
    { id: 'suggest', name: 'Gợi ý' },
    { id: 'setup', name: 'Chuẩn bị' },
    { id: 'workout', name: 'Tập luyện' }
  ]
  // 2-step flow when coming from AI Analysis in Fitness Calculator
  const calcStepsList = [
    { id: 'setup', name: 'Chuẩn bị' },
    { id: 'workout', name: 'Tập luyện' }
  ]
  const [calcStep, setCalcStep] = useState('setup') // 'setup' | 'workout'
  const calcStepIdx = calcStepsList.findIndex(s => s.id === calcStep)
  const smartStepIdx = smartStepsList.findIndex(s => s.id === smartStep)

  // Handle navigation from AI Analysis Modal (Fitness Calculator)
  useEffect(() => {
    if (location.state?.source === 'calculator' && location.state?.exercises?.length > 0) {
      setSelectedExercises(location.state.exercises)
      setMode('from_calculator')
      setCalcStep('setup')
      // Clear navigation state to prevent re-triggering on back
      window.history.replaceState({}, '')
    }
  }, [])

  // Handle navigation from Challenge (Fitness Checkin)
  useEffect(() => {
    if (location.state?.referrer === 'challenge' && location.state?.challengeExercises?.length > 0) {
      const exercises = location.state.challengeExercises.map(ex => ({
        ...ex,
        _id: ex.exercise_id,
        name: ex.exercise_name,
        name_vi: ex.exercise_name_vi || '',
        default_sets: ex.sets?.length > 0 ? ex.sets : [{ set_number: 1, reps: 10, weight: 1, calories_per_unit: 10 }],
        duration_default: ex.duration_default ?? ex.exercise_id?.duration_default,
        rest_time_default: ex.rest_time_default ?? ex.exercise_id?.rest_time_default
      }))
      setSelectedExercises(exercises)
      setMode('from_challenge')
      setCalcStep('setup')
    }
  }, [])

  // Handle navigation from Personal Calendar workout event (Tập ngay button)
  useEffect(() => {
    if (location.state?.fromWorkoutCalendar && location.state?.workout_id) {
      const workoutId = location.state.workout_id
      // savedWorkouts may not be loaded yet; delay until available
      const loadFromCalendar = (workouts) => {
        const found = workouts.find(w => w._id === workoutId || String(w._id) === String(workoutId))
        if (found) {
          const exercises = (found.exercises || []).map(ex => ({
            ...ex,
            _id: ex.exercise_id?._id || ex.exercise_id || ex._id,
            name: ex.exercise_name,
            name_vi: ex.exercise_name_vi || '',
            default_sets: ex.sets
          }))
          setSelectedExercises(exercises)
          setMode('from_saved')
          setCalcStep('setup')
          window.history.replaceState({}, '')
        }
      }
      if (savedWorkouts.length > 0) {
        loadFromCalendar(savedWorkouts)
      } else {
        // Refetch and wait
        refetchSavedWorkouts().then(res => {
          const list = res?.data?.data?.result || []
          loadFromCalendar(list)
        }).catch(() => { })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, savedWorkouts.length])


  // Reminder: khi mở app, kiểm tra hôm nay có lịch tập không (dùng cache localStorage cho offline)
  useEffect(() => {
    // Prevent duplicate reminder per session
    const reminderKey = `workout_reminder_${new Date().toISOString().slice(0, 10)}`
    if (sessionStorage.getItem(reminderKey)) return

    const today = new Date().getDay()
    const todayStr = new Date().toISOString().slice(0, 10)
    const cached = _getCachedWorkouts()
    const workoutsWithSchedule = cached.filter(w => {
      if (!w.schedule?.reminder) return false
      if (!w.schedule.days_of_week?.includes(today)) return false
      const s = w.schedule.start_date, e = w.schedule.end_date
      if (s && todayStr < s) return false
      if (e && todayStr > e) return false
      return true
    })
    if (workoutsWithSchedule.length > 0) {
      const names = workoutsWithSchedule.map(w => w.name).join(', ')
      sessionStorage.setItem(reminderKey, '1')
      setTimeout(() => {
        toast(`📅 Hôm nay bạn có lịch tập: ${names} — lúc ${workoutsWithSchedule[0].schedule.time_of_day || ''}`, {
          duration: 6000, icon: '💪', id: 'workout-reminder'
        })
      }, 1500)
    }
  }, [])

  const { data: equipmentData } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment })
  const equipmentList = equipmentData?.data?.result || []

  const { data: muscleGroupData } = useQuery({ queryKey: ['muscleGroups'], queryFn: getMuscleGroups })
  const muscleGroups = muscleGroupData?.data?.result || []

  const isNormalExStep = mode === 'normal' && currentStep === 2
  const { data: exercisesData, isLoading: isLoadingExercises } = useQuery({
    queryKey: ['exercises', selectedEquipment, selectedMuscles],
    queryFn: () => filterExercises(selectedEquipment, selectedMuscles),
    enabled: isNormalExStep && selectedEquipment.length > 0 && selectedMuscles.length > 0
  })
  const exercises = exercisesData?.data?.result || []

  const createSessionMutation = useSafeMutation({
    mutationFn: (data) => createWorkoutSession(data),
    onSuccess: (res) => { setSessionId(res.data?.result?._id); toast.success('Bắt đầu tập luyện! ⏱️') },
    onError: () => toast.error('Không thể bắt đầu phiên tập.')
  })

  const completeSessionMutation = useSafeMutation({
    mutationFn: ({ id, data }) => completeWorkoutSession(id, data),
    // Navigation is handled by handleComplete to support challenge redirect flow
    onSuccess: () => {},
    onError: () => toast.error('Lỗi khi lưu phiên tập.')
  })

  const toggleEquipment = (id) => setSelectedEquipment(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  const toggleMuscle = (muscle) => setSelectedMuscles(prev => prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle])
  const toggleExercise = (exercise) => setSelectedExercises(prev => prev.some(e => e._id === exercise._id) ? prev.filter(e => e._id !== exercise._id) : [...prev, exercise])
  const reorderExercises = (newList) => setSelectedExercises(newList)

  // Normal mode navigation
  const canGoNextNormal = () => {
    if (currentStep === 0) return selectedEquipment.length > 0
    if (currentStep === 1) return selectedMuscles.length > 0
    if (currentStep === 2) return selectedExercises.length > 0
    return false
  }
  const goNextNormal = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }
  const goBackNormal = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
    else resetToMenu()
  }

  // Smart mode: calculate kcal
  const handleCalculate = () => {
    const { bmr, tdee, targetKcal } = computeMetrics(metrics)
    const actLabel = ACTIVITY_LEVELS.find(l => l.value === metrics.activity_level)?.label || ''
    setKcalResult({ bmr, tdee, targetKcal, duration: metrics.duration, activityLabel: actLabel })
    setSmartStep('kcal')
  }

  // Smart mode: after kcal confirmed, go to equipment
  const handleKcalConfirm = () => {
    setSelectedEquipment([])
    setSmartStep('equipment')
  }

  // Smart mode: equipment done → muscles
  const handleSmartEquipmentNext = () => {
    if (selectedEquipment.length > 0) setSmartStep('muscles')
  }

  // Smart mode: muscles done → fetch suggestions
  const handleSmartMusclesNext = async () => {
    if (selectedMuscles.length === 0) return
    setIsSuggesting(true)
    setSmartStep('suggest')
    try {
      const res = await suggestExercisesByKcal({
        kcal_target: kcalResult.targetKcal,
        equipment: selectedEquipment,
        muscles: selectedMuscles,
        duration_minutes: Number(metrics.duration)
      })
      const data = res.data?.result
      setSuggestData(data)
      setSelectedExercises(data?.suggested || [])
    } catch {
      toast.error('Không thể lấy gợi ý bài tập')
      setSmartStep('muscles')
    } finally {
      setIsSuggesting(false)
    }
  }

  // Smart mode: confirm exercises → go to setup (step 4 = setup)
  const handleSmartConfirmExercises = (exercises) => {
    setSelectedExercises(exercises)
    setSmartStep('setup')
  }

  // Both modes: start workout from setup
  const handleStartWorkout = (editedSets) => {
    setPreparedSets(editedSets)
    const sessionData = {
      equipment_used: selectedEquipment,
      muscles_targeted: selectedMuscles,
      exercises: editedSets.map(ex => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        duration_default: ex.duration_default,
        rest_time_default: ex.rest_time_default
      }))
    }
    if (mode === 'smart' && kcalResult) {
      sessionData.is_smart_mode = true
      sessionData.target_kcal = kcalResult.targetKcal
      sessionData.metrics_input = {
        weight: Number(metrics.weight), height: Number(metrics.height), age: Number(metrics.age),
        gender: metrics.gender, activity_level: metrics.activity_level,
        duration_minutes_target: Number(metrics.duration),
        bmr: kcalResult.bmr, tdee: kcalResult.tdee
      }
    }
    createSessionMutation.mutate(sessionData)
    if (mode === 'normal') setCurrentStep(4)
    else if (mode === 'from_saved' || mode === 'from_challenge') setCalcStep('workout')
    else setSmartStep('workout')
  }

  // Handler: load a saved workout into from_saved mode
  const handleLoadSavedWorkout = (workout) => {
    // Normalize exercises: MongoDB returns exercise_id as ObjectId string inside object
    const exercises = (workout.exercises || []).map(ex => ({
      ...ex,
      _id: ex.exercise_id?._id || ex.exercise_id || ex._id,
      name: ex.exercise_name,
      name_vi: ex.exercise_name_vi || '',
      default_sets: ex.sets,
      duration_default: ex.duration_default ?? ex.exercise_id?.duration_default,
      rest_time_default: ex.rest_time_default ?? ex.exercise_id?.rest_time_default
    }))
    setSelectedExercises(exercises)
    setMode('from_saved')
    setCalcStep('setup')
    setShowSavedModal(false)
  }

  // Handler: open save modal from SetupStep
  const handleOpenSaveModal = (exerciseSets) => {
    setCurrentExerciseSetsToSave(exerciseSets)
    setShowSaveModal(true)
  }

  // Handler: after workout saved (with or without schedule) - calls BE API
  const handleWorkoutSaved = (name, exercises, scheduleOrNull) => {
    createSavedWorkoutMutation.mutate({
      name,
      exercises: exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        exercise_name_vi: ex.exercise_name_vi || '',
        duration_default: ex.duration_default,
        rest_time_default: ex.rest_time_default,
        sets: ex.sets.map(s => ({
          set_number: s.set_number,
          reps: s.reps,
          weight: s.weight,
          calories_per_unit: s.calories_per_unit ?? 10
        }))
      })),
      schedule: scheduleOrNull
    })
  }

  // Handler: mode selection with 'saved' special case
  const handleSelectMode = (selectedMode) => {
    if (selectedMode === 'saved') {
      setShowSavedModal(true)
    } else {
      setMode(selectedMode)
    }
  }

  const handleComplete = async (exerciseSets, timerSeconds = 0) => {
    const challengeId = location.state?.challengeId
    const challengeTitle = location.state?.challengeTitle

    // Calculate total calories and duration from completed sets
    let totalCalories = 0
    exerciseSets.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) totalCalories += (s.reps || 0) * (s.weight || 0) * (s.calories_per_unit ?? 10)
      })
    })
    totalCalories = roundKcal(totalCalories)

    // Duration logic: Use real elapsed time (minimum 1 minute), no estimations
    let finalDurationMin = Math.max(1, Math.round((timerSeconds || 0) / 60))

    // Complete workout session first
    if (sessionId) {
      await completeSessionMutation.mutateAsync({ id: sessionId, data: { exercises: exerciseSets } }).catch(() => {})
    }

    // If came from challenge, record progress
    if (challengeId) {
      try {
        const completed_exercises = exerciseSets.map(ex => {
          const isCompleted = ex.sets.some(s => s.completed && !s.skipped)
          return {
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            completed: isCompleted
          }
        })
        const numCompleted = completed_exercises.filter(e => e.completed).length

        await addChallengeProgress(challengeId, {
          value: numCompleted || 1, // Store number of exercises completed in this session
          notes: `Buổi tập từ Training${challengeTitle ? ': ' + challengeTitle : ''}`,
          duration_minutes: finalDurationMin,
          calories: totalCalories || undefined,
          source: 'workout_session',
          workout_session_id: sessionId || undefined,
          exercises_count: exerciseSets.length,
          completed_exercises
        })
        toast.success('🎉 Phiên tập hoàn thành và đã ghi nhận vào thử thách!')
      } catch (err) {
        toast.success('🎉 Phiên tập hoàn thành!')
        toast.error('Không thể ghi nhận vào thử thách: ' + (err?.response?.data?.message || 'Lỗi không xác định'))
      }
      navigate(`/challenge/${challengeId}`)
      return
    }

    // Normal flow (no challenge)
    toast.success('🎉 Phiên tập hoàn thành! Tuyệt vời!')
    navigate('/training/my-trainings')
  }

  const handleQuit = () => {
    setOpenQuitConfirm(true)
  }

  const confirmQuit = () => {
    toast('Đã hủy phiên tập', { icon: '👋' })
    setMode(null); setCurrentStep(0); setSmartStep('metrics')
    setSelectedEquipment([]); setSelectedMuscles([]); setSelectedExercises([])
    setSessionId(null); setPreparedSets(null); setSuggestData(null); setKcalResult(null)
    setShowSaveModal(false); setCurrentExerciseSetsToSave(null)
    setOpenQuitConfirm(false)
  }

  const resetToMenu = () => {
    setMode(null); setCurrentStep(0); setSmartStep('metrics'); setCalcStep('setup'); setOutdoorStep('setup')
    setSelectedEquipment([]); setSelectedMuscles([]); setSelectedExercises([])
    setPreparedSets(null); setSuggestData(null); setKcalResult(null); setOutdoorData(null)
    setShowSaveModal(false); setCurrentExerciseSetsToSave(null); setShowSavedModal(false)
  }

  // Determine what step indicator to show and for which mode
  const showSmartWorkoutHeader = mode === 'smart' && !['workout'].includes(smartStep)
  const showNormalHeader = mode === 'normal' && currentStep < 4
  const showCalcHeader = mode === 'from_calculator' || mode === 'from_saved' || mode === 'from_challenge'

  return (
    <div>
      {/* Page Header - full width */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <GiWeightLiftingUp className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {mode === 'from_challenge' ? `\u{1F3CB}\uFE0F ${location.state?.challengeTitle || 'Tập luyện thử thách'}` : mode === 'outdoor' ? 'Hoạt động ngoài trời' : 'Tập luyện'}
              </h1>
              <p className="text-white/75 text-xs mt-0.5">
                {mode === 'from_challenge' ? 'Hoàn thành bài tập để ghi nhận tiến độ thử thách' : mode === 'outdoor' ? 'Ghi quãng đường và tốc độ khi bạn di chuyển' : 'Xây dựng bài tập cá nhân hóa theo mục tiêu của bạn'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <button onClick={() => navigate('/training/my-trainings')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition backdrop-blur">
              📋 Lịch sử tập luyện
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Step indicators */}
        {showNormalHeader && <StepIndicator currentStep={currentStep} steps={normalSteps} />}
        {showSmartWorkoutHeader && <StepIndicator currentStep={smartStepIdx} steps={smartStepsList} />}
        {showCalcHeader && <StepIndicator currentStep={calcStepIdx} steps={calcStepsList} />}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          {/* Mode selection */}
          {mode === null && <ModeSelection onSelect={handleSelectMode} savedWorkouts={savedWorkouts} />}

          {/* ── NORMAL MODE ── */}
          {mode === 'normal' && currentStep === 0 && (
            <EquipmentStep selectedEquipment={selectedEquipment} onToggle={toggleEquipment} equipmentList={equipmentList} />
          )}
          {mode === 'normal' && currentStep === 1 && (
            <MuscleStep selectedMuscles={selectedMuscles} onToggle={toggleMuscle} muscleGroups={muscleGroups} />
          )}
          {mode === 'normal' && currentStep === 2 && (
            <ExerciseListStep exercises={exercises} isLoading={isLoadingExercises} selectedExercises={selectedExercises} onToggle={toggleExercise} onReorder={reorderExercises} />
          )}
          {mode === 'normal' && currentStep === 3 && selectedExercises.length > 0 && (
            <SetupStep selectedExercises={selectedExercises} onStartWorkout={handleStartWorkout} onBack={goBackNormal} onSave={handleOpenSaveModal} />
          )}
          {mode === 'normal' && currentStep === 4 && preparedSets && (
            <WorkoutSessionStep exerciseSets={preparedSets} sessionId={sessionId} onComplete={handleComplete} onQuit={handleQuit} />
          )}

          {/* ── FROM CALCULATOR MODE (AI Analysis → 2 steps only) ── */}
          {mode === 'from_calculator' && calcStep === 'setup' && selectedExercises.length > 0 && (
            <SetupStep
              selectedExercises={selectedExercises}
              onSave={handleOpenSaveModal}
              onStartWorkout={(editedSets) => {
                setPreparedSets(editedSets)
                const sessionData = {
                  equipment_used: [],
                  muscles_targeted: [],
                  exercises: editedSets.map(ex => ({
                    exercise_id: ex.exercise_id,
                    exercise_name: ex.exercise_name,
                    sets: ex.sets,
                    duration_default: ex.duration_default,
                    rest_time_default: ex.rest_time_default
                  })),
                  source: 'calculator'
                }
                createSessionMutation.mutate(sessionData)
                setCalcStep('workout')
              }}
              onBack={resetToMenu}
            />
          )}
          {mode === 'from_calculator' && calcStep === 'workout' && preparedSets && (
            <WorkoutSessionStep exerciseSets={preparedSets} sessionId={sessionId} onComplete={handleComplete} onQuit={handleQuit} />
          )}

          {/* ── OUTDOOR MODE ── */}
          {mode === 'outdoor' && outdoorStep === 'setup' && (
            <OutdoorSetupStep 
              onStart={(data) => {
                setOutdoorData(data)
                setOutdoorStep('tracking')
              }} 
              onBack={() => setMode(null)} 
            />
          )}
          {mode === 'outdoor' && outdoorStep === 'tracking' && outdoorData && (
            <OutdoorTrackingStep 
              name={outdoorData.name}
              category={outdoorData.category}
              targetKm={outdoorData.targetKm}
              onDiscard={resetToMenu}
            />
          )}

          {/* ── FROM SAVED MODE (Bài tập đã lưu → 2 steps) ── */}
          {mode === 'from_saved' && calcStep === 'setup' && selectedExercises.length > 0 && (
            <SetupStep
              selectedExercises={selectedExercises}
              onSave={handleOpenSaveModal}
              onStartWorkout={handleStartWorkout}
              onBack={resetToMenu}
            />
          )}
          {mode === 'from_saved' && calcStep === 'workout' && preparedSets && (
            <WorkoutSessionStep exerciseSets={preparedSets} sessionId={sessionId} onComplete={handleComplete} onQuit={handleQuit} />
          )}

          {/* ── FROM CHALLENGE MODE (Thử thách thể dục → 2 steps) ── */}
          {mode === 'from_challenge' && calcStep === 'setup' && selectedExercises.length > 0 && (
            <SetupStep
              selectedExercises={selectedExercises}
              onStartWorkout={handleStartWorkout}
              onBack={() => { navigate(-1) }}
            />
          )}
          {mode === 'from_challenge' && calcStep === 'workout' && preparedSets && (
            <WorkoutSessionStep exerciseSets={preparedSets} sessionId={sessionId} onComplete={handleComplete} onQuit={handleQuit} />
          )}

          {/* ── AI WORKOUT MODE ── */}
          {mode === 'ai_workout' && (
            <AIDescriptionStep
              onConfirm={(exercises) => {
                setSelectedExercises(exercises)
                setMode('from_calculator')
                setCalcStep('setup')
              }}
              onBack={resetToMenu}
            />
          )}

          {/* ── SMART MODE ── */}
          {mode === 'smart' && smartStep === 'metrics' && (
            <MetricsStep metrics={metrics} onChange={(k, v) => setMetrics(m => ({ ...m, [k]: v }))} onCalculate={handleCalculate} />
          )}
          {mode === 'smart' && smartStep === 'kcal' && kcalResult && (
            <KcalResultStep result={kcalResult} onConfirm={handleKcalConfirm} onBack={() => setSmartStep('metrics')} />
          )}
          {mode === 'smart' && smartStep === 'equipment' && (
            <EquipmentStep selectedEquipment={selectedEquipment} onToggle={toggleEquipment} equipmentList={equipmentList} />
          )}
          {mode === 'smart' && smartStep === 'muscles' && (
            <MuscleStep selectedMuscles={selectedMuscles} onToggle={toggleMuscle} muscleGroups={muscleGroups} />
          )}
          {mode === 'smart' && smartStep === 'suggest' && (
            isSuggesting ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4" />
                <p className="text-gray-500">Đang tìm bài tập phù hợp với mục tiêu {kcalResult?.targetKcal} kcal...</p>
              </div>
            ) : (
              <SmartExerciseSuggestStep
                suggestData={suggestData}
                selectedExercises={selectedExercises}
                onChangeSelected={setSelectedExercises}
                onConfirm={handleSmartConfirmExercises}
                onBack={() => setSmartStep('muscles')}
                targetKcal={kcalResult?.targetKcal || 0}
              />
            )
          )}
          {mode === 'smart' && smartStep === 'setup' && selectedExercises.length > 0 && (
            <SetupStep selectedExercises={selectedExercises} onStartWorkout={handleStartWorkout} onBack={() => setSmartStep('suggest')} onSave={handleOpenSaveModal} />
          )}
          {mode === 'smart' && smartStep === 'workout' && preparedSets && (
            <WorkoutSessionStep exerciseSets={preparedSets} sessionId={sessionId} onComplete={handleComplete} onQuit={handleQuit} />
          )}
        </div>

        {/* Normal mode nav buttons (steps 0-2) */}
        {mode === 'normal' && currentStep < 3 && (
          <div className="flex gap-4">
            <button onClick={goBackNormal}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
              <FaChevronLeft /> Quay lại
            </button>
            <button onClick={goNextNormal} disabled={!canGoNextNormal()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold disabled:opacity-30 flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              {currentStep === 2 ? (<><FaDumbbell /> Chuẩn bị tập ({selectedExercises.length} bài)</>) : (<>Tiếp tục <FaChevronRight /></>)}
            </button>
          </div>
        )}

        {/* Smart mode nav buttons for equipment & muscles steps */}
        {mode === 'smart' && smartStep === 'equipment' && (
          <div className="flex gap-4">
            <button onClick={() => setSmartStep('kcal')}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
              <FaChevronLeft /> Quay lại
            </button>
            <button onClick={handleSmartEquipmentNext} disabled={selectedEquipment.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg">
              Tiếp tục <FaChevronRight />
            </button>
          </div>
        )}
        {mode === 'smart' && smartStep === 'muscles' && (
          <div className="flex gap-4">
            <button onClick={() => setSmartStep('equipment')}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
              <FaChevronLeft /> Quay lại
            </button>
            <button onClick={handleSmartMusclesNext} disabled={selectedMuscles.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg">
              <FaBrain /> Lấy gợi ý bài tập
            </button>
          </div>
        )}

      </div>

      {/* ── MODALS ── */}
      {showSaveModal && currentExerciseSetsToSave && (
        <SaveWorkoutModal
          exerciseSets={currentExerciseSetsToSave}
          onSaved={handleWorkoutSaved}
          onClose={() => { setShowSaveModal(false); setCurrentExerciseSetsToSave(null) }}
        />
      )}
      {showSavedModal && (
        <SavedWorkoutsModal
          workouts={savedWorkouts}
          isLoading={isSavedWorkoutsLoading}
          onLoad={handleLoadSavedWorkout}
          onClose={() => setShowSavedModal(false)}
          onDelete={(id) => deleteSavedWorkoutMutation.mutate(id)}
          onUpdateSchedule={(id, schedule) => updateScheduleMutation.mutate({ id, schedule })}
        />
      )}
      {openQuitConfirm && (
        <ConfirmBox
          title='Bỏ phiên tập'
          subtitle='Bạn có chắc muốn bỏ phiên tập này?'
          confirmText='Bỏ tập'
          cancelText='Tiếp tục'
          handleConfirm={confirmQuit}
          closeModal={() => setOpenQuitConfirm(false)}
          confirmButtonClass='bg-red-600 hover:bg-red-700'
        />
      )}
    </div>
  )
}
