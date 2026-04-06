import React, { useState, useEffect } from 'react'
import { previewStravaEvent, importStravaEvent } from '../../../apis/userApi'
import { FaCheck, FaTimes, FaSpinner, FaRunning, FaBiking, FaWalking, FaMapMarkerAlt, FaFire, FaClock } from 'react-icons/fa'
import toast from 'react-hot-toast'
import moment from 'moment'

export default function StravaSyncModal({ isOpen, onClose, eventId, onImportSuccess }) {
  const [activities, setActivities] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (isOpen && eventId) {
      loadPreview()
    }
  }, [isOpen, eventId])

  const loadPreview = async () => {
    try {
      setIsLoading(true)
      setActivities([])
      setSelectedIds([])
      const res = await previewStravaEvent(eventId)
      const data = res.data?.result || []
      setActivities(data)
      setSelectedIds(data.map(a => a.stravaId)) // Auto check all by default
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Không thể tải danh sách Strava')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 hoạt động để nhập')
      return
    }
    
    try {
      setIsImporting(true)
      const res = await importStravaEvent(eventId, selectedIds)
      const { syncedCount, totalDistanceAdded } = res.data?.result || {}
      toast.success(`Đã nạp thành công ${syncedCount} hoạt động (${totalDistanceAdded?.toFixed(2) || 0} km)`)
      if (onImportSuccess) onImportSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Lỗi khi nhập dữ liệu')
    } finally {
      setIsImporting(false)
    }
  }

  if (!isOpen) return null

  const getIcon = (type) => {
    if (type === 'Đạp xe') return <FaBiking className="text-orange-500 text-lg" />
    if (type === 'Đi bộ') return <FaWalking className="text-green-500 text-lg" />
    return <FaRunning className="text-red-500 text-lg" />
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fc4c02]/10 flex items-center justify-center text-[#fc4c02]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dữ liệu Strava chờ nhập</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chọn các hoạt động bạn muốn tính vào tiến độ sự kiện</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isImporting} className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 drop-shadow-sm rounded-full transition-colors disabled:opacity-50">
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative bg-gray-50/30 dark:bg-gray-900/10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FaSpinner className="animate-spin text-3xl mb-4 text-[#fc4c02]" />
              <p>Đang tải dữ liệu từ Strava của bạn...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <FaCheck className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Tuyệt vời!</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">Không còn hoạt động mới nào trên Strava cần nhập vào sự kiện này.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((act) => {
                const isSelected = selectedIds.includes(act.stravaId)
                return (
                  <div 
                    key={act.stravaId}
                    onClick={() => handleToggle(act.stravaId)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'border-[#fc4c02] bg-[#fc4c02]/5 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#fc4c02]/40'}`}
                  >
                    {/* Checkbox circle */}
                    <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex flex-col items-center justify-center transition-colors ${isSelected ? 'bg-[#fc4c02] border-[#fc4c02] text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && <FaCheck className="text-[10px]" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate pr-2 flex items-center gap-2">
                          {getIcon(act.type)}
                          {act.name}
                        </h4>
                        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md shrink-0">
                          {moment(act.startDate).format('HH:mm DD/MM')}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400"><FaMapMarkerAlt /> {act.distance} km</span>
                        <span className="flex items-center gap-1.5 font-medium text-orange-600 dark:text-orange-400"><FaFire /> {act.calories} kcal</span>
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400"><FaClock /> {act.movingTime} phút</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {activities.length > 0 && !isLoading && (
          <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center gap-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Đã chọn <strong className="text-[#fc4c02]">{selectedIds.length}</strong> / {activities.length} hoạt động
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleImport}
                disabled={isImporting || selectedIds.length === 0}
                className="px-6 py-2.5 rounded-xl font-bold bg-[#fc4c02] text-white hover:bg-[#e34402] transition-colors shadow-lg shadow-[#fc4c02]/30 flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50 disabled:shadow-none"
              >
                {isImporting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {isImporting ? 'Đang nạp...' : 'Nhập dữ liệu'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
