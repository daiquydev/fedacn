import React, { useState } from 'react'
import { Gallery, Item } from 'react-photoswipe-gallery'
import { FaExpand, FaImages, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { getImageUrl } from '../../utils/imageUrl'

const EnhancedRecipeImageGallery = ({ 
  mainImage, 
  images = [], 
  recipeName = '',
  className = '' 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoadStates, setImageLoadStates] = useState({})

  // Combine main image with additional images
  const allImages = mainImage ? [mainImage, ...images] : images
  const hasMultipleImages = allImages.length > 1

  const handleImageLoad = (index) => {
    setImageLoadStates(prev => ({ ...prev, [index]: true }))
  }

  const handleImageError = (index) => {
    setImageLoadStates(prev => ({ ...prev, [index]: false }))
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  if (!allImages.length) {
    return (
      <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden ${className}`}>
        <div className="aspect-[4/3] flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FaImages size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Chưa có hình ảnh</p>
            <p className="text-sm">Công thức này chưa có ảnh minh họa</p>
          </div>
        </div>
      </div>
    )
  }

  const currentImage = allImages[currentImageIndex]

  return (
    <div className={`relative group ${className}`}>
      {/* Main Image Container */}
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden">
        <div className="aspect-[4/3] relative">
          <Gallery>
            <Item
              original={getImageUrl(currentImage)}
              thumbnail={getImageUrl(currentImage)}
              width="1200"
              height="900"
            >
              {({ ref, open }) => (
                <div className="relative w-full h-full">
                  <img
                    ref={ref}
                    src={getImageUrl(currentImage)}
                    alt={`${recipeName} - Ảnh ${currentImageIndex + 1}`}
                    className={`w-full h-full object-cover cursor-pointer transition-all duration-500 ${
                      imageLoadStates[currentImageIndex] !== false 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-105'
                    }`}
                    onLoad={() => handleImageLoad(currentImageIndex)}
                    onError={() => handleImageError(currentImageIndex)}
                    onClick={open}
                    loading="lazy"
                  />
                  
                  {/* Loading overlay */}
                  {imageLoadStates[currentImageIndex] === undefined && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  )}

                  {/* Expand Icon */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={open}
                      className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all duration-200 hover:scale-110"
                    >
                      <FaExpand size={14} />
                    </button>
                  </div>
                </div>
              )}
            </Item>
          </Gallery>

          {/* Navigation arrows for multiple images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 hover:scale-110"
              >
                <FaChevronLeft size={14} />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 hover:scale-110"
              >
                <FaChevronRight size={14} />
              </button>
            </>
          )}

          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          )}

          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Thumbnail strip for multiple images */}
      {hasMultipleImages && allImages.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentImageIndex
                  ? 'border-orange-500 scale-105 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
              }`}
            >
              <img
                src={getImageUrl(image)}
                alt={`${recipeName} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Photo gallery for all images */}
      {hasMultipleImages && (
        <div className="hidden">
          <Gallery>
            {allImages.map((image, index) => (
              <Item
                key={index}
                original={getImageUrl(image)}
                thumbnail={getImageUrl(image)}
                width="1200"
                height="900"
              >
                {({ ref, open }) => (
                  <img
                    ref={ref}
                    src={getImageUrl(image)}
                    alt={`${recipeName} - Ảnh ${index + 1}`}
                    style={{ display: 'none' }}
                  />
                )}
              </Item>
            ))}
          </Gallery>
        </div>
      )}
    </div>
  )
}

export default EnhancedRecipeImageGallery
