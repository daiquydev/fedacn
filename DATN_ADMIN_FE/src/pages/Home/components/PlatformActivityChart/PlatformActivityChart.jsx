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

// ── Chart 1: Community (Bài viết mới + like/comment mới) ──
export function CommunityActivityChart({ communityActivity = {} }) {
  const { totals = {}, dailyPosts = [], dailyLikes = [], dailyComments = [] } = communityActivity
  const allDates = mergeDates(dailyPosts, dailyLikes, dailyComments)
  const labels = allDates.map((d) => moment(d).format('DD/MM'))

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
        label: 'Lượt thích mới',
        data: buildDataset(dailyLikes, allDates),
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_BG.primary,
        pointBackgroundColor: CHART_COLORS.primary,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      },
      {
        label: 'Bình luận mới',
        data: buildDataset(dailyComments, allDates),
        borderColor: CHART_COLORS.purple,
        backgroundColor: CHART_BG.purple,
        pointBackgroundColor: CHART_COLORS.purple,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      }
    ]
  }

  const isEmpty = dailyPosts.length === 0 && dailyLikes.length === 0 && dailyComments.length === 0

  return (
    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 dark:bg-gray-800 dark:border-gray-700'>
      <div className='flex items-center justify-between mb-3'>
        <p className='text-sm font-bold text-gray-600 dark:text-gray-300'>📝 Bài viết cộng đồng</p>
        <InfoTooltip text='Theo dõi lượng nội dung và tương tác mới trong cộng đồng gồm bài viết, lượt thích và bình luận theo thời gian. Nếu bài viết tăng nhưng tương tác thấp, cần tối ưu chất lượng nội dung hoặc cơ chế thúc đẩy thảo luận.' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
        <div className='bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border-l-4 border-l-red-400 shadow-sm border border-gray-100 dark:border-gray-700'>
          <p className='text-xs text-gray-400 mb-1'>📝 Bài viết mới</p>
          <p className='text-xl font-black text-gray-800 dark:text-white'>{(totals.posts ?? 0).toLocaleString('vi-VN')}</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border-l-4 border-l-blue-400 shadow-sm border border-gray-100 dark:border-gray-700'>
          <p className='text-xs text-gray-400 mb-1'>👍 Lượt thích mới</p>
          <p className='text-xl font-black text-gray-800 dark:text-white'>{(totals.likes ?? 0).toLocaleString('vi-VN')}</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border-l-4 border-l-purple-400 shadow-sm border border-gray-100 dark:border-gray-700'>
          <p className='text-xs text-gray-400 mb-1'>💬 Bình luận mới</p>
          <p className='text-xl font-black text-gray-800 dark:text-white'>{(totals.comments ?? 0).toLocaleString('vi-VN')}</p>
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

// ── Chart 2: Event Activity (Full width, dual Y-axis, descriptive legends) ──
export function EventActivityChart({ eventActivity = {} }) {
  const { totals = {}, dailyOutdoorEvents = [], dailyIndoorEvents = [], dailyOutdoorJoins = [], dailyIndoorJoins = [] } = eventActivity
  const allDates = mergeDates(dailyOutdoorEvents, dailyIndoorEvents, dailyOutdoorJoins, dailyIndoorJoins)
  const labels = allDates.map((d) => moment(d).format('DD/MM'))

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
        fill: true, tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Số sự kiện Trong nhà tạo ra',
        data: buildDataset(dailyIndoorEvents, allDates),
        borderColor: CHART_COLORS.purple,
        backgroundColor: CHART_BG.purple,
        pointBackgroundColor: CHART_COLORS.purple,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Lượt điểm danh SK Ngoài trời',
        data: buildDataset(dailyOutdoorJoins, allDates),
        borderColor: CHART_COLORS.success,
        backgroundColor: CHART_BG.success,
        pointBackgroundColor: CHART_COLORS.success,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        borderDash: [5, 3],
        fill: false, tension: 0.4,
        yAxisID: 'y1'
      },
      {
        label: 'Lượt điểm danh SK Trong nhà',
        data: buildDataset(dailyIndoorJoins, allDates),
        borderColor: CHART_COLORS.purple,
        backgroundColor: CHART_BG.purple,
        pointBackgroundColor: CHART_COLORS.purple,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        borderDash: [5, 3],
        fill: false, tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }

  const dualAxisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, weight: '600' }, usePointStyle: true, padding: 12 } },
      title: { display: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { stepSize: 1, font: { size: 10 } },
        title: { display: true, text: 'Sự kiện tạo ra', font: { size: 10, weight: '600' }, color: 'rgba(100,100,100,0.7)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { stepSize: 1, font: { size: 10 } },
        title: { display: true, text: 'Lượt điểm danh', font: { size: 10, weight: '600' }, color: 'rgba(100,100,100,0.7)' }
      }
    }
  }

  const isEmpty = [dailyOutdoorEvents, dailyIndoorEvents, dailyOutdoorJoins, dailyIndoorJoins].every((a) => a.length === 0)

  return (
    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 dark:bg-gray-800 dark:border-gray-700'>
      <div className='flex items-center justify-between mb-3'>
        <p className='text-sm font-bold text-gray-600 dark:text-gray-300'>🏅 Sự kiện Thể thao</p>
        <InfoTooltip text='So sánh sự kiện mới tạo (đường liền) với lượt điểm danh theo ngày (đường đứt; mỗi lượt = một bản ghi tham gia buổi). Nếu tạo nhiều nhưng điểm danh thấp → cần xem lại chất lượng / thời điểm sự kiện. Trục trái = số sự kiện tạo, trục phải = lượt điểm danh (khác đơn vị, không so độ dốc trực tiếp).' />
      </div>
      {/* Stat cards: 2 rows x 2 columns for clear grouping */}
      <div className='grid grid-cols-2 xl:grid-cols-5 gap-3 mb-4'>
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
        <div className='bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl px-4 py-3 border border-teal-100 dark:border-teal-800'>
          <p className='text-xs text-gray-500 mb-1'>🏃 Điểm danh SK Ngoài trời</p>
          <p className='text-2xl font-black text-teal-600'>{(totals.outdoorJoins ?? 0).toLocaleString('vi-VN')}</p>
          <p className='text-[10px] text-gray-400 mt-0.5'>lượt tham gia</p>
        </div>
        <div className='bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20 rounded-xl px-4 py-3 border border-fuchsia-100 dark:border-fuchsia-800'>
          <p className='text-xs text-gray-500 mb-1'>🏋️ Điểm danh SK Trong nhà</p>
          <p className='text-2xl font-black text-fuchsia-600'>{(totals.indoorJoins ?? 0).toLocaleString('vi-VN')}</p>
          <p className='text-[10px] text-gray-400 mt-0.5'>lượt tham gia</p>
        </div>
        <div className='bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-800'>
          <p className='text-xs text-gray-500 mb-1'>✅ Tỷ lệ phiên hoàn thành</p>
          <p className='text-2xl font-black text-amber-600'>{totals.completionRatePercent ?? 0}%</p>
          <p className='text-[10px] text-gray-400 mt-0.5'>phiên sự kiện</p>
        </div>
      </div>
      <div className='h-[280px]'>
        {isEmpty ? (
          <div className='flex flex-col items-center justify-center h-full text-gray-400'>
            <span className='text-3xl mb-2'>🏅</span>
            <p className='text-sm'>Chưa có dữ liệu</p>
          </div>
        ) : (
          <Line options={dualAxisOptions} data={data} />
        )}
      </div>
    </div>
  )
}
