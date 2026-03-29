import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import InfoTooltip from '../InfoTooltip/InfoTooltip'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function CategoryChart({ title, emoji, categories = [], eventColor, participantColor, gradientFrom, gradientTo, totalLabel }) {
  const labels = categories.map((c) => c.category)
  const totalEvents = categories.reduce((s, c) => s + c.eventCount, 0)
  const totalParticipants = categories.reduce((s, c) => s + c.totalParticipants, 0)

  const data = {
    labels,
    datasets: [
      {
        label: 'Số sự kiện',
        data: categories.map((c) => c.eventCount),
        backgroundColor: eventColor,
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
        yAxisID: 'y'
      },
      {
        label: 'Số người tham gia',
        data: categories.map((c) => c.totalParticipants),
        backgroundColor: participantColor,
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, weight: '600' }, usePointStyle: true, padding: 12, pointStyle: 'rectRounded' } },
      title: { display: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { stepSize: 1, font: { size: 10 } },
        title: { display: true, text: 'Sự kiện', font: { size: 10, weight: '600' }, color: 'rgba(100,100,100,0.7)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { stepSize: 1, font: { size: 10 } },
        title: { display: true, text: 'Người tham gia', font: { size: 10, weight: '600' }, color: 'rgba(100,100,100,0.7)' }
      }
    }
  }

  const isEmpty = categories.length === 0

  return (
    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5 dark:bg-gray-800 dark:border-gray-700 h-full flex flex-col'>
      <div className='flex items-center justify-between mb-3'>
        <p className='text-sm font-bold text-gray-600 dark:text-gray-300'>{emoji} {title}</p>
        <InfoTooltip text={`Top 5 môn thể thao ${title.toLowerCase()} được tổ chức nhiều nhất. Cột đậm = số sự kiện tạo ra, cột nhạt = số người tham gia. Nếu 1 môn có nhiều sự kiện nhưng ít người → cần quảng bá. Ngược lại → cần tạo thêm sự kiện.`} />
      </div>

      {/* Summary stats */}
      <div className='grid grid-cols-2 gap-2 mb-4'>
        <div className={`bg-gradient-to-br ${gradientFrom} rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700`}>
          <p className='text-xs text-gray-500 mb-0.5'>📋 Tổng sự kiện</p>
          <p className='text-2xl font-black text-gray-800 dark:text-white'>{totalEvents}</p>
        </div>
        <div className={`bg-gradient-to-br ${gradientTo} rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700`}>
          <p className='text-xs text-gray-500 mb-0.5'>👥 Tổng người tham gia</p>
          <p className='text-2xl font-black text-gray-800 dark:text-white'>{totalParticipants}</p>
        </div>
      </div>

      {/* Chart */}
      <div className='flex-1 min-h-[220px]'>
        {isEmpty ? (
          <div className='flex flex-col items-center justify-center h-full text-gray-400'>
            <span className='text-3xl mb-2'>🏅</span>
            <p className='text-sm'>Chưa có dữ liệu</p>
          </div>
        ) : (
          <Bar options={options} data={data} />
        )}
      </div>
    </div>
  )
}

export default function SportEventCategoryCharts({ sportEvents = {} }) {
  const { topOutdoorCategories = [], topIndoorCategories = [] } = sportEvents

  return (
    <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
      <CategoryChart
        title='Sự kiện Ngoài trời'
        emoji='🌿'
        categories={topOutdoorCategories}
        eventColor='rgba(34, 197, 94, 0.8)'
        participantColor='rgba(16, 185, 129, 0.5)'
        gradientFrom='from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
        gradientTo='from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20'
      />
      <CategoryChart
        title='Sự kiện Trong nhà'
        emoji='🏠'
        categories={topIndoorCategories}
        eventColor='rgba(168, 85, 247, 0.8)'
        participantColor='rgba(139, 92, 246, 0.5)'
        gradientFrom='from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'
        gradientTo='from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20'
      />
    </div>
  )
}
