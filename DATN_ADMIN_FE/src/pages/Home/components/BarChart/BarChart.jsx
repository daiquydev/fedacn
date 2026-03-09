import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const LABEL_MAP = {
  recipes: 'Công thức',
  albums: 'Album',
  blogs: 'Bài viết'
}

export default function BarChart({ food = {} }) {
  const labels = Object.keys(food).map((k) => LABEL_MAP[k] || k)

  const data = {
    labels,
    datasets: [
      {
        label: 'Đã duyệt',
        data: Object.values(food).map((f) => f.total),
        backgroundColor: 'rgba(34, 197, 94, 0.75)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      },
      {
        label: 'Đang chờ',
        data: Object.values(food).map((f) => f.pending),
        backgroundColor: 'rgba(234, 179, 8, 0.75)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      },
      {
        label: 'Đã từ chối',
        data: Object.values(food).map((f) => f.reject),
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
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
          usePointStyle: true,
          padding: 16
        }
      },
      title: {
        display: true,
        text: 'Thống kê Nội dung (Công thức · Album · Bài viết)',
        font: { size: 14, weight: '700' },
        padding: { bottom: 12 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 13, weight: '600' } }
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
        <Bar options={options} data={data} />
      </div>
    </div>
  )
}
