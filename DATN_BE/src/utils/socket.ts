import { Server } from 'socket.io'
import { Server as ServerHttp } from 'http'
import { TokenPayload } from '~/models/requests/authUser.request'
import { verifyAccessToken } from './common'
// http://localhost:3000
// https://datn-fe-mu.vercel.app
const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket']
  })
  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}

  // ── Video call room participants info: { [socketId]: { userId, userName, userAvatar } }
  const vcRoomUsers: {
    [socketId: string]: { userId: string; userName: string; userAvatar: string | null; roomId: string }
  } = {}

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    console.log(token)
    const access_token = token?.split(' ')[1]
    try {
      const decoded_authorization = await verifyAccessToken(access_token)
      console.log(decoded_authorization)
      // Truyền decoded_authorization vào socket để sử dụng ở các middleware khác
      socket.handshake.auth.decoded_authorization = decoded_authorization
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })
  io.on('connection', (socket) => {
    console.log(`user ${socket.id} connected`)
    const user_id = (socket.handshake.auth.decoded_authorization as TokenPayload).user_id
    if (!user_id) {
      return
    }
    users[user_id] = {
      socket_id: socket.id
    }
    console.log(users)

    socket.on('like post', (data) => {
      console.log(data)
      // nếu data.to  === key của user trong users thì return

      if (!users[data.to]) {
        return
      }
      const receiver_socket_id = users[data.to].socket_id

      // console.log('socket_id', socket.id)
      // console.log('receiver_socket_id', receiver_socket_id)

      if (socket.id === receiver_socket_id) {
        console.log('User không tự thông báo like post cho chính mình')
        return
      }

      if (!receiver_socket_id) {
        return
      }
      socket.to(receiver_socket_id).emit('toast like', {
        content: data.content,
        from: user_id,
        name: data.name,
        avatar: data.avatar
      })
    })

    socket.on('share post', (data) => {
      console.log(data)

      if (!users[data.to]) {
        return
      }

      const receiver_socket_id = users[data.to].socket_id

      if (socket.id === receiver_socket_id) {
        console.log('User không tự thông báo share post cho chính mình')
        return
      }

      if (!receiver_socket_id) {
        return
      }

      socket.to(receiver_socket_id).emit('toast share', {
        content: data.content,
        from: user_id,
        name: data.name,
        avatar: data.avatar
      })
    })

    socket.on('comment post', (data) => {
      console.log(data)

      if (!users[data.to]) {
        return
      }

      const receiver_socket_id = users[data.to].socket_id

      if (socket.id === receiver_socket_id) {
        console.log('User không tự thông báo comment post cho chính mình')
        return
      }

      if (!receiver_socket_id) {
        return
      }

      socket.to(receiver_socket_id).emit('toast comment', {
        content: data.content,
        from: user_id,
        name: data.name,
        avatar: data.avatar
      })
    })

    socket.on('comment child post', (data) => {
      console.log(data)

      if (!users[data.to]) {
        return
      }

      const receiver_socket_id = users[data.to].socket_id

      if (socket.id === receiver_socket_id) {
        console.log('User không tự thông báo comment child post cho chính mình')
        return
      }

      if (!receiver_socket_id) {
        return
      }

      socket.to(receiver_socket_id).emit('toast comment child', {
        content: data.content,
        from: user_id,
        name: data.name,
        avatar: data.avatar
      })
    })

    socket.on('follow', (data) => {
      console.log(data)

      if (!users[data.to]) {
        return
      }

      const receiver_socket_id = users[data.to].socket_id

      if (socket.id === receiver_socket_id) {
        console.log('User không tự thông báo follow cho chính mình')
        return
      }

      if (!receiver_socket_id) {
        return
      }

      socket.to(receiver_socket_id).emit('toast follow', {
        content: data.content,
        from: user_id,
        name: data.name,
        avatar: data.avatar
      })
    })

    socket.on('disconnect', () => {
      delete users[user_id]
      console.log(`user ${socket.id} disconnected`)

      // ── WebRTC: notify all rooms this user was in ──────────────────────────
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit('peer-left', { userId: user_id, socketId: socket.id })
        }
      })
    })

    // ═══════════════════════════════════════════════════════════════════════════
    // WebRTC Video Call Signaling
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Join a video call room (roomId = eventId)
    socket.on('vc:join-room', ({ roomId, userId, userName, userAvatar }) => {
      socket.join(roomId)

      // Store this socket's user info for later lookup
      vcRoomUsers[socket.id] = { userId, userName, userAvatar, roomId }

      // Notify other peers in the room that a new user joined
      socket.to(roomId).emit('vc:user-joined', {
        userId,
        userName,
        userAvatar,
        socketId: socket.id
      })

      // Send the new user a list of existing peers WITH their user info
      const roomSockets = io.sockets.adapter.rooms.get(roomId)
      const peers: { socketId: string; userId: string; userName: string; userAvatar: string | null }[] = []
      if (roomSockets) {
        roomSockets.forEach((sid) => {
          if (sid !== socket.id && vcRoomUsers[sid]) {
            peers.push({
              socketId: sid,
              userId: vcRoomUsers[sid].userId,
              userName: vcRoomUsers[sid].userName,
              userAvatar: vcRoomUsers[sid].userAvatar
            })
          }
        })
      }
      socket.emit('vc:existing-peers', { peers })
      console.log(`[VC] ${userId} joined room ${roomId}, existing peers: ${peers.length}`)
    })

    // ── Leave room
    socket.on('vc:leave-room', ({ roomId }) => {
      socket.to(roomId).emit('vc:user-left', { socketId: socket.id, userId: user_id })
      delete vcRoomUsers[socket.id]
      socket.leave(roomId)
    })

    // ── WebRTC Offer (initiator → receiver)
    socket.on('vc:offer', ({ to, offer, from }) => {
      const senderInfo = vcRoomUsers[socket.id]
      io.to(to).emit('vc:offer', {
        offer,
        from: socket.id,
        fromUserId: user_id,
        fromUserName: senderInfo?.userName || null,
        fromUserAvatar: senderInfo?.userAvatar || null
      })
    })

    // ── WebRTC Answer (receiver → initiator)
    socket.on('vc:answer', ({ to, answer }) => {
      io.to(to).emit('vc:answer', { answer, from: socket.id })
    })

    // ── ICE Candidate relay
    socket.on('vc:ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('vc:ice-candidate', { candidate, from: socket.id })
    })

    // ── Screen share state broadcast
    socket.on('vc:screen-sharing', ({ roomId, sharing }) => {
      socket.to(roomId).emit('vc:screen-sharing', { socketId: socket.id, sharing, userId: user_id })
    })
  })
}

export default initSocket
