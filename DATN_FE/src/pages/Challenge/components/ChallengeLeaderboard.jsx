import { useState } from 'react'
import { FaMedal, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'
import useravatar from '../../../assets/images/useravatar.jpg'

const mockParticipants = [
  {
    id: 1,
    name: "Sarah Smith",
    avatar: "",
    progress: 85,
    currentValue: 85,
    lastActive: "2024-03-20T10:00:00Z",
    streak: 5,
    rank: 1
  },
  // Thêm mock data khác...
]

export default function ChallengeLeaderboard({ challengeId }) {
  const [participants, setParticipants] = useState(mockParticipants)
  const [sortField, setSortField] = useState('rank')
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc'
    const direction = isAsc ? 'desc' : 'asc'
    
    const sortedParticipants = [...participants].sort((a, b) => {
      return direction === 'asc' 
        ? a[field] - b[field]
        : b[field] - a[field]
    })

    setParticipants(sortedParticipants)
    setSortField(field)
    setSortDirection(direction)
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />
    return sortDirection === 'asc' ? 
      <FaSortUp className="text-green-500" /> : 
      <FaSortDown className="text-green-500" />
  }

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Bảng xếp hạng</h2>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Tìm kiếm người tham gia..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Xếp hạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Người tham gia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" 
                    onClick={() => handleSort('progress')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Tiến độ</span>
                    {getSortIcon('progress')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('streak')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Chuỗi ngày</span>
                    {getSortIcon('streak')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredParticipants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {participant.rank <= 3 ? (
                        <FaMedal
                          className={`mr-2 ${
                            participant.rank === 1 ? 'text-yellow-400' :
                            participant.rank === 2 ? 'text-gray-400' :
                            'text-orange-600'
                          }`}
                        />
                      ) : (
                        <span className="ml-8">{participant.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={participant.avatar || useravatar}
                        alt={participant.name}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {participant.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {participant.currentValue}km
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {participant.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${participant.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {participant.streak} ngày
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 