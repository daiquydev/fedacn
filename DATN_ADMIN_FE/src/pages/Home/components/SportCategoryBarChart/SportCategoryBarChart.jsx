import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const CATEGORY_COLORS = [
    'rgba(239, 68, 68, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(59, 130, 246, 0.8)'
]
const CATEGORY_BORDERS = [
    'rgba(239, 68, 68, 1)',
    'rgba(249, 115, 22, 1)',
    'rgba(234, 179, 8, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(59, 130, 246, 1)'
]

export default function SportCategoryBarChart({ topCategories = [] }) {
    const labels = topCategories.map((c) => c.category)
    const participants = topCategories.map((c) => c.totalParticipants)
    const eventCounts = topCategories.map((c) => c.eventCount)

    const data = {
        labels,
        datasets: [
            {
                label: 'Số người tham gia',
                data: participants,
                backgroundColor: CATEGORY_COLORS,
                borderColor: CATEGORY_BORDERS,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            },
            {
                label: 'Số sự kiện',
                data: eventCounts,
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: 'rgba(139, 92, 246, 1)',
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
                    usePointStyle: true
                }
            },
            title: {
                display: true,
                text: 'Top môn Thể thao theo Người tham gia',
                font: { size: 14, weight: '700' },
                padding: { bottom: 12 }
            },
            tooltip: {
                callbacks: {
                    afterLabel: (ctx) => {
                        if (ctx.datasetIndex === 0) return `  Số sự kiện: ${eventCounts[ctx.dataIndex]}`
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 12, weight: '600' } }
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
                {topCategories.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                        <span className='text-4xl mb-2'>🏅</span>
                        <p className='text-sm'>Chưa có dữ liệu môn thể thao</p>
                    </div>
                ) : (
                    <Bar options={options} data={data} />
                )}
            </div>
        </div>
    )
}
