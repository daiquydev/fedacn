const DEFAULT_API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || 'http://localhost:5000'

/**
 * Lay full URL cua anh.
 * - Cloudinary URL (https://res.cloudinary.com/...) -> tra ve truc tiep
 * - Full URL bat ky -> tra ve truc tiep
 * - Relative path -> append voi API base URL (tuong thich data cu)
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''

  if (typeof imagePath === 'object') {
    const candidate = imagePath?.url || imagePath?.path || imagePath?.src || ''
    return getImageUrl(candidate)
  }

  if (typeof imagePath !== 'string') return ''

  const normalized = imagePath.trim().replace(/\\/g, '/')
  if (!normalized) return ''

  // Da la full URL -> tra ve truc tiep
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  // Path tuong doi bat dau bang '/'
  if (normalized.startsWith('/')) {
    return `${DEFAULT_API_BASE_URL}${normalized}`
  }

  // Fallback: them /uploads/ o truoc (tuong thich data cu)
  return `${DEFAULT_API_BASE_URL}/uploads/${normalized}`
}

/**
 * Lay nhieu URLs
 */
export const getImageUrls = (imagePaths) => {
  if (!Array.isArray(imagePaths)) return []
  return imagePaths.map(path => getImageUrl(path))
}
