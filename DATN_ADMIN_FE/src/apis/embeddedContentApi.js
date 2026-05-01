import http from '../utils/http'

/**
 * API calls used by the admin EmbeddedContentPreview component
 * to fetch details of embedded items in reported posts.
 * These hit the same user-facing endpoints (admin token has access).
 */

// Sport Events
export const getSportEvent = (id) => http.get(`/sport-events/${id}`)
export const getActivity = (eventId, activityId) => http.get(`/sport-events/${eventId}/activities/${activityId}`)

// Challenges
export const getChallenge = (id) => http.get(`/challenges/${id}`)
export const getChallengeActivity = (challengeId, activityId) => http.get(`/challenges/${challengeId}/activity/${activityId}`)
export const getChallengeProgressEntry = (challengeId, progressId) => http.get(`/challenges/${challengeId}/progress-entry/${progressId}`)
