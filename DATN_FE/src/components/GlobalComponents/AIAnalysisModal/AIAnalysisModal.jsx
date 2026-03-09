import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBrain, FaDumbbell, FaTimes, FaSync, FaPlay, FaHeartbeat, FaExchangeAlt } from 'react-icons/fa'
import { GiBiceps } from 'react-icons/gi'
import http from '../../../utils/http'
import { getAllExercises } from '../../../apis/exerciseApi'

const DIFF_COLOR = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
}
const DIFF_LABEL = { beginner: 'Dễ', intermediate: 'Trung bình', advanced: 'Khó' }
const CAT_LABEL = { strength: 'Sức mạnh', cardio: 'Cardio', stretching: 'Giãn cơ', plyometrics: 'Plyometrics' }

/**
 * AIAnalysisModal
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - calculationType: 'BMI' | 'TDEE' | 'Body Fat' | 'BMR' | 'IBW' | 'LBM' | 'Calo Burned'
 *  - inputData: object (user inputs)
 *  - calculatedResult: object (computed values)
 */
export default function AIAnalysisModal({ isOpen, onClose, calculationType, inputData, calculatedResult }) {
    const navigate = useNavigate()

    const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
    const [healthAnalysis, setHealthAnalysis] = useState('')
    const [suggestedExercises, setSuggestedExercises] = useState([]) // [{...exercise, reason}]
    const [allExercises, setAllExercises] = useState([])
    const [swappingIndex, setSwappingIndex] = useState(null) // index being swapped
    const [errorMsg, setErrorMsg] = useState('')

    // Fetch all exercises from DB
    useEffect(() => {
        if (!isOpen) return
        getAllExercises()
            .then((res) => {
                setAllExercises(res?.data?.result || [])
            })
            .catch(() => { })
    }, [isOpen])

    // Trigger AI analysis when modal opens + exercises loaded
    useEffect(() => {
        if (!isOpen || allExercises.length === 0) return
        runAnalysis(allExercises)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, allExercises])

    const runAnalysis = useCallback(
        async (exerciseList) => {
            setStatus('loading')
            setErrorMsg('')
            try {
                const res = await http.post(
                    '/ai/analyze-fitness',
                    {
                        calculationType,
                        inputData,
                        calculatedResult,
                        availableExercises: exerciseList
                    }
                )
                const data = res?.data
                setHealthAnalysis(data?.health_analysis || '')
                setSuggestedExercises(data?.suggested_exercises || [])
                setStatus('done')
            } catch (err) {
                setErrorMsg('Không thể kết nối AI. Vui lòng thử lại.')
                setStatus('error')
            }
        },
        [calculationType, inputData, calculatedResult]
    )

    // Swap a specific exercise at index with a random unused one from allExercises
    const handleSwap = async (idx) => {
        setSwappingIndex(idx)
        try {
            const currentIds = suggestedExercises.map((e) => e._id)
            const pool = allExercises.filter((e) => !currentIds.includes(e._id))
            if (pool.length === 0) {
                setSwappingIndex(null)
                return
            }

            // Call AI to suggest a replacement for this one slot
            const res = await http.post(
                '/ai/analyze-fitness',
                {
                    calculationType,
                    inputData,
                    calculatedResult,
                    availableExercises: pool.slice(0, 20),
                    swapMode: true,
                    swapCount: 1
                }
            )
            const data = res?.data
            const newSuggested = data?.suggested_exercises?.[0]
            if (newSuggested) {
                setSuggestedExercises((prev) => {
                    const updated = [...prev]
                    updated[idx] = newSuggested
                    return updated
                })
            } else {
                // Fallback: pick random from pool
                const random = pool[Math.floor(Math.random() * pool.length)]
                setSuggestedExercises((prev) => {
                    const updated = [...prev]
                    updated[idx] = { ...random, reason: 'Bài tập thay thế phù hợp với tình trạng sức khỏe của bạn.' }
                    return updated
                })
            }
        } catch {
            // Fallback: pick random
            const currentIds = suggestedExercises.map((e) => e._id)
            const pool = allExercises.filter((e) => !currentIds.includes(e._id))
            if (pool.length > 0) {
                const random = pool[Math.floor(Math.random() * pool.length)]
                setSuggestedExercises((prev) => {
                    const updated = [...prev]
                    updated[idx] = { ...random, reason: 'Bài tập thay thế phù hợp với tình trạng sức khỏe của bạn.' }
                    return updated
                })
            }
        } finally {
            setSwappingIndex(null)
        }
    }

    // Navigate to Challenge page with pre-selected exercises (only Setup + Workout steps)
    const handleStartWorkout = () => {
        onClose()
        navigate('/challenge', {
            state: {
                source: 'calculator',
                exercises: suggestedExercises,
                calculatorInfo: { calculationType, calculatedResult }
            }
        })
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4' onClick={onClose}>
            <div
                className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className='flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl flex-shrink-0'>
                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center'>
                            <FaBrain className='text-sm' />
                        </div>
                        <div>
                            <p className='font-bold text-sm'>AI Phân Tích Sức Khỏe</p>
                            <p className='text-[10px] text-white/70'>Dựa trên chỉ số {calculationType} của bạn</p>
                        </div>
                    </div>
                    <button onClick={onClose} className='p-1 hover:bg-white/20 rounded-full transition'>
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className='flex-1 overflow-y-auto px-5 py-4 space-y-4'>
                    {/* Loading */}
                    {status === 'loading' && (
                        <div className='flex flex-col items-center justify-center py-12'>
                            <div className='relative w-16 h-16 mb-4'>
                                <div className='absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse' />
                                <div className='absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin' />
                                <FaBrain className='absolute inset-0 m-auto text-purple-600 text-xl' />
                            </div>
                            <p className='font-semibold text-gray-700 dark:text-gray-300'>AI đang phân tích chỉ số của bạn...</p>
                            <p className='text-xs text-gray-400 mt-1'>Đang lấy bài tập phù hợp từ hệ thống</p>
                        </div>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <div className='text-center py-8'>
                            <div className='w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3'>
                                <FaTimes className='text-red-500 text-xl' />
                            </div>
                            <p className='text-red-600 font-medium'>{errorMsg}</p>
                            <button
                                onClick={() => runAnalysis(allExercises)}
                                className='mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2 mx-auto'
                            >
                                <FaSync /> Thử lại
                            </button>
                        </div>
                    )}

                    {/* Done */}
                    {status === 'done' && (
                        <>
                            {/* Health Analysis Card */}
                            <div className='bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <FaHeartbeat className='text-pink-500' />
                                    <p className='text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide'>
                                        Đánh giá sức khỏe
                                    </p>
                                </div>
                                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>{healthAnalysis}</p>
                            </div>

                            {/* Exercise Suggestions */}
                            <div>
                                <div className='flex items-center gap-2 mb-3'>
                                    <FaDumbbell className='text-blue-500' />
                                    <p className='text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                                        Bài tập được gợi ý ({suggestedExercises.length} bài)
                                    </p>
                                </div>

                                <div className='space-y-2.5'>
                                    {suggestedExercises.map((ex, idx) => (
                                        <div
                                            key={ex._id || idx}
                                            className='flex gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition'
                                        >
                                            {/* Icon */}
                                            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0'>
                                                <GiBiceps className='text-white text-lg' />
                                            </div>

                                            {/* Info */}
                                            <div className='flex-1 min-w-0'>
                                                <div className='flex items-center gap-2 flex-wrap mb-0.5'>
                                                    <p className='font-semibold text-sm'>{ex.name}</p>
                                                    {ex.difficulty && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${DIFF_COLOR[ex.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                                                            {DIFF_LABEL[ex.difficulty] || ex.difficulty}
                                                        </span>
                                                    )}
                                                    {ex.category && (
                                                        <span className='text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'>
                                                            {CAT_LABEL[ex.category] || ex.category}
                                                        </span>
                                                    )}
                                                </div>
                                                {ex.name_vi && <p className='text-[11px] text-gray-400 mb-1'>{ex.name_vi}</p>}
                                                {/* Reason badge */}
                                                {ex.reason && (
                                                    <div className='inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
                                                        <span className='text-[10px]'>💡</span>
                                                        <p className='text-[11px] text-amber-700 dark:text-amber-300 font-medium'>{ex.reason}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Swap button */}
                                            <button
                                                onClick={() => handleSwap(idx)}
                                                disabled={swappingIndex !== null}
                                                title='Đổi bài tập khác'
                                                className='flex-shrink-0 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-500 hover:text-blue-600 transition disabled:opacity-40'
                                            >
                                                {swappingIndex === idx ? (
                                                    <FaSync className='animate-spin text-sm' />
                                                ) : (
                                                    <FaExchangeAlt className='text-sm' />
                                                )}
                                            </button>
                                        </div>
                                    ))}

                                    {suggestedExercises.length === 0 && (
                                        <p className='text-sm text-gray-400 text-center py-4'>Không tìm được bài tập phù hợp.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {status === 'done' && suggestedExercises.length > 0 && (
                    <div className='px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 flex-shrink-0 bg-white dark:bg-gray-900'>
                        <button
                            onClick={onClose}
                            className='flex-1 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition'
                        >
                            Đóng
                        </button>
                        <button
                            onClick={handleStartWorkout}
                            className='flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 shadow-lg transition'
                        >
                            <FaPlay className='text-xs' /> Bắt đầu luyện tập
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
