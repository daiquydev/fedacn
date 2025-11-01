// Base URL for the API
const API_BASE_URL = 'http://localhost:5000'

/**
 * Convert relative image path to full URL
 * @param {string} imagePath - Relative image path from backend (e.g., "/uploads/images/posts/filename.webp")
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // If it starts with '/', it's already a relative path from root
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`
  }
  
  // Otherwise, prepend with /uploads/ (fallback)
  return `${API_BASE_URL}/uploads/${imagePath}`
}

/**
 * Get multiple image URLs
 * @param {string[]} imagePaths - Array of relative image paths
 * @returns {string[]} - Array of full image URLs
 */
export const getImageUrls = (imagePaths) => {
  if (!Array.isArray(imagePaths)) return []
  return imagePaths.map(path => getImageUrl(path))
}
