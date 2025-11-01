import React, { useState } from 'react'
import { FaCheck, FaPlus, FaMinus } from 'react-icons/fa'
import { MdScale } from 'react-icons/md'
import { getImageUrl } from '../../../utils/imageUrl'

const ModernIngredientList = ({ ingredients, servings = 1, onServingsChange }) => {
  const [checkedIngredients, setCheckedIngredients] = useState(new Set())
  const [currentServings, setCurrentServings] = useState(servings)

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

  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <MdScale size={48} className="mx-auto mb-2 opacity-50" />
        <p>Chưa có thông tin nguyên liệu</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Servings Adjuster */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          <MdScale className="text-orange-500" size={20} />
          <span className="font-medium text-gray-900 dark:text-white">
            Khẩu phần
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustServings(-1)}
            disabled={currentServings <= 1}
            className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaMinus size={12} />
          </button>
          
          <span className="font-bold text-lg min-w-[3rem] text-center text-gray-900 dark:text-white">
            {currentServings}
          </span>
          
          <button
            onClick={() => adjustServings(1)}
            className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <FaPlus size={12} />
          </button>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="grid gap-3">
        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            className={`group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              checkedIngredients.has(index)
                ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-700'
            }`}
            onClick={() => toggleIngredient(index)}
          >
            <div className="flex items-center gap-4">
              {/* Checkbox */}
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  checkedIngredients.has(index)
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 dark:border-gray-600 group-hover:border-orange-400'
                }`}
              >
                {checkedIngredients.has(index) && (
                  <FaCheck className="text-white" size={12} />
                )}
              </div>

              {/* Ingredient Image */}
              {ingredient.image && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  <img
                    src={getImageUrl(ingredient.image)}
                    alt={ingredient.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Ingredient Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`font-medium transition-all duration-200 ${
                      checkedIngredients.has(index)
                        ? 'text-green-700 dark:text-green-300 line-through'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {ingredient.name}
                  </h4>
                  
                  <div
                    className={`font-semibold transition-all duration-200 ${
                      checkedIngredients.has(index)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    {ingredient.amount && ingredient.unit 
                      ? calculateAmount(ingredient.amount, ingredient.unit)
                      : ingredient.quantity || 'Vừa đủ'
                    }
                  </div>
                </div>

                {/* Nutrition Info (if available) */}
                {ingredient.nutrition && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {ingredient.nutrition.calories && (
                      <span className="mr-4">
                        {Math.round(ingredient.nutrition.calories * currentServings / servings)} kcal
                      </span>
                    )}
                    {ingredient.nutrition.protein && (
                      <span className="mr-4">
                        Protein: {(ingredient.nutrition.protein * currentServings / servings).toFixed(1)}g
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {ingredient.notes && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                    {ingredient.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            Đã chuẩn bị: {checkedIngredients.size}/{ingredients.length} nguyên liệu
          </span>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">
              {Math.round((checkedIngredients.size / ingredients.length) * 100)}% hoàn thành
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(checkedIngredients.size / ingredients.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default ModernIngredientList
