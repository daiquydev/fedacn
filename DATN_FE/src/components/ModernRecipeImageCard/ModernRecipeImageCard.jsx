import React, { useState } from 'react'
import { AiOutlineClockCircle, AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { BsFillLightningChargeFill, BsFillBookmarkFill, BsBookmark } from 'react-icons/bs'
import { FaEye, FaShare, FaUsers } from 'react-icons/fa'
import { MdPerson } from 'react-icons/md'
import { getImageUrl } from '../../utils/imageUrl'
import { Gallery, Item } from 'react-photoswipe-gallery'

const ModernRecipeImageCard = ({ 
  recipe, 
  isLiked, 
  isBookmarked, 
  onLike, 
  onBookmark, 
  onShare,
  showStats = true 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  if (!recipe) return null

  return (
    <div className="relative group">
      {/* Main Image Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        {/* Image */}
        <div className="aspect-[4/3] relative">
          <Gallery>
            <Item
              original={getImageUrl(recipe.image)}
              thumbnail={getImageUrl(recipe.image)}
              width="1200"
              height="900"
            >
              {({ ref, open }) => (
                <img
                  ref={ref}
                  onClick={open}
                  src={getImageUrl(recipe.image)}
                  alt={recipe.name}
                  className={`w-full h-full object-cover cursor-pointer transition-all duration-500 ${
                    imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  loading="lazy"
                />
              )}
            </Item>
          </Gallery>
          
          {/* Loading overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Floating Action Buttons */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
            {/* Share Button */}
            <button
              onClick={onShare}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 hover:scale-110"
            >
              <FaShare size={14} />
            </button>
            
            {/* Bookmark Button */}
            <button
              onClick={onBookmark}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 hover:scale-110"
            >
              {isBookmarked ? (
                <BsFillBookmarkFill size={14} className="text-yellow-400" />
              ) : (
                <BsBookmark size={14} />
              )}
            </button>
          </div>

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <div className="flex items-center justify-between text-white">
              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <AiOutlineClockCircle />
                  <span>{recipe.time || 0} phút</span>
                </div>
                <div className="flex items-center gap-1">
                  <BsFillLightningChargeFill />
                  <span>{recipe.difficulty || 'Dễ'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaUsers />
                  <span>{recipe.servings || 2} người</span>
                </div>
              </div>
              
              {/* View Count */}
              <div className="flex items-center gap-1 text-sm opacity-80">
                <FaEye />
                <span>{recipe.view || 0}</span>
              </div>
            </div>
          </div>

          {/* Difficulty Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium">
              {recipe.difficulty || 'Dễ'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar (below image) */}
      {showStats && (
        <div className="mt-4 flex items-center justify-between">
          {/* Left: Like & Views */}
          <div className="flex items-center gap-4">
            <button
              onClick={onLike}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              {isLiked ? (
                <AiFillHeart className="text-red-500" size={20} />
              ) : (
                <AiOutlineHeart size={20} />
              )}
              <span className="text-sm font-medium">{recipe.like_count || 0}</span>
            </button>
            
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FaEye size={16} />
              <span className="text-sm">{recipe.view || 0} lượt xem</span>
            </div>
          </div>

          {/* Right: Author Info */}
          <div className="flex items-center gap-2">
            <img
              src={recipe.user?.avatar || '/default-avatar.jpg'}
              alt={recipe.user?.username}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-white">
                {recipe.user?.username || recipe.user?.name}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {recipe.created_at && new Date(recipe.created_at).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModernRecipeImageCard
