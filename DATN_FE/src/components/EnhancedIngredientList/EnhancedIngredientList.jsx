import React, { useState } from 'react'
import { FaCheck, FaPlus, FaMinus, FaImage } from 'react-icons/fa'
import { MdScale, MdLocalDining } from 'react-icons/md'
import { getImageUrl } from '../../utils/imageUrl'

const EnhancedIngredientList = ({ ingredients, servings = 1, onServingsChange }) => {
  const [checkedIngredients, setCheckedIngredients] = useState(new Set())
  const [currentServings, setCurrentServings] = useState(servings)
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set())

  const toggleIngredient = (index) => {
    const newChecked = new Set(checkedIngredients)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedIngredients(newChecked)
  }

  const adjustServings = (delta) => {
    const newServings = Math.max(1, currentServings + delta)
    setCurrentServings(newServings)
    onServingsChange?.(newServings)
  }

  const calculateAmount = (amount, unit) => {
    const multiplier = currentServings / servings
    const adjustedAmount = amount * multiplier
    
    // Format number nicely
    if (adjustedAmount < 1) {
      return `${(adjustedAmount * 1000).toFixed(0)}g`
    } else if (adjustedAmount % 1 === 0) {
      return `${adjustedAmount} ${unit}`
    } else {
      return `${adjustedAmount.toFixed(1)} ${unit}`
    }
  }

  const handleImageError = (index) => {
    setImageLoadErrors(prev => new Set(prev).add(index))
  }

  const getIngredientImage = (ingredient, index) => {
    if (imageLoadErrors.has(index)) {
      return null
    }
    
    // Check if ingredient has image
    if (ingredient.image) {
      return getImageUrl(ingredient.image)
    }
    
    // Default ingredient images based on category or name
    const ingredientName = ingredient.name?.toLowerCase() || ''
    if (ingredientName.includes('thịt') || ingredientName.includes('meat')) {
      return '/images/ingredients/meat-default.jpg'
    } else if (ingredientName.includes('rau') || ingredientName.includes('vegetable')) {
      return '/images/ingredients/vegetable-default.jpg'
    } else if (ingredientName.includes('cá') || ingredientName.includes('fish')) {
      return '/images/ingredients/fish-default.jpg'
    }
    
    return null
  }

  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <MdLocalDining size={64} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Chưa có thông tin nguyên liệu</p>
        <p className="text-sm">Công thức này chưa được cập nhật nguyên liệu</p>
      </div>
    )
  }

  const completedCount = checkedIngredients.size
  const totalCount = ingredients.length
  const progressPercentage = (completedCount / totalCount) * 100

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MdLocalDining className="text-orange-500" />
              Nguyên liệu cần chuẩn bị
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {completedCount}/{totalCount} nguyên liệu đã chuẩn bị
            </p>
          </div>
          
          {/* Progress Circle */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200 dark:text-gray-700"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${progressPercentage}, 100`}
                className="text-orange-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* Servings Adjuster */}
        <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <MdScale className="text-orange-500" size={20} />
            <span className="font-medium text-gray-900 dark:text-white">
              Điều chỉnh khẩu phần
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustServings(-1)}
              disabled={currentServings <= 1}
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
            >
              <FaMinus size={14} />
            </button>
            
            <div className="flex flex-col items-center min-w-[4rem]">
              <span className="font-bold text-2xl text-gray-900 dark:text-white">
                {currentServings}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                người
              </span>
            </div>
            
            <button
              onClick={() => adjustServings(1)}
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110"
            >
              <FaPlus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Ingredients Grid */}
      <div className="grid gap-4">
        {ingredients.map((ingredient, index) => {
          const isChecked = checkedIngredients.has(index)
          const ingredientImage = getIngredientImage(ingredient, index)
          
          return (
            <div
              key={index}
              className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                isChecked
                  ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/30 shadow-lg scale-[0.98]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg hover:scale-[1.02]'
              }`}
              onClick={() => toggleIngredient(index)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-transparent"></div>
              </div>

              <div className="relative flex items-center gap-4">
                {/* Ingredient Image */}
                <div className="flex-shrink-0">
                  {ingredientImage ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={ingredientImage}
                        alt={ingredient.name}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(index)}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 flex items-center justify-center">
                      <FaImage className="text-orange-400 dark:text-orange-500" size={24} />
                    </div>
                  )}
                </div>

                {/* Ingredient Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <h4 className={`font-semibold text-lg ${
                        isChecked 
                          ? 'text-green-700 dark:text-green-300 line-through' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {ingredient.name}
                      </h4>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xl font-bold ${
                          isChecked 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-orange-500'
                        }`}>
                          {calculateAmount(ingredient.amount, ingredient.unit)}
                        </span>
                        
                        {currentServings !== servings && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                            {ingredient.amount} {ingredient.unit}
                          </span>
                        )}
                      </div>

                      {/* Category or additional info */}
                      {ingredient.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {ingredient.category}
                        </span>
                      )}
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ml-4 ${
                        isChecked
                          ? 'border-green-500 bg-green-500 shadow-lg'
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-orange-400 group-hover:scale-110'
                      }`}
                    >
                      {isChecked && (
                        <FaCheck className="text-white" size={14} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Animation */}
              {isChecked && (
                <div className="absolute inset-0 bg-green-100 dark:bg-green-900/20 rounded-2xl animate-pulse"></div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Summary */}
      {completedCount > 0 && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <p className="text-green-700 dark:text-green-300 font-medium">
            🎉 Tuyệt vời! Bạn đã chuẩn bị {completedCount}/{totalCount} nguyên liệu
          </p>
          {completedCount === totalCount && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Tất cả nguyên liệu đã sẵn sàng! Bạn có thể bắt đầu nấu ăn rồi 👨‍🍳
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedIngredientList
