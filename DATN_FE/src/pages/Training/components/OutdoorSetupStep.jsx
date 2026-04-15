import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { FaChevronLeft, FaChevronDown, FaMapMarkerAlt, FaSatelliteDish, FaCrosshairs, FaCheck } from 'react-icons/fa'
import { MdGpsFixed } from 'react-icons/md'
import sportCategoryApi from '../../../apis/sportCategoryApi'
import { getSportIcon } from '../../../utils/sportIcons'

export default function OutdoorSetupStep({ onStart, onBack }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [targetKm, setTargetKm] = useState('')
  const [selectedCatId, setSelectedCatId] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('checking') // 'checking' | 'ok' | 'error'
  const [sportPickerOpen, setSportPickerOpen] = useState(false)

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['sportCategories'],
    queryFn: () => sportCategoryApi.getAll()
  })

  const categories = categoriesData?.data?.result || []
  const filteredCategories = categories.filter(c => c.type === 'Ngoài trời')

  // Check GPS availability on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('checking')
    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus('ok'),
      () => setGpsStatus('error'),
      { timeout: 5000 }
    )
  }, [])

  // Auto-select first category
  useEffect(() => {
    if (filteredCategories.length > 0 && !selectedCatId) {
      const defaultCat = filteredCategories.find(c => c.name.toLowerCase().includes('chạy bộ'))
      const chosen = defaultCat || filteredCategories[0]
      setSelectedCatId(chosen._id)
      setCategory(chosen.name)
    }
  }, [filteredCategories, selectedCatId])

  useEffect(() => {
    if (!sportPickerOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSportPickerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [sportPickerOpen])

  // Get selected category object
  const selectedCategory = useMemo(() => {
    return filteredCategories.find(c => c._id === selectedCatId) || null
  }, [filteredCategories, selectedCatId])

  const handleSelectCategory = (cat) => {
    setSelectedCatId(cat._id)
    setCategory(cat.name)
  }

  const handleStart = () => {
    if (!name.trim()) return
    onStart({
      name: name.trim(),
      category: category,
      targetKm: targetKm ? parseFloat(targetKm) : 0
    })
  }

  const SelectedTriggerIcon = selectedCategory ? getSportIcon(selectedCategory.icon) : null

  return (
    <div className="space-y-6">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 p-5 shadow-lg">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <FaMapMarkerAlt className="text-white text-sm" />
              </div>
              <h2 className="text-xl font-black text-white">Hoạt động ngoài trời</h2>
            </div>
            <p className="text-white/80 text-sm">Chọn môn thể thao, đặt mục tiêu và bắt đầu ghi hoạt động</p>
          </div>
          {/* Trạng thái vị trí (phục vụ ghi lộ trình) */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md ${
            gpsStatus === 'ok' ? 'bg-green-500/30 text-white' :
            gpsStatus === 'error' ? 'bg-red-500/30 text-white' :
            'bg-white/20 text-white'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              gpsStatus === 'ok' ? 'bg-green-300 animate-pulse' :
              gpsStatus === 'error' ? 'bg-red-300' :
              'bg-white/60 animate-pulse'
            }`} />
            <MdGpsFixed className="text-sm" />
            {gpsStatus === 'ok' ? 'Sẵn sàng ghi' : gpsStatus === 'error' ? 'Không lấy được vị trí' : 'Đang kiểm tra vị trí...'}
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
        <div className="absolute -left-4 bottom-0 w-20 h-20 rounded-full bg-white/5" />
      </div>

      {/* ─── Sport picker (mobile: bottom sheet + scroll) ─── */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
          🏅 Chọn môn thể thao
        </p>
        {isLoading ? (
          <div className="h-[3.25rem] rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
        ) : filteredCategories.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Chưa có môn ngoài trời. Vui lòng thêm danh mục trong hệ thống.</p>
        ) : (
          <>
            <button
              type="button"
              id="outdoor-sport-trigger"
              aria-haspopup="dialog"
              aria-expanded={sportPickerOpen}
              onClick={() => setSportPickerOpen(true)}
              className="w-full flex items-center gap-3 min-h-[3.25rem] pl-3 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-left outline-none focus-visible:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-100 dark:focus-visible:ring-orange-900/30 active:scale-[0.99] transition"
            >
              {selectedCategory && SelectedTriggerIcon ? (
                <>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <SelectedTriggerIcon className="text-white text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{selectedCategory.name}</p>
                    {selectedCategory.kcal_per_unit > 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">🔥 {selectedCategory.kcal_per_unit} kcal/km</p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Chạm để đổi môn</p>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-sm text-gray-500">Chọn môn…</span>
              )}
              <FaChevronDown className={`text-gray-400 flex-shrink-0 text-sm transition-transform ${sportPickerOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>

            {sportPickerOpen && typeof document !== 'undefined' && createPortal(
              <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4" role="presentation">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                  aria-label="Đóng"
                  onClick={() => setSportPickerOpen(false)}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="outdoor-sport-sheet-title"
                  className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <h3 id="outdoor-sport-sheet-title" className="text-base font-bold text-gray-900 dark:text-gray-100 pr-2">
                      Chọn môn thể thao
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSportPickerOpen(false)}
                      className="flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition"
                    >
                      Xong
                    </button>
                  </div>
                  <p className="px-4 pt-2 pb-1 text-xs text-gray-500 dark:text-gray-400">
                    Vuốt trong khung bên dưới để xem hết các môn
                  </p>
                  <div
                    className="max-h-[min(58dvh,22rem)] overflow-y-auto overscroll-y-contain px-3 py-2 [scrollbar-width:thin] [scrollbar-color:rgba(251,146,60,0.55)_rgba(0,0,0,0.06)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-orange-400/60 dark:[&::-webkit-scrollbar-thumb]:bg-orange-500/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-700/50"
                  >
                  <ul role="listbox" className="space-y-1.5 pb-1">
                    {filteredCategories.map((cat) => {
                      const RowIcon = getSportIcon(cat.icon)
                      const selected = selectedCatId === cat._id
                      return (
                        <li key={cat._id} role="presentation">
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              handleSelectCategory(cat)
                              setSportPickerOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 min-h-[3.5rem] px-3 py-3 rounded-xl text-left transition-colors touch-manipulation ${
                              selected
                                ? 'bg-orange-50 dark:bg-orange-900/25 ring-2 ring-orange-400/60 dark:ring-orange-500/40'
                                : 'bg-gray-50 dark:bg-gray-800/90 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                            }`}
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              selected
                                ? 'bg-gradient-to-br from-orange-500 to-amber-400 shadow-sm'
                                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                            }`}>
                              <RowIcon className={`text-lg ${selected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0 py-0.5">
                              <p className={`text-sm font-semibold leading-snug ${selected ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                {cat.name}
                              </p>
                              {cat.kcal_per_unit > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">🔥 {cat.kcal_per_unit} kcal/km</p>
                              )}
                            </div>
                            {selected && (
                              <FaCheck className="text-orange-500 dark:text-orange-400 flex-shrink-0 text-sm" aria-hidden />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </>
        )}
      </div>

      {/* ─── Form Fields ─── */}
      <div className="space-y-4">
        {/* Activity Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            ✏️ Tên bài tập <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="VD: Chạy bộ sáng chủ nhật"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition text-sm"
          />
        </div>

        {/* Target Distance */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            🎯 Quãng đường mục tiêu (km)
          </label>
          <div className="relative">
            <input
              type="number"
              value={targetKm}
              onChange={e => setTargetKm(e.target.value)}
              placeholder="Tùy chọn (VD: 5)"
              min="0.1" step="0.1"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 outline-none transition text-sm pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">km</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <FaCrosshairs className="text-[10px]" /> Bỏ trống nếu bạn muốn chạy tự do, không giới hạn quãng đường.
          </p>
        </div>
      </div>

      {/* ─── Selected Summary ─── */}
      {selectedCategory && name.trim() && (
        <div className="bg-gradient-to-r from-gray-50 to-orange-50/50 dark:from-gray-800 dark:to-orange-900/10 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Tóm tắt</p>
          <div className="flex items-center gap-3">
            {(() => {
              const CatIcon = getSportIcon(selectedCategory.icon)
              return (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md flex-shrink-0">
                  <CatIcon className="text-white text-lg" />
                </div>
              )
            })()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{name.trim()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedCategory.name}
                {targetKm ? ` · ${targetKm} km` : ' · Tự do'}
                {selectedCategory.kcal_per_unit > 0 && targetKm ? ` · ~${Math.round(selectedCategory.kcal_per_unit * parseFloat(targetKm || 0))} kcal` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Action Buttons ─── */}
      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm text-gray-700 dark:text-gray-300">
          <FaChevronLeft className="text-xs" /> Quay lại
        </button>
        <button onClick={handleStart} disabled={!name.trim() || !category}
          className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2.5 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-500 shadow-lg hover:shadow-xl transition-all duration-300 text-sm group relative overflow-hidden">
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <FaSatelliteDish className="text-sm relative z-10 group-hover:animate-bounce" />
          <span className="relative z-10">Bắt đầu ghi</span>
        </button>
      </div>
    </div>
  )
}
