import axios from 'axios'
import { toast } from 'react-hot-toast'
import HttpStatusCode from '../constants/httpStatusCode'
import {
  clearLS,
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  setAccessTokenToLS,
  setProfileToLS,
  setRefreshTokenToLS
} from './auth'
import { isAxiosExpiredTokenError, isAxiosUnauthorizedError } from './utils'

const URL = {
  BASE_URL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'
}
class Http {
  constructor() {
    this.accessToken = getAccessTokenFromLS()
    this.refreshToken = getRefreshTokenFromLS()
    this.refreshTokenRequest = null
    this.instance = axios.create({
      baseURL: `${URL.BASE_URL}`,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = 'Bearer ' + this.accessToken
          console.log('📤 Sending Authorization header:', config.headers.Authorization.substring(0, 50) + '...')
          return config
        }
        if (!this.accessToken) {
          console.warn('⚠️ No access token found in storage')
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config
        if (url === '/auth/users/login') {
          // console.log(response.data)
          const { access_token, refresh_token } = response.data.result || {}
          if (access_token) {
            this.accessToken = access_token
            setAccessTokenToLS(access_token)
          }
          if (refresh_token) {
            this.refreshToken = refresh_token
            setRefreshTokenToLS(refresh_token)
          }
          setProfileToLS(response.data.result.user)
        } else if (url === '/auth/users/logout') {
          this.accessToken = ''
          this.refreshToken = ''
          clearLS()
        }
        return response
      },
      (error) => {
        console.log(error)
        const status = error.response?.status
        const url = error.config?.url || ''

        // Suppress toast for preview card calls (404/410 = item deleted, handled gracefully by component)
        const isSportEventPreview = /\/sport-events\/[a-f0-9]{24}$/i.test(url) && (status === 404 || status === 410)
        const isChallengePreview = /\/challenges\/[a-f0-9]{24}$/i.test(url) && (status === 404 || status === 410)

        // Suppress toast for GET requests fetching a single resource that may not exist
        // Components (ActivityPreviewCard, ActivityDetailModal, etc.) handle the empty state silently
        const isGetRequest = error.config?.method?.toLowerCase() === 'get'
        const isResourceFetch = isGetRequest && (
          /\/sport-events\/[a-f0-9]{24}\/activities\/[a-f0-9]{24}/i.test(url) ||
          /\/challenges\/[a-f0-9]{24}\/activities\/[a-f0-9]{24}/i.test(url) ||
          /\/challenges\/[a-f0-9]{24}\/progress\/[a-f0-9]{24}/i.test(url) ||
          /\/sport-events\/[a-f0-9]{24}\/video-sessions\/[a-f0-9]{24}/i.test(url) ||
          /\/sport-events\/[a-f0-9]{24}\/sessions\/[a-f0-9]{24}/i.test(url)
        )
        const isSilentError = isSportEventPreview || isChallengePreview || isResourceFetch

        // Chỉ toast lỗi không phải 422, 401, và không phải silent resource-fetch errors
        if (!isSilentError && ![HttpStatusCode.UnprocessableEntity, HttpStatusCode.Unauthorized].includes(status)) {
          const data = error.response?.data
          console.log(data)
          const message = data?.message || error.message
          toast.error(message)
        }
        if (isAxiosUnauthorizedError(error)) {
          const config = error.response?.config || {}
          const { url } = config
          // Trường hợp Token hết hạn và request đó không phải là của request refresh token
          // thì chúng ta mới tiến hành gọi refresh token
          // console.log(url)
          if (isAxiosExpiredTokenError(error) && url !== '/auth/users/refresh-token') {
            // Hạn chế gọi 2 lần handleRefreshToken
            this.refreshTokenRequest = this.refreshTokenRequest
              ? this.refreshTokenRequest
              : this.handleRefreshToken().finally(() => {
                // Giữ refreshTokenRequest trong 10s cho những request tiếp theo nếu có 401 thì dùng
                setTimeout(() => {
                  this.refreshTokenRequest = null
                }, 5000)
              })
            return this.refreshTokenRequest.then((access_token) => {
              // Nghĩa là chúng ta tiếp tục gọi lại request cũ vừa bị lỗi
              console.log(access_token)
              return this.instance({
                ...config,
                headers: { ...config.headers, Authorization: 'Bearer ' + access_token }
              })
            })
          }

          // Còn những trường hợp như token không đúng
          // không truyền token,
          // token hết hạn nhưng gọi refresh token bị fail
          // thì tiến hành xóa local storage và toast message

          clearLS()
          this.accessToken = ''
          this.refreshToken = ''
          toast.error(error.response?.data.data?.message || error.response?.data.message)
          // window.location.reload()
        }
        return Promise.reject(error)
      }
    )
  }
  handleRefreshToken = () => {
    return this.instance
      .post('/auth/users/refresh-token', {
        refresh_token: this.refreshToken
      })
      .then((res) => {
        console.log(res.data)
        const { access_token, refresh_token } = res.data.result
        setAccessTokenToLS(access_token)
        setRefreshTokenToLS(refresh_token)
        this.accessToken = access_token
        this.refreshToken = refresh_token
        return access_token
      })
      .catch((error) => {
        clearLS()
        this.accessToken = ''
        this.refreshToken = ''
        throw error
      })
  }
}

const http = new Http().instance

export default http
