import http from '../utils/http'

export const getPostReports = (params = {}) => http.get('/inspectors/post-reports', { params })
export const getPostReportDetail = (id) => http.get(`/inspectors/post-reports/${id}`)
export const acceptPostReport = (id) => http.put(`/inspectors/post-accept/${id}`)
export const rejectPostReport = (id) => http.put(`/inspectors/post-reject/${id}`)

export const getInspectorRecipes = (params = {}) => http.get('/inspectors/recipes', { params })
export const getMealPlanReports = (params = {}) => http.get('/inspectors/meal-plan-reports', { params })
