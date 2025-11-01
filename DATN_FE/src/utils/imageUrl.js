const DEFAULT_API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000'
const DEFAULT_UPLOAD_BASE_URL = import.meta.env?.VITE_UPLOAD_BASE_URL || DEFAULT_API_BASE_URL
const DEFAULT_MINIO_PUBLIC_URL = import.meta.env?.VITE_MINIO_PUBLIC_URL || import.meta.env?.VITE_UPLOAD_BASE_URL || 'http://localhost:9000'

const trimTrailingSlash = (value) => {
  if (!value) return ''
  return value.endsWith('/') ? value.slice(0, -1) : value
}

const ensureLeadingSlash = (value) => {
  if (!value) return ''
  return value.startsWith('/') ? value : `/${value}`
}

const buildUrl = (base, path) => {
  if (!base) return ''
  const safeBase = trimTrailingSlash(base)
  const safePath = ensureLeadingSlash(path)
  return `${safeBase}${safePath}`
}

/**
 * Convert relative image path to full URL
 * @param {string} imagePath - Relative image path from backend (e.g., "/uploads/images/posts/filename.webp")
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''

  if (typeof imagePath === 'object') {
    const candidate = imagePath?.url || imagePath?.path || imagePath?.src || ''
    return getImageUrl(candidate)
  }

  if (typeof imagePath !== 'string') {
    return ''
  }

  const normalizedPath = imagePath.trim()
  if (!normalizedPath) return ''

  const sanitizedPath = normalizedPath.replace(/\\/g, '/')

  const isAbsoluteUrl = sanitizedPath.startsWith('http://') || sanitizedPath.startsWith('https://')
  if (isAbsoluteUrl) {
    try {
      const url = new URL(sanitizedPath)
      const shouldRewriteHost =
        ['localhost', '127.0.0.1'].includes(url.hostname) &&
        (!url.port || url.port === '80') &&
        url.pathname.startsWith('/cookhealthy/') &&
        DEFAULT_MINIO_PUBLIC_URL

      if (shouldRewriteHost) {
        return buildUrl(DEFAULT_MINIO_PUBLIC_URL, url.pathname)
      }
    } catch (error) {
      // fall through and return original string
    }
    return sanitizedPath
  }

  const looksLikeMinioObject =
    sanitizedPath.startsWith('cookhealthy/') ||
    sanitizedPath.startsWith('/cookhealthy/') ||
    sanitizedPath.startsWith('meal-plans/') ||
    sanitizedPath.startsWith('/meal-plans/')

  if (looksLikeMinioObject && DEFAULT_MINIO_PUBLIC_URL) {
    return buildUrl(DEFAULT_MINIO_PUBLIC_URL, sanitizedPath)
  }

  if (sanitizedPath.startsWith('/')) {
    return buildUrl(DEFAULT_API_BASE_URL, sanitizedPath)
  }

  return buildUrl(DEFAULT_UPLOAD_BASE_URL, `/uploads/${sanitizedPath}`)
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
