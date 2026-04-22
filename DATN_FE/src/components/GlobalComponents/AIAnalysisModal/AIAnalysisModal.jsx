import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { FaBrain, FaDumbbell, FaTimes, FaSync, FaPlay, FaHeartbeat, FaRedo, FaInfoCircle, FaCheck, FaGripVertical } from 'react-icons/fa'
import { GiBiceps } from 'react-icons/gi'
import http from '../../../utils/http'
import { getAllExercises } from '../../../apis/exerciseApi'
import { formatExerciseCategoryVi, formatExerciseDifficultyVi } from '../../../utils/exerciseLabels'
import ExerciseDetailModal from '../../ExerciseDetailModal'

const DIFF_COLOR = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
    expert: 'bg-red-100 text-red-700'
}

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
    /** Bài đã chọn để sang trang Tập — mặc định chọn hết khi AI trả kết quả */
    const [selectedExercises, setSelectedExercises] = useState([])
    const [allExercises, setAllExercises] = useState([])
    const [swappingIndex, setSwappingIndex] = useState(null) // index being swapped
    const [errorMsg, setErrorMsg] = useState('')
    const [detailExercise, setDetailExercise] = useState(null)

    useEffect(() => {
        if (!isOpen) {
            setDetailExercise(null)
            setSelectedExercises([])
        }
    }, [isOpen])

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
                const list = data?.suggested_exercises || []
                setHealthAnalysis(data?.health_analysis || '')
                setSuggestedExercises(list)
                setSelectedExercises([...list])
                setStatus('done')
            } catch (err) {
                setErrorMsg('Không thể kết nối AI. Vui lòng thử lại.')
                setStatus('error')
            }
        },
        [calculationType, inputData, calculatedResult]
    )

    const toggleSelectExercise = (ex) => {
        const id = ex._id
        setSelectedExercises((prev) => {
            const already = prev.some((s) => s._id === id)
            if (already) return prev.filter((s) => s._id !== id)
            return [...prev, ex]
        })
    }

    const onDragEndSelected = (result) => {
        if (!result.destination) return
        const items = Array.from(selectedExercises)
        const [moved] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, moved)
        setSelectedExercises(items)
    }

    // Swap a specific exercise at index with a random unused one from allExercises
    const handleSwap = async (idx) => {
        const oldEx = suggestedExercises[idx]
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
                if (oldEx?._id) {
                    setSelectedExercises((prev) => {
                        const wasSelected = prev.some((s) => s._id === oldEx._id)
                        if (!wasSelected) return prev
                        return prev.map((s) => (s._id === oldEx._id ? newSuggested : s))
                    })
                }
            } else {
                // Fallback: pick random from pool
                const random = pool[Math.floor(Math.random() * pool.length)]
                const rep = { ...random, reason: 'Bài tập thay thế phù hợp với tình trạng sức khỏe của bạn.' }
                setSuggestedExercises((prev) => {
                    const updated = [...prev]
                    updated[idx] = rep
                    return updated
                })
                if (oldEx?._id) {
                    setSelectedExercises((prev) => {
                        const wasSelected = prev.some((s) => s._id === oldEx._id)
                        if (!wasSelected) return prev
                        return prev.map((s) => (s._id === oldEx._id ? rep : s))
                    })
                }
            }
        } catch {
            // Fallback: pick random
            const currentIds = suggestedExercises.map((e) => e._id)
            const pool = allExercises.filter((e) => !currentIds.includes(e._id))
            if (pool.length > 0) {
                const random = pool[Math.floor(Math.random() * pool.length)]
                const rep = { ...random, reason: 'Bài tập thay thế phù hợp với tình trạng sức khỏe của bạn.' }
                setSuggestedExercises((prev) => {
                    const updated = [...prev]
                    updated[idx] = rep
                    return updated
                })
                if (oldEx?._id) {
                    setSelectedExercises((prev) => {
                        const wasSelected = prev.some((s) => s._id === oldEx._id)
                        if (!wasSelected) return prev
                        return prev.map((s) => (s._id === oldEx._id ? rep : s))
                    })
                }
            }
        } finally {
            setSwappingIndex(null)
        }
    }

    // Navigate to Training page with pre-selected exercises (only Setup + Workout steps)
    const handleStartWorkout = () => {
        if (selectedExercises.length === 0) return
        onClose()
        navigate('/training', {
            state: {
                source: 'calculator',
                exercises: selectedExercises,
                calculatorInfo: { calculationType, calculatedResult }
            }
        })
    }

    if (!isOpen) return null

    return (
        <>
            <ExerciseDetailModal
                exercise={detailExercise}
                onClose={() => setDetailExercise(null)}
                aiReason={detailExercise?.reason}
            />
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
                            {/* Đánh giá sức khỏe — cùng phong cách thẻ như luồng Tập luyện / AI gợi ý */}
                            <div className='bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-100 dark:border-purple-800 shadow-sm'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <FaHeartbeat className='text-pink-500 shrink-0' />
                                    <p className='text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide'>
                                        Đánh giá sức khỏe từ bác sĩ
                                    </p>
                                </div>
                                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>{healthAnalysis}</p>
                            </div>

                            {/* Đã chọn — giống luồng Tập luyện / AI gợi ý */}
                            <div>
                                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400'>
                                    📌 Đã chọn ({selectedExercises.length}/{suggestedExercises.length} bài) — kéo để sắp xếp lại
                                </p>
                                {selectedExercises.length === 0 && (
                                    <p className='py-3 text-center text-sm text-gray-400'>Chưa chọn bài tập nào — nhấn vào bài ở danh sách gợi ý bên dưới để chọn</p>
                                )}
                                {selectedExercises.length > 0 && (
                                    <DragDropContext onDragEnd={onDragEndSelected}>
                                        <Droppable droppableId='calc-ai-selected-exercises'>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.droppableProps} className='mb-3 space-y-1.5'>
                                                    {selectedExercises.map((ex, idx) => {
                                                        const dragId = ex._id ? `calc-ai-${ex._id}` : `calc-ai-idx-${idx}`
                                                        return (
                                                            <Draggable key={dragId} draggableId={dragId} index={idx}>
                                                                {(dragProvided, snapshot) => (
                                                                    <div
                                                                        ref={dragProvided.innerRef}
                                                                        {...dragProvided.draggableProps}
                                                                        className={`flex items-center gap-2 rounded-xl border-2 border-green-400 bg-green-50 p-2.5 transition-shadow dark:bg-green-900/20 ${snapshot.isDragging ? 'shadow-xl ring-2 ring-green-400' : ''
                                                                            }`}
                                                                    >
                                                                        <div
                                                                            {...dragProvided.dragHandleProps}
                                                                            className='cursor-grab p-1 text-green-400 hover:text-green-600 active:cursor-grabbing'
                                                                        >
                                                                            <FaGripVertical />
                                                                        </div>
                                                                        <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white'>
                                                                            {idx + 1}
                                                                        </span>
                                                                        <div className='min-w-0 flex-1'>
                                                                            <p className='truncate text-sm font-medium text-gray-800 dark:text-gray-200'>{ex.name}</p>
                                                                            <p className='truncate text-[10px] text-gray-400'>{ex.name_vi}</p>
                                                                        </div>
                                                                        {ex.difficulty && (
                                                                            <span
                                                                                className={`flex-shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${ex.difficulty === 'beginner'
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : ex.difficulty === 'intermediate'
                                                                                        ? 'bg-yellow-100 text-yellow-700'
                                                                                        : 'bg-red-100 text-red-700'
                                                                                    }`}
                                                                            >
                                                                                {formatExerciseDifficultyVi(ex.difficulty)}
                                                                            </span>
                                                                        )}
                                                                        <button
                                                                            type='button'
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setDetailExercise(ex)
                                                                            }}
                                                                            className='flex-shrink-0 rounded-full p-1.5 text-blue-500 transition hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                                                            title='Chi tiết bài tập'
                                                                        >
                                                                            <FaInfoCircle className='text-sm' />
                                                                        </button>
                                                                        <button
                                                                            type='button'
                                                                            onClick={() => toggleSelectExercise(ex)}
                                                                            className='flex-shrink-0 rounded-lg bg-red-100 p-1.5 text-xs text-red-500 hover:bg-red-200'
                                                                            title='Bỏ chọn'
                                                                        >
                                                                            <FaTimes />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        )
                                                    })}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}
                            </div>

                            {/* Bài tập gợi ý — nhấn hàng để chọn / bỏ chọn */}
                            <div>
                                <div className='mb-3 flex items-center gap-2'>
                                    <FaDumbbell className='shrink-0 text-blue-500' />
                                    <p className='text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400'>
                                        Bài tập gợi ý ({suggestedExercises.length} bài)
                                    </p>
                                </div>

                                <div className='max-h-[min(400px,45vh)] space-y-2.5 overflow-y-auto pr-0.5'>
                                    {suggestedExercises.map((ex, idx) => {
                                        const isSelected = selectedExercises.some((s) => s._id === ex._id)
                                        return (
                                            <div
                                                key={ex._id || idx}
                                                className={`flex gap-3 rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-md ${isSelected
                                                    ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600'
                                                    }`}
                                            >
                                                <div
                                                    className='flex min-w-0 flex-1 cursor-pointer items-center gap-3'
                                                    onClick={() => toggleSelectExercise(ex)}
                                                    role='button'
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault()
                                                            toggleSelectExercise(ex)
                                                        }
                                                    }}
                                                >
                                                    <div
                                                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm shadow-sm transition-all ${isSelected
                                                            ? 'bg-green-500 text-white shadow-green-200'
                                                            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                                                            }`}
                                                    >
                                                        {isSelected ? <FaCheck /> : <GiBiceps className='text-lg' />}
                                                    </div>
                                                    <div className='min-w-0 flex-1'>
                                                        <div className='mb-0.5 flex flex-wrap items-center gap-2'>
                                                            <p className='text-sm font-semibold text-gray-900 dark:text-gray-100'>{ex.name}</p>
                                                            {ex.difficulty && (
                                                                <span
                                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFF_COLOR[ex.difficulty] ||
                                                                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                                        }`}
                                                                >
                                                                    {formatExerciseDifficultyVi(ex.difficulty)}
                                                                </span>
                                                            )}
                                                            {ex.category && (
                                                                <span className='rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
                                                                    {formatExerciseCategoryVi(ex.category)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {ex.name_vi && <p className='mb-1 text-[11px] text-gray-500 dark:text-gray-400'>{ex.name_vi}</p>}
                                                        {ex.reason && (
                                                            <div className='mt-1.5 flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 dark:border-amber-800 dark:bg-amber-900/20'>
                                                                <span className='shrink-0 pt-0.5 text-[10px]'>💡</span>
                                                                <p className='text-[11px] font-medium leading-snug text-amber-800 dark:text-amber-200'>{ex.reason}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className='flex flex-shrink-0 flex-col gap-1.5 self-start'>
                                                    <button
                                                        type='button'
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setDetailExercise(ex)
                                                        }}
                                                        title='Chi tiết bài tập'
                                                        className='flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition hover:bg-blue-600'
                                                    >
                                                        <FaInfoCircle className='text-sm' />
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() => handleSwap(idx)}
                                                        disabled={swappingIndex !== null}
                                                        title='Đổi bài tập khác'
                                                        className='flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-blue-100 hover:text-blue-600 disabled:opacity-40 dark:bg-gray-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                                                    >
                                                        {swappingIndex === idx ? (
                                                            <FaRedo className='animate-spin text-sm' />
                                                        ) : (
                                                            <FaRedo className='text-sm' />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}

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
                            type='button'
                            onClick={handleStartWorkout}
                            disabled={selectedExercises.length === 0}
                            className='flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed'
                        >
                            <FaPlay className='text-xs' /> Bắt đầu luyện tập ({selectedExercises.length})
                        </button>
                    </div>
                )}
                </div>
            </div>
        </>
    )
}
