import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import moment from 'moment'
import { getCommunityHealthAnalytics } from '../../../../apis/adminApi'
import TimeRangeFilter from '../TimeRangeFilter/TimeRangeFilter'
import InfoTooltip from '../InfoTooltip/InfoTooltip'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const TEN_LOAI_THU_THACH = {
  nutrition: 'Dinh dưỡng',
  outdoor_activity: 'Ngoài trời',
  fitness: 'Thể lực'
}

function MiniStat({ label, value, hint }) {
  return (
    <div className='rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm'>
      <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>{label}</p>
      <p className='text-2xl font-black text-emerald-700 dark:text-emerald-400'>{value}</p>
      {hint && <p className='text-[10px] text-gray-400 mt-1'>{hint}</p>}
    </div>
  )
}

export default function CommunityHealthSection() {
  const [filterParams, setFilterParams] = useState({ period: '7d' })

  const { data: res, isFetching } = useQuery({
    queryKey: ['community-health', filterParams],
    queryFn: () => getCommunityHealthAnalytics(filterParams),
    placeholderData: keepPreviousData,
    staleTime: 30_000
  })

  const r = res?.data?.result || {}
  const ua = r.userActivity || {}
  const cc = r.challengeCompletion || {}
  const ee = r.eventEngagement || {}

  const daily = ua.dailyActiveUsers || []
  const labels = daily.map((d) => moment(d._id).format('DD/MM'))
  const counts = daily.map((d) => d.count)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Số người hoạt động (ước tính theo ngày)',
        data: counts,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  }

  return (
    <div className='mt-6 px-2'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div className='flex items-center gap-2'>
          <span className='text-2xl'>💚</span>
          <div>
            <div className='flex items-center gap-2'>
              <h2 className='text-lg font-bold text-gray-800 dark:text-gray-100'>Sức khỏe cộng đồng</h2>
              <InfoTooltip text='Gộp bài viết, bình luận, thích, buổi tập xong, hoạt động thử thách, điểm danh sự kiện (ngày hoạt động = ngày check-in hoặc ngày tạo bản ghi điểm danh nếu chưa check-in). Tỷ lệ xong thử thách: trong kỳ lọc chỉ cohort joined_at; Toàn bộ = mọi người đang tham gia (trừ bỏ cuộc). Xếp hạng sự kiện theo điểm danh dùng cùng mốc thời gian đó.' />
            </div>
            <p className='text-xs text-gray-400'>Người hoạt động · Thử thách · Sự kiện</p>
          </div>
        </div>
        <TimeRangeFilter value={filterParams.period || '7d'} onChange={setFilterParams} />
      </div>

      {isFetching && <p className='text-xs text-gray-400 mb-2'>Đang tải số liệu…</p>}

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
        <MiniStat
          label='Cao nhất / ngày'
          value={ua.peakDau ?? 0}
          hint='Ngày có nhiều người hoạt động nhất'
        />
        <MiniStat
          label='Trung bình / ngày'
          value={ua.avgDau ?? 0}
          hint='Theo số ngày lịch trong kỳ lọc (hoặc theo các ngày có dữ liệu nếu chọn Toàn bộ)'
        />
        <MiniStat
          label='Không trùng lặp'
          value={ua.distinctActiveUsersInPeriod ?? 0}
          hint='Trong kỳ lọc, gộp mọi kênh'
        />
        <MiniStat
          label='Xong thử thách'
          value={cc.overallRatePercent != null ? `${cc.overallRatePercent}%` : '—'}
          hint={
            cc.denominatorParticipants
              ? `${cc.completedParticipants || 0}/${cc.denominatorParticipants} người tham gia`
              : 'Chưa có dữ liệu'
          }
        />
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm'>
          <p className='text-sm font-bold text-gray-700 dark:text-gray-200 mb-2'>Người hoạt động theo ngày</p>
          <div style={{ height: 260 }}>
            {daily.length === 0 ? (
              <p className='text-sm text-gray-400'>Chưa có dữ liệu trong khoảng đã chọn.</p>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm'>
          <p className='text-sm font-bold text-gray-700 dark:text-gray-200 mb-2'>Tỷ lệ xong theo loại thử thách</p>
          <div className='space-y-2'>
            {(cc.byChallengeType || []).length === 0 && (
              <p className='text-sm text-gray-400'>Chưa có người tham gia.</p>
            )}
            {(cc.byChallengeType || []).map((row) => (
              <div
                key={row.challenge_type || 'x'}
                className='flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2'
              >
                <span className='font-medium text-gray-600 dark:text-gray-300'>
                  {TEN_LOAI_THU_THACH[row.challenge_type] || row.challenge_type}
                </span>
                <span className='text-emerald-600 font-bold'>
                  {row.ratePercent}%{' '}
                  <span className='text-gray-400 font-normal text-xs'>
                    ({row.completed}/{row.total})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'>
        <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm'>
          <p className='text-sm font-bold text-gray-700 dark:text-gray-200 mb-2'>Sự kiện nổi bật — theo số người tham gia</p>
          <ul className='text-sm space-y-2'>
            {(ee.topByParticipants || []).map((ev) => (
              <li key={String(ev._id)} className='flex justify-between gap-2'>
                <span className='text-gray-700 dark:text-gray-200 truncate'>{ev.name}</span>
                <span className='text-gray-500 shrink-0'>{ev.participantCount} người</span>
              </li>
            ))}
            {(ee.topByParticipants || []).length === 0 && <li className='text-gray-400'>Chưa có sự kiện.</li>}
          </ul>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm'>
          <p className='text-sm font-bold text-gray-700 dark:text-gray-200 mb-2'>Sự kiện nổi bật — theo lượt điểm danh</p>
          <ul className='text-sm space-y-2'>
            {(ee.topByCheckins || []).map((ev) => (
              <li key={String(ev._id)} className='flex justify-between gap-2'>
                <span className='text-gray-700 dark:text-gray-200 truncate'>{ev.name || '—'}</span>
                <span className='text-gray-500 shrink-0'>{ev.checkins} lượt</span>
              </li>
            ))}
            {(ee.topByCheckins || []).length === 0 && <li className='text-gray-400'>Chưa có điểm danh.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
