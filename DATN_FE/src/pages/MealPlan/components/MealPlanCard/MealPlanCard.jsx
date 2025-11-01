import { useState } from 'react'
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaComment, FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa'
import { MEAL_PLAN_CATEGORIES } from '../../../../constants/mealPlan'
import { getImageUrl } from '../../../../utils/imageUrl'

export default function MealPlanCard({ plan, onClick, onAction }) {
  const [isLiked, setIsLiked] = useState(plan.is_liked || false)
  const [isBookmarked, setIsBookmarked] = useState(plan.is_bookmarked || false)
  const [likesCount, setLikesCount] = useState(plan.likes_count || 0)

  const handleLike = async (e) => {
    e.stopPropagation()
    
    if (isLiked) {
      await onAction('unlike', plan._id)
      setIsLiked(false)
      setLikesCount(prev => Math.max(prev - 1, 0))
    } else {
      await onAction('like', plan._id)
      setIsLiked(true)
      setLikesCount(prev => prev + 1)
    }
  }

  const handleBookmark = async (e) => {
    e.stopPropagation()
    
    if (isBookmarked) {
      await onAction('unbookmark', plan._id)
      setIsBookmarked(false)
    } else {
      await onAction('bookmark', plan._id, { folder_name: '', notes: '' })
      setIsBookmarked(true)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getCategoryName = (categoryId) => {
    return MEAL_PLAN_CATEGORIES[categoryId] || 'Khác'
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={getImageUrl(plan.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
          alt={plan.name || plan.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
          }}
        />
        
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
            {getCategoryName(plan.category)}
          </span>
        </div>
        
        {/* Duration badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full flex items-center">
            <FaCalendarAlt className="mr-1" />
            {plan.duration} ngày
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {plan.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {plan.description}
        </p>

        {/* Author info */}
        <div className="flex items-center mb-3">
          <img 
            src={getImageUrl(plan.author_id?.avatar) || 'https://randomuser.me/api/portraits/men/32.jpg'} 
            alt={plan.author_id?.name}
            className="w-6 h-6 rounded-full mr-2"
            onError={(e) => {
              e.target.src = 'https://randomuser.me/api/portraits/men/32.jpg'
            }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {plan.author_id?.name}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center">
            <FaClock className="mr-1" />
            <span>{formatDate(plan.createdAt)}</span>
          </div>
          {plan.target_calories && (
            <div className="flex items-center">
              <span>{plan.target_calories} cal</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Like button */}
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500 dark:text-gray-400'
              }`}
            >
              {isLiked ? <FaHeart /> : <FaRegHeart />}
              <span className="text-sm">{likesCount}</span>
            </button>

            {/* Comment count */}
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
              <FaComment />
              <span className="text-sm">{plan.comments_count || 0}</span>
            </div>
          </div>

          {/* Bookmark button */}
          <button 
            onClick={handleBookmark}
            className={`transition-colors ${
              isBookmarked 
                ? 'text-yellow-500 hover:text-yellow-600' 
                : 'text-gray-500 hover:text-yellow-500 dark:text-gray-400'
            }`}
          >
            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </button>
        </div>
      </div>
    </div>
  )
}