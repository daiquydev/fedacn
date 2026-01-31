import http from '../utils/http'

// Get all sport events
export const getAllSportEvents = (params) => http.get('/sport-events', { params })

// Get single sport event
export const getSportEvent = (id) => http.get(`/sport-events/${id}`)

// Create sport event
export const createSportEvent = (data) => http.post('/sport-events', data)

// Update sport event
export const updateSportEvent = (id, data) => http.put(`/sport-events/${id}`, data)

// Delete sport event
export const deleteSportEvent = (id) => http.delete(`/sport-events/${id}`)

// Join sport event
export const joinSportEvent = (id) => http.post(`/sport-events/${id}/join`)

// Leave sport event
export const leaveSportEvent = (id) => http.post(`/sport-events/${id}/leave`)

// Get my events
export const getMyEvents = (params) => http.get('/sport-events/user/my-events', { params })

// Get joined events
export const getJoinedEvents = (params) => http.get('/sport-events/user/joined-events', { params })

// ==================== SESSION APIs ====================
// Get all sessions for an event
export const getEventSessions = (eventId) => http.get(`/sport-events/${eventId}/sessions`)

// Get next upcoming session
export const getNextSession = (eventId) => http.get(`/sport-events/${eventId}/sessions/next`)

// Get specific session
export const getSession = (eventId, sessionId) => http.get(`/sport-events/${eventId}/sessions/${sessionId}`)

// Create new session (creator only)
export const createSession = (eventId, data) => http.post(`/sport-events/${eventId}/sessions`, data)

// Update session (creator only)
export const updateSession = (eventId, sessionId, data) => http.put(`/sport-events/${eventId}/sessions/${sessionId}`, data)

// Delete session (creator only)
export const deleteSession = (eventId, sessionId) => http.delete(`/sport-events/${eventId}/sessions/${sessionId}`)

// Mark session as completed (creator only)
export const markSessionCompleted = (eventId, sessionId) => http.post(`/sport-events/${eventId}/sessions/${sessionId}/complete`)

// ==================== PROGRESS APIs ====================
// Add progress entry
export const addProgress = (eventId, data) => http.post(`/sport-events/${eventId}/progress`, data)

// Get user's progress history
export const getUserProgress = (eventId) => http.get(`/sport-events/${eventId}/progress`)

// Update progress entry
export const updateProgress = (eventId, progressId, data) => http.put(`/sport-events/${eventId}/progress/${progressId}`, data)

// Delete progress entry
export const deleteProgress = (eventId, progressId) => http.delete(`/sport-events/${eventId}/progress/${progressId}`)

// Get leaderboard
export const getLeaderboard = (eventId, params) => http.get(`/sport-events/${eventId}/progress/leaderboard`, { params })

// Get participants with progress
export const getParticipants = (eventId, params) => http.get(`/sport-events/${eventId}/progress/participants`, { params })

// ==================== POST APIs ====================
// Create event post
export const createEventPost = (eventId, data) => http.post(`/sport-events/${eventId}/posts`, data)

// Get all posts for event (paginated)
export const getEventPosts = (eventId, params) => http.get(`/sport-events/${eventId}/posts`, { params })

// Get single post
export const getEventPost = (eventId, postId) => http.get(`/sport-events/${eventId}/posts/${postId}`)

// Update post (author only)
export const updateEventPost = (eventId, postId, data) => http.put(`/sport-events/${eventId}/posts/${postId}`, data)

// Delete post (author/creator only)
export const deleteEventPost = (eventId, postId) => http.delete(`/sport-events/${eventId}/posts/${postId}`)

// Like/unlike post
export const likeEventPost = (eventId, postId) => http.post(`/sport-events/${eventId}/posts/${postId}/like`)

export const shareEventPost = (eventId, postId) => http.post(`/sport-events/posts/${postId}/share`)

// Comments
export const getEventComments = (postId, params) => http.get(`/sport-events/posts/${postId}/comments`, { params })
export const createEventComment = (postId, body) => http.post(`/sport-events/posts/${postId}/comments`, body)
export const getEventChildComments = (commentId, params) => http.get(`/sport-events/comments/${commentId}/replies`, { params })
export const deleteEventComment = (commentId) => http.delete(`/sport-events/comments/${commentId}`)

// ==================== ATTENDANCE APIs ====================
// Check in to session
export const checkInSession = (eventId, sessionId) => http.post(`/sport-events/${eventId}/sessions/${sessionId}/check-in`)

// Check out from session
export const checkOutSession = (eventId, sessionId) => http.post(`/sport-events/${eventId}/sessions/${sessionId}/check-out`)

// Get my attendance for a session
export const getMyAttendance = (eventId, sessionId) => http.get(`/sport-events/${eventId}/sessions/${sessionId}/my-attendance`)

// Check if I'm checked in
export const isCheckedIn = (eventId, sessionId) => http.get(`/sport-events/${eventId}/sessions/${sessionId}/is-checked-in`)

// Get session attendance (all attendees)
export const getSessionAttendance = (eventId, sessionId) => http.get(`/sport-events/${eventId}/sessions/${sessionId}/attendance`)

// Get attendance summary
export const getAttendanceSummary = (eventId, sessionId) => http.get(`/sport-events/${eventId}/sessions/${sessionId}/summary`)

