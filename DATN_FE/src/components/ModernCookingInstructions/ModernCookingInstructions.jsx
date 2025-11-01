import React, { useState, useRef, useEffect } from 'react'
import { FaPlay, FaPause, FaCheck, FaClock, FaThermometerHalf, FaChevronRight, FaRedo } from 'react-icons/fa'
import { MdTimer, MdRestaurant } from 'react-icons/md'
import { getImageUrl } from '../../utils/imageUrl'

const ModernCookingInstructions = ({ instructions, images = [] }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [timers, setTimers] = useState({})
  const [isTimerRunning, setIsTimerRunning] = useState({})
  const timerRefs = useRef({})

  useEffect(() => {
    // Cleanup timers on unmount
    return () => {
      Object.values(timerRefs.current).forEach(clearInterval)
    }
  }, [])

  const toggleStepCompletion = (stepIndex) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  const startTimer = (stepIndex, duration) => {
    if (isTimerRunning[stepIndex]) {
      // Stop timer
      clearInterval(timerRefs.current[stepIndex])
      setIsTimerRunning(prev => ({ ...prev, [stepIndex]: false }))
      return
    }

    // Start timer
    const durationInSeconds = duration * 60 // Convert minutes to seconds
    setTimers(prev => ({ ...prev, [stepIndex]: durationInSeconds }))
    setIsTimerRunning(prev => ({ ...prev, [stepIndex]: true }))

    timerRefs.current[stepIndex] = setInterval(() => {
      setTimers(prev => {
        const newTime = prev[stepIndex] - 1
        if (newTime <= 0) {
          clearInterval(timerRefs.current[stepIndex])
          setIsTimerRunning(current => ({ ...current, [stepIndex]: false }))
          // Show notification or alert
          alert(`Bước ${stepIndex + 1} đã hoàn thành!`)
          return { ...prev, [stepIndex]: 0 }
        }
        return { ...prev, [stepIndex]: newTime }
      })
    }, 1000)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const extractTimeFromStep = (step) => {
    // Extract time mentions from step text (e.g., "nấu trong 5 phút")
    const timeMatches = step.match(/(\d+)\s*(phút|giờ)/gi)
    if (timeMatches) {
      const match = timeMatches[0]
      const number = parseInt(match.match(/\d+/)[0])
      const unit = match.match(/(phút|giờ)/i)[1].toLowerCase()
      return unit === 'giờ' ? number * 60 : number
    }
    return null
  }

  const extractTemperature = (step) => {
    // Extract temperature mentions from step text
    const tempMatches = step.match(/(\d+)\s*độ/gi)
    return tempMatches ? tempMatches[0] : null
  }

  if (!instructions || instructions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <FaClock size={48} className="mx-auto mb-2 opacity-50" />
        <p>Chưa có hướng dẫn nấu ăn</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Tiến độ nấu ăn
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {completedSteps.size}/{instructions.length} bước
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(completedSteps.size / instructions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        {instructions.map((instruction, index) => {
          const isCompleted = completedSteps.has(index)
          const isActive = activeStep === index
          const stepTime = extractTimeFromStep(instruction)
          const stepTemp = extractTemperature(instruction)
          const currentTimer = timers[index]
          const isRunning = isTimerRunning[index]

          return (
            <div
              key={index}
              className={`group relative p-6 rounded-xl transition-all duration-300 cursor-pointer ${
                isCompleted
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
                  : isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-lg'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700'
              }`}
              onClick={() => setActiveStep(index)}
            >
              {/* Step Header */}
              <div className="flex items-start gap-4">
                {/* Step Number & Checkbox */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {isCompleted ? <FaCheck size={14} /> : index + 1}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStepCompletion(index)
                    }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                    }`}
                  >
                    {isCompleted && <FaCheck className="text-white" size={10} />}
                  </button>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Bước {index + 1}
                    </h4>
                    
                    {/* Time Badge */}
                    {stepTime && (
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium flex items-center gap-1">
                        <FaClock size={10} />
                        {stepTime} phút
                      </span>
                    )}
                    
                    {/* Temperature Badge */}
                    {stepTemp && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-medium flex items-center gap-1">
                        <FaThermometerHalf size={10} />
                        {stepTemp}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-gray-700 dark:text-gray-300 leading-relaxed transition-all duration-200 ${
                      isCompleted ? 'line-through opacity-70' : ''
                    }`}
                  >
                    {instruction}
                  </p>

                  {/* Timer Controls */}
                  {stepTime && (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startTimer(index, stepTime)
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isRunning
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200'
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200'
                        }`}
                      >
                        {isRunning ? <FaPause size={12} /> : <FaPlay size={12} />}
                        {isRunning ? 'Dừng' : 'Bắt đầu'} đếm giờ
                      </button>
                      
                      {currentTimer !== undefined && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono ${
                          currentTimer <= 60 ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          <MdTimer size={14} />
                          {formatTime(currentTimer)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step Image */}
                  {images[index] && (
                    <div className="mt-4">
                      <div className="w-32 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={getImageUrl(images[index])}
                          alt={`Bước ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Step Glow */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 pointer-events-none" />
              )}
            </div>
          )
        })}
      </div>

      {/* Completion Message */}
      {completedSteps.size === instructions.length && (
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
            🎉 Hoàn thành!
          </h3>
          <p className="text-green-600 dark:text-green-400">
            Bạn đã hoàn thành tất cả các bước. Hãy thưởng thức món ăn ngon của mình!
          </p>
        </div>
      )}
    </div>
  )
}

export default ModernCookingInstructions
