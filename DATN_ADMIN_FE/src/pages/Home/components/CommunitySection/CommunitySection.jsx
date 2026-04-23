import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCommunityAnalytics } from '../../../../apis/adminApi'
import TimeRangeFilter from '../TimeRangeFilter/TimeRangeFilter'
import TopUsersPodium from '../TopUsersPodium/TopUsersPodium'
import { CommunityActivityChart, EventActivityChart } from '../PlatformActivityChart/PlatformActivityChart'
import InfoTooltip from '../InfoTooltip/InfoTooltip'

export default function CommunitySection() {
  const [filterParams, setFilterParams] = useState({ period: '7d' })

  const { data: res } = useQuery({
    queryKey: ['community-analytics', filterParams],
    queryFn: () => getCommunityAnalytics(filterParams),
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const result = res?.data?.result || {}
  const { topUsers = {}, communityActivity = {}, eventActivity = {} } = result

  return (
    <div>
      {/* Merged Group Header + Filter */}
      <div className='flex items-center justify-between mb-3 mt-10 px-2 flex-wrap gap-2'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>🏅</span>
          <div>
            <div className='flex items-center gap-2'>
              <h2 className='text-lg font-bold text-gray-800 dark:text-gray-100'>Cộng đồng & Sự kiện</h2>
              <InfoTooltip text='Người nổi bật: bài viết theo kỳ lọc; thử thách theo lượt tham gia mới (joined_at), không tính đã bỏ cuộc; sự kiện theo lượt điểm danh (check-in) trong kỳ; tập luyện theo buổi hoàn thành. Biểu đồ sự kiện: đường đứt = điểm danh theo ngày.' />
            </div>
            <p className='text-xs text-gray-400'>Bài viết · thử thách (đã tham gia trong kỳ) · điểm danh sự kiện · buổi tập</p>
          </div>
        </div>
        <TimeRangeFilter value={filterParams.period || 'custom'} onChange={setFilterParams} />
      </div>

      {/* Top Users Podium */}
      <div className='px-2 my-3'>
        <p className='text-sm font-bold text-gray-600 dark:text-gray-300 mb-2'>🏆 Người dùng nổi bật</p>
        <TopUsersPodium topUsers={topUsers} />
      </div>

      {/* Activity Charts — stacked vertically */}
      <div className='px-2 my-3'>
        <p className='text-sm font-bold text-gray-600 dark:text-gray-300 mb-2'>📊 Tổng quan hoạt động</p>

        {/* Chart 1: Community & Users */}
        <div className='mb-3'>
          <CommunityActivityChart communityActivity={communityActivity} />
        </div>

        {/* Chart 2: Event (full width, below) */}
        <div>
          <EventActivityChart eventActivity={eventActivity} />
        </div>
      </div>
    </div>
  )
}
