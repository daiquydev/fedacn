import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaPlus,
  FaTrophy,
  FaEye
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { getMyEvents, getJoinedEvents, deleteSportEvent } from '../../apis/sportEventApi'
import toast from 'react-hot-toast'
import moment from 'moment'

const MySportEvents = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('created') // 'created' or 'joined'

  // Fetch created events
  const {
    data: createdEventsData,
    isLoading: isLoadingCreated
  } = useQuery({
    queryKey: ['myCreatedEvents'],
    queryFn: () => getMyEvents({ page: 1, limit: 100 })
  })

  const createdEvents = createdEventsData?.data?.result?.events || createdEventsData?.result?.events || []

  // Fetch joined events  
  const {
    data: joinedEventsData,
    isLoading: isLoadingJoined
  } = useQuery({
    queryKey: ['myJoinedEvents'],
    queryFn: () => getJoinedEvents({ page: 1, limit: 100 }),
    enabled: activeTab === 'joined'
  })

  const joinedEvents = joinedEventsData?.data?.result?.events || joinedEventsData?.result?.events || []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (eventId) => deleteSportEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myCreatedEvents'])
      toast.success('Đã xóa sự kiện thành công!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa sự kiện')
    }
  })

  const handleDelete = (eventId, eventName) => {
    if (window.confirm(`Bạn chắc chắn muốn xóa sự kiện "${eventName}"?`)) {
      deleteMutation.mutate(eventId)
    }
  }

  // Calculate stats
  const totalCreated = createdEvents.length
  const totalJoined = joinedEvents.length

  const EventCard = ({ event, isCreator = false }) => {
    const eventDate = moment(event.startDate)
    const eventEnd = moment(event.endDate)
    const now = moment()
    const isOngoing = now.isBetween(eventDate, eventEnd)
    const isUpcoming = now.isBefore(eventDate)
    const isEnded = now.isAfter(eventEnd)

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition group">
        <div className="flex flex-col md:flex-row">
          {/* Event Image */}
          <div className="md:w-1/3 relative">
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-48 md:h-full object-cover"
            />
            {/* Status Badge */}
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${isOngoing ? 'bg-green-500' : isUpcoming ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
              {isOngoing ? '🟢 Đang diễn ra' : isUpcoming ? '⏰ Sắp diễn ra' : '✓ Đã kết thúc'}
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 md:w-2/3 flex flex-col justify-between">
            <div>
              {/* Title and Category */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                  {event.name}
                </h3>
                <span className="ml-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium whitespace-nowrap">
                  {event.category}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {event.description}
              </p>

              {/* Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  <span>Bắt đầu: {eventDate.format('DD/MM/YYYY')}</span>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-red-400" />
                  <span>Kết thúc: {eventEnd.format('DD/MM/YYYY')}</span>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-orange-400" />
                  <span>Thời điểm: {eventDate.format('HH:mm')}</span>
                </div>
                <div className="flex items-center">
                  {event.eventType === 'Trong nhà' ? (
                    <>
                      <MdVideocam className="mr-2 text-purple-500" />
                      <span>Trong nhà</span>
                    </>
                  ) : (
                    <>
                      <FaMapMarkerAlt className="mr-2 text-green-500" />
                      <span className="truncate">{event.location}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  <FaUsers className="mr-2 text-yellow-500" />
                  <span>{event.participants}/{event.maxParticipants} người tham gia</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                onClick={() => navigate(`/sport-event/${event._id}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <FaEye />
                Xem chi tiết
              </button>

              {isCreator && (
                <>
                  <button
                    onClick={() => navigate(`/sport-event/edit/${event._id}`)}
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    <FaEdit />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(event._id, event.name)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? (
                      <AiOutlineLoading3Quarters className="animate-spin" />
                    ) : (
                      <FaTrash />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 h-48 md:h-64 bg-gray-300 dark:bg-gray-700" />
        <div className="p-6 md:w-2/3 space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 container mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <FaTrophy className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Quản lý Sự kiện</h1>
              <p className="text-white/75 text-xs mt-0.5">Theo dõi và quản lý các sự kiện của bạn</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate('/sport-event')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 text-sm"
            >
              <FaArrowLeft /> Quay lại danh sách
            </button>
            <Link
              to="/sport-event/create"
              className="bg-white hover:bg-gray-50 text-red-600 px-4 py-2 rounded-xl font-semibold transition shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
              <FaPlus /> Tạo sự kiện mới
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 md:flex-none px-6 py-4 font-semibold transition ${activeTab === 'created'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Sự kiện đã tạo ({totalCreated})
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`flex-1 md:flex-none px-6 py-4 font-semibold transition ${activeTab === 'joined'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Đã tham gia ({totalJoined})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-md p-6 mb-8">
          {activeTab === 'created' ? (
            isLoadingCreated ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : createdEvents.length > 0 ? (
              <div className="space-y-6">
                {createdEvents.map((event) => (
                  <EventCard key={event._id} event={event} isCreator={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaCalendarAlt className="mx-auto text-gray-400 text-6xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Bạn chưa tạo sự kiện nào
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Hãy tạo sự kiện đầu tiên của bạn ngay!
                </p>
                <Link
                  to="/sport-event/create"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  <FaPlus />
                  Tạo sự kiện mới
                </Link>
              </div>
            )
          ) : (
            isLoadingJoined ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : joinedEvents.length > 0 ? (
              <div className="space-y-6">
                {joinedEvents.map((event) => (
                  <EventCard key={event._id} event={event} isCreator={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaTrophy className="mx-auto text-gray-400 text-6xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Bạn chưa tham gia sự kiện nào
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Khám phá và tham gia các sự kiện thú vị ngay!
                </p>
                <Link
                  to="/sport-event"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Khám phá sự kiện
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default MySportEvents
