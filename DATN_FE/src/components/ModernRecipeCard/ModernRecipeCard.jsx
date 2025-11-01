import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiOutlineClockCircle, AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { BsFillLightningChargeFill, BsFillBookmarkFill, BsBookmark } from 'react-icons/bs'
import { FaEye, FaUsers, FaStar } from 'react-icons/fa'
import { MdPerson } from 'react-icons/md'
import { getImageUrl } from '../../utils/imageUrl'

const ModernRecipeCard = ({ 
  recipe, 
  isLiked = false, 
  isBookmarked = false, 
  onLike, 
  onBookmark,
  showAuthor = true,
  size = 'normal' // 'small', 'normal', 'large'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    small: 'w-full max-w-xs',
    normal: 'w-full max-w-sm',
    large: 'w-full max-w-md'
  }

  const imageSizeClasses = {
    small: 'aspect-[4/3]',
    normal: 'aspect-[4/3]',
    large: 'aspect-[16/10]'
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'dễ':
      case 'easy':
        return 'bg-green-500'
      case 'trung bình':
      case 'medium':
        return 'bg-yellow-500'
      case 'khó':
      case 'hard':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const truncateText = (text, maxLength) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div 
      className={`${sizeClasses[size]} group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className={`relative ${imageSizeClasses[size]} overflow-hidden`}>
        <Link to={`/recipe-detail/${recipe._id}`}>
          <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <img
              src={getImageUrl(recipe.image)}
              alt={recipe.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } ${isHovered ? 'scale-110' : 'scale-100'}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
            
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              </div>
            )}

            {/* Overlay */}
            <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`} />
          </div>
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {/* Difficulty Badge */}
          <span className={`px-2 py-1 ${getDifficultyColor(recipe.difficulty)} text-white text-xs font-medium rounded-full shadow-lg`}>
            {recipe.difficulty || 'Dễ'}
          </span>
          
          {/* Featured/Hot Badge */}
          {recipe.is_featured && (
            <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1">
              🔥 Hot
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        }`}>
          {onBookmark && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onBookmark(recipe._id)
              }}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
            >
              {isBookmarked ? (
                <BsFillBookmarkFill className="text-yellow-500" size={14} />
              ) : (
                <BsBookmark className="text-gray-600" size={14} />
              )}
            </button>
          )}
        </div>

        {/* Quick Stats Overlay */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <AiOutlineClockCircle />
                <span>{recipe.time || 0}p</span>
              </div>
              <div className="flex items-center gap-1">
                <FaUsers />
                <span>{recipe.servings || 2}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <FaEye />
              <span>{recipe.view || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Link to={`/recipe-detail/${recipe._id}`}>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200">
            {truncateText(recipe.name, size === 'small' ? 40 : 60)}
          </h3>
        </Link>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {truncateText(recipe.description, size === 'small' ? 80 : 120)}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          {/* Left: Interactions */}
          <div className="flex items-center gap-4">
            {onLike && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onLike(recipe._id)
                }}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors duration-200"
              >
                {isLiked ? (
                  <AiFillHeart className="text-red-500" size={16} />
                ) : (
                  <AiOutlineHeart size={16} />
                )}
                <span className="text-sm font-medium">{recipe.like_count || 0}</span>
              </button>
            )}
            
            {/* Rating */}
            {recipe.rating && (
              <div className="flex items-center gap-1">
                <FaStar className="text-yellow-500" size={14} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {recipe.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Right: Time & Difficulty */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <AiOutlineClockCircle />
              <span>{recipe.time || 0} phút</span>
            </div>
          </div>
        </div>

        {/* Author Info */}
        {showAuthor && recipe.user && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <img
              src={recipe.user.avatar || '/default-avatar.jpg'}
              alt={recipe.user.username}
              className="w-6 h-6 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <Link
                to={`/user/${recipe.user._id}`}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200 truncate block"
              >
                {recipe.user.username || recipe.user.name}
              </Link>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {recipe.created_at && new Date(recipe.created_at).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Effect Border */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-orange-400 transition-opacity duration-300 pointer-events-none ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  )
}

export default ModernRecipeCard
