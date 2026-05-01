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
import InfoTooltip from '../InfoTooltip/InfoTooltip'
import { CHART_BG, CHART_COLORS } from '../chartTheme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function mergeDates(...arrays) {
  const dateSet = new Set()
  arrays.forEach((arr) => (arr || []).forEach((i) => dateSet.add(i._id)))
  return [...dateSet].sort()
}

function buildDataset(data = [], dates = []) {
  const map = Object.fromEntries(data.map((d) => [d._id, d.count]))
  return dates.map((d) => map[d] ?? 0)
}

function formatDateLabel(value) {
  const strictParsed = moment(value, ['YYYY-MM-DD', moment.ISO_8601], true)
  if (strictParsed.isValid()) return strictParsed.format('DD/MM')

  const looseParsed = moment(value)
  if (looseParsed.isValid()) return looseParsed.format('DD/MM')

  // Trường hợp dữ liệu đã là nhãn ngày (vd: 29/04) hoặc chuỗi khác từ backend
  return String(value ?? '')
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { font: { size: 11, weight: '600' }, usePointStyle: true, padding: 12 } },
    title: { display: false }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { stepSize: 1, font: { size: 10 } } }
  }
}

// ── Chart 1: Community (Bài viết mới + người dùng mới + sự kiện mới + thử thách mới) ──
export function CommunityActivityChart({ communityActivity = {} }) {
  const { totals = {}, dailyPosts = [], dailyUsers = [], dailyEvents = [], dailyChallenges = [] } = communityActivity
  const allDates = mergeDates(dailyPosts, dailyUsers, dailyEvents, dailyChallenges)
  const labels = allDates.map((d) => formatDateLabel(d))

  const data = {
    labels,
    datasets: [
      {
        label: 'Bài viết mới',
        data: buildDataset(dailyPosts, allDates),
        borderColor: CHART_COLORS.danger,
        backgroundColor: CHART_BG.danger,
        pointBackgroundColor: CHART_COLORS.danger,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      },
      {
        label: 'Người dùng mới',
        data: buildDataset(dailyUsers, allDates),
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_BG.primary,
        pointBackgroundColor: CHART_COLORS.primary,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      },
      {
        label: 'Sự kiện mới',
        data: buildDataset(dailyEvents, allDates),
        borderColor: CHART_COLORS.success,
        backgroundColor: CHART_BG.success,
        pointBackgroundColor: CHART_COLORS.success,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      },
      {
        label: 'Thử thách mới',
        data: buildDataset(dailyChallenges, allDates),
        borderColor: CHART_COLORS.purple,
        backgroundColor: CHART_BG.purple,
        pointBackgroundColor: CHART_COLORS.purple,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      }
    ]
  }

  const isEmpty = [dailyPosts, dailyUsers, dailyEvents, dailyChallenges].every((arr) => arr.length === 0)

  return (
    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 dark:bg-gray-800 dark:border-gray-700'>
      <div className='flex items-center justify-between mb-3'>
        <p className='text-sm font-bold text-gray-600 dark:text-gray-300'>📝 Bài viết cộng đồng</p>
        <InfoTooltip text='Theo dõi khối lượng tạo mới của hệ sinh thái cộng đồng theo thời gian: bài viết, người dùng, sự kiện và thử thách. Dùng để đánh giá tốc độ tăng trưởng nội dung và mở rộng cộng đồng.' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4'>
        <div className='bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border-l-4 border-l-red-400 shadow-sm border border-gray-100 dark:border-gray-700'>
          <p className='text-xs text-gray-400 mb-1'>📝 Bài viết mới</p>
          <p className='text-xl font-black text-gray-800 dark:text-white'>{(totals.posts ?? 0).toLocaleString('vi-VN')}</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border-l-4 border-l-blue-400 shadow-sm border border-gray-100 dark:border-gray-700'>
          <p className='text-xs text-gray-400 mb-1'>👤 Người dùng mới</p>
          <p className='text-xl font-black text-gray-800 dark:text-white'>{(totals.users ?? 0).toLocaleString('vi-VN')}</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border-l-4 border-l-green-400 shadow-sm border border-gray-100 dark:border-gray-700'>
          <p className='text-xs text-gray-400 mb-1'>🏅 Sự kiện mới</p>
          <p className='text-xl font-black text-gray-800 dark:text-white'>{(totals.events ?? 0).toLocaleString('vi-VN')}</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border-l-4 border-l-purple-400 shadow-sm border border-gray-100 dark:border-gray-700'>
          <p className='text-xs text-gray-400 mb-1'>🏆 Thử thách mới</p>
          <p className='text-xl font-black text-gray-800 dark:text-white'>{(totals.challenges ?? 0).toLocaleString('vi-VN')}</p>
        </div>
      </div>
      <div className='h-[220px]'>
        {isEmpty ? (
          <div className='flex flex-col items-center justify-center h-full text-gray-400'>
            <span className='text-3xl mb-2'>📊</span>
            <p className='text-sm'>Chưa có dữ liệu</p>
          </div>
        ) : (
          <Line options={baseOptions} data={data} />
        )}
      </div>
    </div>
  )
}

// ── Chart 2: Event Activity (So sánh sự kiện tạo mới theo loại hình) ──
export function EventActivityChart({ eventActivity = {} }) {
  const { totals = {}, dailyOutdoorEvents = [], dailyIndoorEvents = [] } = eventActivity
  const allDates = mergeDates(dailyOutdoorEvents, dailyIndoorEvents)
  const labels = allDates.map((d) => formatDateLabel(d))

  const data = {
    labels,
    datasets: [
      {
        label: 'Số sự kiện Ngoài trời tạo ra',
        data: buildDataset(dailyOutdoorEvents, allDates),
        borderColor: CHART_COLORS.success,
        backgroundColor: CHART_BG.success,
        pointBackgroundColor: CHART_COLORS.success,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      },
      {
        label: 'Số sự kiện Trong nhà tạo ra',
        data: buildDataset(dailyIndoorEvents, allDates),
        borderColor: CHART_COLORS.purple,
        backgroundColor: CHART_BG.purple,
        pointBackgroundColor: CHART_COLORS.purple,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      }
    ]
  }
  const isEmpty = [dailyOutdoorEvents, dailyIndoorEvents].every((a) => a.length === 0)

  return (
    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 dark:bg-gray-800 dark:border-gray-700'>
      <div className='flex items-center justify-between mb-3'>
        <p className='text-sm font-bold text-gray-600 dark:text-gray-300'>🏅 Sự kiện Thể thao</p>
        <InfoTooltip text='So sánh số sự kiện mới tạo theo thời gian giữa 2 loại hình: Ngoài trời và Trong nhà.' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-4'>
        <div className='bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl px-4 py-3 border border-green-100 dark:border-green-800'>
          <p className='text-xs text-gray-500 mb-1'>🌿 SK Ngoài trời tạo ra</p>
          <p className='text-2xl font-black text-green-600'>{(totals.outdoorEvents ?? 0).toLocaleString('vi-VN')}</p>
          <p className='text-[10px] text-gray-400 mt-0.5'>sự kiện</p>
        </div>
        <div className='bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl px-4 py-3 border border-purple-100 dark:border-purple-800'>
          <p className='text-xs text-gray-500 mb-1'>🏠 SK Trong nhà tạo ra</p>
          <p className='text-2xl font-black text-purple-600'>{(totals.indoorEvents ?? 0).toLocaleString('vi-VN')}</p>
          <p className='text-[10px] text-gray-400 mt-0.5'>sự kiện</p>
        </div>
      </div>
      <div className='h-[280px]'>
        {isEmpty ? (
          <div className='flex flex-col items-center justify-center h-full text-gray-400'>
            <span className='text-3xl mb-2'>🏅</span>
            <p className='text-sm'>Chưa có dữ liệu</p>
          </div>
        ) : (
          <Line options={baseOptions} data={data} />
        )}
      </div>
    </div>
  )
}
