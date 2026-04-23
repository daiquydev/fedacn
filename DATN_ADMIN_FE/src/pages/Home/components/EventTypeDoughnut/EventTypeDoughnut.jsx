import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import InfoTooltip from '../InfoTooltip/InfoTooltip'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function EventTypeDoughnut({ sportEvents = {} }) {
  const { outdoor = 0, indoor = 0, total = 0 } = sportEvents

  const data = {
    labels: ['🌿 Ngoài trời', '🏠 Trong nhà'],
    datasets: [
      {
        label: 'Sự kiện',
        data: [outdoor, indoor],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)'],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(59, 130, 246, 1)'],
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          font: { size: 13, weight: '600' },
          usePointStyle: true,
          pointStyleWidth: 10
        }
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0
            return ` ${ctx.label}: ${ctx.raw} sự kiện (${pct}%)`
          }
        }
      }
    }
  }

  return (
    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 flex flex-col dark:bg-gray-800 dark:border-gray-700 h-full'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-bold text-gray-600 dark:text-gray-300'>🏟️ Phân loại Sự kiện</p>
          <span className='text-[10px] bg-green-50 dark:bg-green-900/30 text-green-500 font-semibold px-2 py-0.5 rounded-full'>{total} sự kiện</span>
        </div>
        <InfoTooltip text='Tỷ lệ sự kiện Ngoài trời vs Trong nhà (theo tổng số sự kiện đang hoạt động). Tỷ lệ phụ thuộc đối tượng mục tiêu và mùa — nên theo dõi xu hướng theo thời gian thay vì cố một tỷ lệ cố định.' />
      </div>
      <div className='relative h-[280px]'>
        {outdoor === 0 && indoor === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-gray-400'>
            <span className='text-4xl mb-2'>🏟️</span>
            <p className='text-sm'>Chưa có sự kiện nào</p>
          </div>
        ) : (
          <Doughnut options={options} data={data} />
        )}
        {total > 0 && (
          <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
            <span className='text-2xl font-black text-gray-800 dark:text-white'>{total}</span>
            <span className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>sự kiện</span>
          </div>
        )}
      </div>
    </div>
  )
}
