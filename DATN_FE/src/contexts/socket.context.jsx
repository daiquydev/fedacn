import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { getAccessTokenFromLS } from '../utils/auth'
import { AppContext } from './app.context'
import toast from 'react-hot-toast'
import ToastCustorm from '../components/GlobalComponents/ToastCustorm'
import useSound from 'use-sound'
import notifi from '../assets/sounds/notifi.mp3'
import { useQueryClient } from '@tanstack/react-query'

const initialSocketContext = {
  newSocket: null,
  setNewSocket: () => null,
  notification: false,
  setNotification: () => null
}
export const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AppContext)
  const [play] = useSound(notifi)
  const [newSocket, setNewSocket] = useState(initialSocketContext.newSocket)
  const [notification, setNotification] = useState(initialSocketContext.notification)
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = getAccessTokenFromLS()
    if (isAuthenticated && token) {
      // Derive socket URL from env or current host; backend socket runs on same server/port 5000
      const socketURL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:5000`
      const socket = io(socketURL, {
        transports: ['websocket'],
        auth: {
          // Server expects "Bearer <token>" then splits by space
          token: `Bearer ${token}`
        }
      })
      setNewSocket(socket)
      const showIncomingToast = (data) => {
        setNotification(true)
        play()
        toast.custom((t) => <ToastCustorm t={t} name={data.name} content={data.content} avatar={data.avatar} />)
      }

      socket.on('toast like', (data) => {
        console.log('toast like', data)
        showIncomingToast(data)
        queryClient.invalidateQueries({ queryKey: ['check-notification'] })
        queryClient.invalidateQueries({ queryKey: ['notification'] })
      })

      socket.on('toast share', (data) => {
        console.log('toast share', data)
        showIncomingToast(data)
        queryClient.invalidateQueries({ queryKey: ['check-notification'] })
        queryClient.invalidateQueries({ queryKey: ['notification'] })
      })

      socket.on('toast comment', (data) => {
        console.log('toast comment', data)
        showIncomingToast(data)
        queryClient.invalidateQueries({ queryKey: ['check-notification'] })
        queryClient.invalidateQueries({ queryKey: ['notification'] })
      })

      socket.on('toast comment child', (data) => {
        console.log('toast comment child', data)
        showIncomingToast(data)
        queryClient.invalidateQueries({ queryKey: ['check-notification'] })
        queryClient.invalidateQueries({ queryKey: ['notification'] })
      })

      socket.on('toast follow', (data) => {
        console.log('toast follow', data)
        showIncomingToast(data)
        queryClient.invalidateQueries({ queryKey: ['check-notification'] })
        queryClient.invalidateQueries({ queryKey: ['notification'] })
        queryClient.invalidateQueries({ queryKey: ['me'] })
        queryClient.invalidateQueries({ queryKey: ['friend-recommendations'] })
      })

      socket.on('connect_error', (err) => {
        console.log(err.message) // prints the message associated with the error
      })
      return () => {
        socket.disconnect()
      }
    }
  }, [isAuthenticated, setNewSocket, play])

  return (
    <SocketContext.Provider
      value={{
        newSocket,
        setNewSocket,
        notification,
        setNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
