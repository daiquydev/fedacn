import React, { useState, useMemo } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { 
  FaFire, 
  FaRoad, 
  FaClock, 
  FaTrophy, 
  FaPlus,
  FaImage,
  FaTimes,
  FaMedal
} from 'react-icons/fa'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { MdOutlineHistoryEdu } from 'react-icons/md'
import moment from 'moment'

// Simple card component for stats
const StatCard = ({ icon, label, value, subValue, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClass} bg-opacity-10`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{value}</h4>
      {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
    </div>
  </div>
)

export default function SportEventProgress({ 
  event, 
  userProgress, 
  addProgressMutation,
  progressUpdate,
  setProgressUpdate
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  // Calculate stats
  const stats = useMemo(() => {
    if (!userProgress) return null
    const { totalProgress, totalDistance, totalCalories, totalEntries } = userProgress
    const progressPercent = Math.min(Math.round((totalProgress / event.targetValue) * 100), 100)
    
    return {
      totalProgress,
      progressPercent,
      totalDistance: totalDistance?.toFixed(1) || 0,
      totalCalories: totalCalories || 0,
      totalEntries
    }
  }, [userProgress, event])

  // Prepare chart data (Last 7 days)
  const chartData = useMemo(() => {
    if (!userProgress?.progressHistory) return []
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = moment().subtract(6 - i, 'days')
      return {
        date: d.format('DD/MM'),
        fullDate: d.format('YYYY-MM-DD'),
        value: 0
      }
    })

    userProgress.progressHistory.forEach(entry => {
      const entryDate = moment(entry.date).format('YYYY-MM-DD')
      const day = last7Days.find(d => d.fullDate === entryDate)
      if (day) {
        day.value += entry.value
      }
    })

    return last7Days
  }, [userProgress])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Call parent handler (which calls mutation)
    // We assume the parent passes a wrapper or we call mutation directly if passed
    
    // For now, let's assume parent handles the actual mutation call logic via a passed handler 
    // OR we use the mutation passed directly. 
    // The previous code had `handleProgressSubmit` which called `mutate`.
    // Let's adapt to use the passed props.
    
    if (!progressUpdate.value) return 

    const progressData = {
      value: parseFloat(progressUpdate.value),
      unit: event.targetUnit,
      distance: progressUpdate.distance ? parseFloat(progressUpdate.distance) : undefined,
      time: progressUpdate.time || undefined,
      calories: progressUpdate.calories ? parseInt(progressUpdate.calories) : undefined,
      proofImage: progressUpdate.proofImage || undefined,
      notes: progressUpdate.notes || undefined
    }

    addProgressMutation.mutate(progressData, {
      onSuccess: () => {
        setShowAddForm(false)
      }
    })
  }

  const handleImageUpload = (e) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0])
      setProgressUpdate(prev => ({ ...prev, proofImage: url }))
    }
  }

  if (!userProgress) return <div>Loading...</div>

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Summary Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<FaTrophy className="text-yellow-500" />}
          label="Tiến độ"
          value={`${stats.totalProgress} / ${event.targetValue} ${event.targetUnit}`}
          subValue={`${stats.progressPercent}% Mục tiêu`}
          colorClass="bg-yellow-100 text-yellow-600"
        />
        <StatCard 
          icon={<FaRoad className="text-blue-500" />}
          label="Tổng quãng đường"
          value={`${stats.totalDistance} km`}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard 
          icon={<FaFire className="text-red-500" />}
          label="Calo tiêu thụ"
          value={`${stats.totalCalories} kcal`}
          colorClass="bg-red-100 text-red-600"
        />
        <StatCard 
          icon={<MdOutlineHistoryEdu className="text-purple-500" />}
          label="Số lần tập"
          value={`${stats.totalEntries} buổi`}
          colorClass="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Chart Section (Left - 2cols) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">
              Hoạt động 7 ngày qua
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    hide 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded">
                            {`${payload[0].value} ${event.targetUnit}`}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#EF4444' : '#F3F4F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div>
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Lịch sử hoạt động
              </h3>
            </div>
            
            <div className="space-y-4">
              {userProgress.progressHistory?.map((activity, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex gap-4 transition hover:shadow-md">
                  {/* Date Box */}
                  <div className="flex-shrink-0 w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-xl flex flex-col items-center justify-center text-red-500">
                    <span className="text-xs font-bold uppercase">{moment(activity.date).format('MMM')}</span>
                    <span className="text-xl font-bold">{moment(activity.date).format('DD')}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                          {activity.value} {activity.unit}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          {activity.distance && (
                            <span className="flex items-center gap-1"><FaRoad /> {activity.distance}km</span>
                          )}
                          {activity.calories && (
                            <span className="flex items-center gap-1"><FaFire /> {activity.calories}kcal</span>
                          )}
                          {activity.time && (
                            <span className="flex items-center gap-1"><FaClock /> {activity.time}</span>
                          )}
                        </div>
                      </div>
                      {activity.proofImage && (
                        <a href={activity.proofImage} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                          <img src={activity.proofImage} alt="proof" className="w-full h-full object-cover" />
                        </a>
                      )}
                    </div>
                    {activity.notes && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-750 p-2 rounded-lg inline-block">
                        "{activity.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Add Progress Form (Right Col) */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Cập nhật hôm nay
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Giá trị ({event.targetUnit})
                </label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={progressUpdate.value}
                  onChange={e => setProgressUpdate({...progressUpdate, value: e.target.value})}
                  className="w-full text-3xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-xl">
                  <label className="block text-xs text-gray-500 mb-1">Khoảng cách (km)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={progressUpdate.distance}
                    onChange={e => setProgressUpdate({...progressUpdate, distance: e.target.value})}
                    className="w-full bg-transparent border-none p-0 text-gray-900 dark:text-white font-semibold focus:ring-0 text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-xl">
                  <label className="block text-xs text-gray-500 mb-1">Calo (kcal)</label>
                  <input 
                    type="number"
                    value={progressUpdate.calories}
                    onChange={e => setProgressUpdate({...progressUpdate, calories: e.target.value})}
                    className="w-full bg-transparent border-none p-0 text-gray-900 dark:text-white font-semibold focus:ring-0 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-xl">
                <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
                <textarea 
                  rows={2}
                  value={progressUpdate.notes}
                  onChange={e => setProgressUpdate({...progressUpdate, notes: e.target.value})}
                  className="w-full bg-transparent border-none p-0 text-gray-900 dark:text-white font-medium focus:ring-0 text-sm resize-none"
                  placeholder="Hôm nay bạn tập thế nào?"
                />
              </div>

              {/* Image Upload Simplified */}
              <div>
                 {!progressUpdate.proofImage ? (
                   <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-red-500 transition-colors">
                      <div className="text-center text-gray-500">
                        <FaImage className="mx-auto mb-1" />
                        <span className="text-xs">Thêm ảnh minh chứng</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                   </label>
                 ) : (
                   <div className="relative h-40 rounded-xl overflow-hidden group">
                     <img src={progressUpdate.proofImage} className="w-full h-full object-cover" alt="preview" />
                     <button 
                        type="button" 
                        onClick={() => setProgressUpdate({...progressUpdate, proofImage: ''})}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                       <FaTimes />
                     </button>
                   </div>
                 )}
              </div>

              <button
                type="submit"
                disabled={addProgressMutation.isPending || !progressUpdate.value}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/30 transition disabled:opacity-50 disabled:shadow-none"
              >
                 {addProgressMutation.isPending ? <AiOutlineLoading3Quarters className="animate-spin mx-auto" /> : 'Cập nhật ngay'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
