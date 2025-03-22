import { FaRegComment, FaRegHeart, FaHeart, FaRegClock, FaCheckCircle } from 'react-icons/fa'
import { useState } from 'react'

export default function MealPlanCard({ plan, onClick }) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(plan.likes)

  const handleLike = (e) => {
    e.stopPropagation();
    if (liked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={plan.image} 
          alt={plan.title} 
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
        />
        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
          {plan.duration} ngày
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-16 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{plan.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 h-10">{plan.description}</p>
        </div>

        {/* Author info */}
        <div className="flex items-center mb-3">
          <img 
            src={plan.author.avatar} 
            alt={plan.author.name} 
            className="w-8 h-8 rounded-full mr-2 object-cover"
          />
          <div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.author.name}</span>
              {plan.author.isVerified && (
                <FaCheckCircle className="ml-1 text-blue-500 w-3 h-3" />
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(plan.createdAt)}
            </span>
          </div>
        </div>

        {/* Category and interactions */}
        <div className="flex justify-between items-center">
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {plan.category}
          </span>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleLike}
              className="flex items-center text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            >
              {liked ? (
                <FaHeart className="text-red-500 dark:text-red-400 mr-1" />
              ) : (
                <FaRegHeart className="mr-1" />
              )}
              <span className="text-xs">{likesCount}</span>
            </button>
            
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <FaRegComment className="mr-1" />
              <span className="text-xs">{plan.comments}</span>
            </div>
            
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <FaRegClock className="mr-1" />
              <span className="text-xs">{plan.duration}d</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 