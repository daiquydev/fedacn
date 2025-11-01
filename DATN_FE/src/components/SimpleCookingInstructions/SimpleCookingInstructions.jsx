import React, { useState } from 'react'
import { FaCheck, FaClock, FaThermometerHalf } from 'react-icons/fa'
import parse from 'html-react-parser'

const SimpleCookingInstructions = ({ content }) => {
  const [completedSteps, setCompletedSteps] = useState(new Set())

  const toggleStepCompletion = (stepIndex) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  const extractInstructions = (htmlContent) => {
    if (!htmlContent) return []
    
    try {
      // Create a temporary element to parse HTML
      const temp = document.createElement('div')
      temp.innerHTML = htmlContent
      
      // Try to extract ordered list items first
      const olItems = temp.querySelectorAll('ol li')
      if (olItems.length > 0) {
        return Array.from(olItems).map(item => item.innerHTML?.trim() || '').filter(text => text)
      }
      
      // Try unordered list items
      const ulItems = temp.querySelectorAll('ul li')
      if (ulItems.length > 0) {
        return Array.from(ulItems).map(item => item.innerHTML?.trim() || '').filter(text => text)
      }
      
      // Try paragraphs
      const paragraphs = temp.querySelectorAll('p')
      if (paragraphs.length > 1) {
        return Array.from(paragraphs).map(p => p.innerHTML?.trim() || '').filter(text => text)
      }
      
      // If no structured content found, return the original content as single step
      return [htmlContent]
    } catch (error) {
      console.error('Error parsing instructions:', error)
      return [htmlContent]
    }
  }

  const instructions = extractInstructions(content)

  if (!instructions || instructions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <FaClock size={48} className="mx-auto mb-2 opacity-50" />
        <p>Chưa có hướng dẫn nấu ăn</p>
      </div>
    )
  }

  // If only one instruction, render as regular content
  if (instructions.length === 1) {
    return (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        {parse(instructions[0])}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Tiến độ nấu ăn
          </h4>
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

          return (
            <div
              key={index}
              className={`group relative p-6 rounded-xl transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700'
              }`}
            >
              {/* Step Header */}
              <div className="flex items-start gap-4">
                {/* Step Number & Checkbox */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {isCompleted ? <FaCheck size={14} /> : index + 1}
                  </div>
                  
                  <button
                    onClick={() => toggleStepCompletion(index)}
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
                  </div>

                  <div
                    className={`text-gray-700 dark:text-gray-300 leading-relaxed transition-all duration-200 prose prose-sm max-w-none dark:prose-invert ${
                      isCompleted ? 'line-through opacity-70' : ''
                    }`}
                  >
                    {parse(instruction)}
                  </div>
                </div>
              </div>
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

export default SimpleCookingInstructions
