import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function AIUsageChart({ aiUsage = {} }) {
    const { createPost = 0, analyzeFitness = 0, analyzeWorkout = 0 } = aiUsage

    const labels = ['AI tạo nội dung sự kiện', 'AI phân tích chỉ số sức khỏe', 'AI gợi ý tập luyện']
    const values = [createPost, analyzeFitness, analyzeWorkout]
    const colors = [
        { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgba(168, 85, 247, 1)' },
        { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)' },
        { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)' }
    ]

    const data = {
        labels,
        datasets: [
            {
                label: 'Số lần sử dụng',
                data: values,
                backgroundColor: colors.map((c) => c.bg),
                borderColor: colors.map((c) => c.border),
                borderWidth: 2,
                borderRadius: 10,
                borderSkipped: false
            }
        ]
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Thống kê sử dụng AI (tổng cộng)',
                font: { size: 14, weight: '700' },
                padding: { bottom: 16 }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.raw} lần`
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.06)' },
                ticks: { stepSize: 1, font: { size: 11 } }
            },
            y: {
                grid: { display: false },
                ticks: { font: { size: 12, weight: '600' } }
            }
        }
    }

    const total = createPost + analyzeFitness + analyzeWorkout

    return (
        <div className='bg-white mx-2 rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700'>
            {/* Total badge */}
            <div className='flex items-center gap-2 mb-4'>
                <span className='text-2xl'>🤖</span>
                <div>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>Tổng lượt sử dụng AI</p>
                    <p className='text-2xl font-black text-purple-600 dark:text-purple-400'>{total.toLocaleString('vi-VN')} lần</p>
                </div>
            </div>
            <div className='h-[180px]'>
                {total === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                        <span className='text-4xl mb-2'>🤖</span>
                        <p className='text-sm'>Chưa có lượt sử dụng AI nào</p>
                    </div>
                ) : (
                    <Bar options={options} data={data} />
                )}
            </div>
        </div>
    )
}
