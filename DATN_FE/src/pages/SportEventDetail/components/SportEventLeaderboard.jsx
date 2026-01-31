import React, { useState } from 'react'
import { FaMedal, FaSearch, FaTrophy, FaUserCircle } from 'react-icons/fa'
import { getImageUrl } from '../../../utils/imageUrl'

// Component to render a Podium step
const PodiumStep = ({ participant, rank }) => {
  if (!participant) return <div className="flex-1"></div>

  const isFirst = rank === 1
  const isSecond = rank === 2
  const isThird = rank === 3

  let heightClass = 'h-32'
  let colorClass = 'bg-gray-100'
  let iconColor = 'text-gray-400'
  
  if (isFirst) {
    heightClass = 'h-48'
    colorClass = 'bg-yellow-100 border-yellow-300'
    iconColor = 'text-yellow-500'
  } else if (isSecond) {
    heightClass = 'h-40'
    colorClass = 'bg-gray-200 border-gray-300'
    iconColor = 'text-gray-400'
  } else if (isThird) {
    heightClass = 'h-36'
    colorClass = 'bg-orange-100 border-orange-300'
    iconColor = 'text-orange-500'
  }

  return (
    <div className={`flex flex-col items-center justify-end ${isFirst ? 'order-2' : isSecond ? 'order-1' : 'order-3'} flex-1`}>
      <div className="relative mb-4 flex flex-col items-center">
        <FaTrophy className={`text-2xl mb-2 ${iconColor}`} />
        <div className={`relative ${isFirst ? 'w-24 h-24' : 'w-20 h-20'} rounded-full border-4 border-white shadow-md overflow-hidden`}>
           <img 
             src={getImageUrl(participant.avatar)} 
             alt={participant.name}
             className="w-full h-full object-cover"
             onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150' }}
           />
        </div>
        <div className={`absolute -bottom-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
          isFirst ? 'bg-yellow-500' : isSecond ? 'bg-gray-500' : 'bg-orange-500'
        }`}>
          #{rank}
        </div>
      </div>
      
      <div className="text-center mb-2">
        <p className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{participant.name}</p>
        <p className="text-sm font-semibold text-red-500">{participant.totalProgress}</p>
      </div>

      <div className={`w-full ${heightClass} ${colorClass} rounded-t-lg border-t-4 flex items-end justify-center pb-4 shadow-inner`}>
        <span className={`text-4xl font-black opacity-20 ${isFirst ? 'text-yellow-600' : 'text-gray-600'}`}>
          {rank}
        </span>
      </div>
    </div>
  )
}

export default function SportEventLeaderboard({ 
  participants, 
  isLoading, 
  searchTerm, 
  setSearchTerm,
  event
}) {
  const top3 = participants.slice(0, 3)
  const rest = participants.slice(3)

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Podium Section */}
      {participants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm mb-8">
           <h3 className="text-center text-2xl font-black text-gray-800 dark:text-white mb-8 uppercase tracking-wider">
             Top Xuất Sắc Nhất
           </h3>
           <div className="flex items-end justify-center max-w-2xl mx-auto gap-4">
              {/* Second Place */}
              <PodiumStep participant={top3[1]} rank={2} />
              {/* First Place */}
              <PodiumStep participant={top3[0]} rank={1} />
              {/* Third Place */}
              <PodiumStep participant={top3[2]} rank={3} />
           </div>
        </div>
      )}

      {/* 2. List Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bảng xếp hạng chi tiết</h3>
          
          <div className="relative">
             <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="Tìm kiếm..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-red-500 w-full md:w-64"
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 text-left">Hạng</th>
                <th className="px-6 py-4 text-left">Vận động viên</th>
                <th className="px-6 py-4 text-left">Kết quả ({event.targetUnit})</th>
                <th className="px-6 py-4 text-left">Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {participants.map((user, idx) => (
                <tr key={user.userId || idx} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                  <td className="px-6 py-4">
                    <span className={`font-bold ${
                      user.rank <= 3 ? 'text-red-500 text-lg' : 'text-gray-500'
                    }`}>
                      #{user.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getImageUrl(user.avatar)} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150' }}
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white">{user.totalProgress}</span>
                    {user.totalDistance > 0 && (
                       <span className="text-xs text-gray-500 block">{user.totalDistance.toFixed(1)} km</span>
                    )}
                  </td>
                  <td className="px-6 py-4 w-1/4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(user.progressPercentage || 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block text-right">{user.progressPercentage}%</span>
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500">
                    Chưa có dữ liệu xếp hạng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
