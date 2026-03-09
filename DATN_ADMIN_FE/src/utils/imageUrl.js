// Base URL cho API (doi thanh env var de deploy duoc)
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000'

/**
 * Lay full URL cua anh.
 * - Neu la Cloudinary URL (https://res.cloudinary.com/...) -> tra ve truc tiep
 * - Neu la full URL khac -> tra ve truc tiep
 * - Neu la relative path -> append voi API base URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''

  if (typeof imagePath === 'object') {
    const candidate = imagePath?.url || imagePath?.path || imagePath?.src || ''
    return getImageUrl(candidate)
  }

  if (typeof imagePath !== 'string') return ''

  const normalized = imagePath.trim()
  if (!normalized) return ''

  // Da la full URL (Cloudinary, hoac bat ky CDN nao) -> tra ve truc tiep
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  // Path tuong doi bat dau bang '/'
  if (normalized.startsWith('/')) {
    return `${API_BASE_URL}${normalized}`
  }

  // Fallback: them /uploads/ o truoc (de tuong thich voi data cu)
  return `${API_BASE_URL}/uploads/${normalized}`
}

/**
 * Lay nhieu URLs
 */
export const getImageUrls = (imagePaths) => {
  if (!Array.isArray(imagePaths)) return []
  return imagePaths.map(path => getImageUrl(path))
}
