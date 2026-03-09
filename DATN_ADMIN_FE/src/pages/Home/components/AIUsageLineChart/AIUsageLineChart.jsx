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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function mergeDates(arr1 = [], arr2 = [], arr3 = []) {
    const dateSet = new Set([
        ...arr1.map((i) => i._id),
        ...arr2.map((i) => i._id),
        ...arr3.map((i) => i._id)
    ])
    return [...dateSet].sort()
}

function buildDataset(data = [], dates = []) {
    const map = Object.fromEntries(data.map((d) => [d._id, d.count]))
    return dates.map((d) => map[d] ?? 0)
}

export default function AIUsageLineChart({ aiUsage = {} }) {
    const { dailyCreatePost = [], dailyAnalyzeFitness = [], dailyAnalyzeWorkout = [], createPost = 0, analyzeFitness = 0, analyzeWorkout = 0, total = 0 } = aiUsage

    const allDates = mergeDates(dailyCreatePost, dailyAnalyzeFitness, dailyAnalyzeWorkout)
    const labels = allDates.map((d) => moment(d).format('DD/MM'))

    const data = {
        labels,
        datasets: [
            {
                label: 'AI tạo nội dung sự kiện',
                data: buildDataset(dailyCreatePost, allDates),
                borderColor: 'rgba(168, 85, 247, 1)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: 'AI phân tích sức khỏe',
                data: buildDataset(dailyAnalyzeFitness, allDates),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: 'AI gợi ý tập luyện',
                data: buildDataset(dailyAnalyzeWorkout, allDates),
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
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
        interaction: { mode: 'index', intersect: false },
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
                text: 'Số lượng lượt sử dụng AI trong 10 ngày gần nhất',
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

    const isEmpty = total === 0

    return (
        <div className='bg-white mx-2 rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700'>
            {/* Total counts row */}
            <div className='flex gap-4 mb-4 flex-wrap'>
                <div className='flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl px-4 py-2'>
                    <span className='w-3 h-3 rounded-full bg-purple-500 shrink-0' />
                    <div>
                        <p className='text-xs text-gray-500'>Tạo nội dung sự kiện</p>
                        <p className='text-lg font-black text-purple-600'>{createPost} lần</p>
                    </div>
                </div>
                <div className='flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2'>
                    <span className='w-3 h-3 rounded-full bg-blue-500 shrink-0' />
                    <div>
                        <p className='text-xs text-gray-500'>Phân tích sức khỏe</p>
                        <p className='text-lg font-black text-blue-600'>{analyzeFitness} lần</p>
                    </div>
                </div>
                <div className='flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2'>
                    <span className='w-3 h-3 rounded-full bg-red-500 shrink-0' />
                    <div>
                        <p className='text-xs text-gray-500'>Gợi ý tập luyện</p>
                        <p className='text-lg font-black text-red-500'>{analyzeWorkout} lần</p>
                    </div>
                </div>
                <div className='ml-auto flex items-center gap-1 text-gray-400 text-sm self-center'>
                    🤖 Tổng: <span className='font-black text-gray-700 dark:text-white text-base ml-1'>{total}</span> lần
                </div>
            </div>

            {/* Line chart */}
            <div className='h-[220px]'>
                {isEmpty ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                        <span className='text-4xl mb-2'>🤖</span>
                        <p className='text-sm'>Chưa có lượt sử dụng AI nào trong 10 ngày qua</p>
                    </div>
                ) : (
                    <Line options={options} data={data} />
                )}
            </div>
        </div>
    )
}
