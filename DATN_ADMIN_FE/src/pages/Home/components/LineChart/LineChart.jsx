import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import moment from 'moment'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler)

export default function LineChart({ posts = [] }) {
  const labels = posts?.map((item) => moment(item._id).format('DD/MM'))
  const counts = posts?.map((item) => item.count)

  const data = {
    labels,
    datasets: [
      {
        label: 'Bài viết',
        data: counts,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12, weight: '600' },
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Bài viết trên diễn đàn trong 10 ngày gần nhất',
        font: { size: 14, weight: '700' },
        padding: { bottom: 12 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { stepSize: 1, font: { size: 11 } }
      }
    }
  }

  return (
    <div className='bg-white mx-2 rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700'>
      <div className='h-[260px]'>
        {posts?.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-gray-400'>
            <span className='text-4xl mb-2'>📝</span>
            <p className='text-sm'>Chưa có bài viết nào trong 10 ngày qua</p>
          </div>
        ) : (
          <Line options={options} data={data} />
        )}
      </div>
    </div>
  )
}
