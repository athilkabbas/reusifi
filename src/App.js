import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  Suspense,
  lazy,
  memo,
} from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LoadingOutlined } from '@ant-design/icons'
import { Amplify } from 'aws-amplify'
import awsconfig from './aws-exports'
import { getCurrentUser, fetchAuthSession } from '@aws-amplify/auth'
import { jwtDecode } from 'jwt-decode'
import { message, Spin } from 'antd'
import { Context } from './context/provider'
import './App.css'

import ReusifiLanding from './pages/landingPage'

const Layout = lazy(() => import('./pages/Layout'))
const Home = lazy(() => import('./pages/Home'))
const AddDress = lazy(() => import('./pages/AddDress'))
const Details = lazy(() => import('./pages/Details'))
const Chat = lazy(() => import('./pages/Chat'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const Ads = lazy(() => import('./pages/Ads'))
const Favourites = lazy(() => import('./pages/Favourite'))
const Account = lazy(() => import('./pages/Account'))
const UserDetails = lazy(() => import('./pages/UserDetails'))
const ReportAd = lazy(() => import('./pages/Report'))
const Queries = lazy(() => import('./pages/Queries'))
const CheckoutForm = lazy(() => import('./pages/checkoutForm'))
const Return = lazy(() => import('./pages/Return'))
const BoostAd = lazy(() => import('./pages/BoostAd'))

Amplify.configure(awsconfig)

const FullscreenSpinner = memo(function FullscreenSpinner() {
  return (
    <Spin
      fullscreen
      indicator={
        <LoadingOutlined style={{ fontSize: 48, color: '#52c41a' }} spin />
      }
    />
  )
})

function useWebSocketManager() {
  const socketRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const backoffTimeoutRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)
  const isManuallyClosedRef = useRef(false)

  const connect = ({
    url,
    onOpen,
    onMessage,
    onError,
    onClose,
    maxAttempts = 6,
  }) => {
    if (socketRef.current) return

    const ws = new WebSocket(url)
    socketRef.current = ws

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0
      onOpen?.()

      // heartbeat ping to keep connection alive
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = setInterval(() => {
        try {
          if (ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ type: 'ping' }))
        } catch (e) {
          // ignore
        }
      }, 25_000) // 25s
    }

    ws.onmessage = (ev) => {
      onMessage?.(ev)
    }

    ws.onerror = (ev) => {
      onError?.(ev)
    }

    ws.onclose = (ev) => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }

      socketRef.current = null
      onClose?.(ev)

      if (isManuallyClosedRef.current) return

      // exponential backoff reconnect
      reconnectAttemptsRef.current += 1
      const attempt = reconnectAttemptsRef.current
      if (attempt <= maxAttempts) {
        const backoff = Math.min(30_000, 1000 * 2 ** attempt)
        backoffTimeoutRef.current = setTimeout(() => {
          connect({ url, onOpen, onMessage, onError, onClose, maxAttempts })
        }, backoff)
      }
    }
  }

  const disconnect = () => {
    isManuallyClosedRef.current = true
    if (backoffTimeoutRef.current) {
      clearTimeout(backoffTimeoutRef.current)
      backoffTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    if (socketRef.current) {
      try {
        socketRef.current.close()
      } catch (e) {
        // ignore
      }
      socketRef.current = null
    }
  }

  return { connect, disconnect, socketRef }
}

function App() {
  return (
    <BrowserRouter>
      <AppWithSession />
    </BrowserRouter>
  )
}

function AppWithSession() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [checked, setChecked] = useState(false)
  const [socketLoading, setSocketLoading] = useState(false)

  const {
    setUnreadChatCount,
    setUser,
    setEmail,
    setSellingChatData,
    setSellingChatInitialLoad,
    setSellingChatLastEvaluatedKey,
    setBuyingChatData,
    setBuyingChatInitialLoad,
    setBuyingChatLastEvaluatedKey,
  } = useContext(Context)

  const location = useLocation()
  const locationRef = useRef(location.pathname)
  useEffect(() => {
    locationRef.current = location.pathname
  }, [location])

  const { connect, disconnect, socketRef } = useWebSocketManager()

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const session = await fetchAuthSession()
        const tokens = session?.tokens
        if (!tokens?.idToken) throw new Error('no-id-token')

        const token = tokens.idToken.toString()
        const decoded = jwtDecode(token)

        const currentUser = await getCurrentUser()
        if (!mounted) return

        setUser(currentUser)
        setEmail(decoded.email)
        setIsSignedIn(true)
        setChecked(true)

        setSocketLoading(true)

        const url = `wss://apichat.reusifi.com/production?userId=${currentUser.userId}&token=${token}`

        connect({
          url,
          onOpen: () => {
            if (!mounted) return
            setSocketLoading(false)
          },
          onMessage: (ev) => {
            try {
              if (locationRef.current !== '/chatPage') {
                setSellingChatData([])
                setSellingChatLastEvaluatedKey(null)
                setSellingChatInitialLoad(true)
                setBuyingChatData([])
                setBuyingChatLastEvaluatedKey(null)
                setBuyingChatInitialLoad(true)
              } else {
                message.info('There is a new message')
              }
              setUnreadChatCount(1)
            } catch (e) {}
          },
          onError: () => {},
          onClose: () => {},
        })
      } catch (err) {
        if (!mounted) return
        setIsSignedIn(false)
        setChecked(true)
        setSocketLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
      disconnect()
    }
  }, [])

  if (checked && !isSignedIn) return <ReusifiLanding />

  return (
    <>
      {checked && isSignedIn && (
        <Suspense fallback={<FullscreenSpinner />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="addProduct" element={<AddDress />} />
              <Route path="details" element={<Details />} />
              <Route path="chat" element={<Chat />} />
              <Route path="userDetails" element={<UserDetails />} />
              <Route path="chatPage" element={<ChatPage />} />
              <Route path="ads" element={<Ads />} />
              <Route path="favourite" element={<Favourites />} />
              <Route path="account" element={<Account />} />
              <Route path="report" element={<ReportAd />} />
              <Route path="query" element={<Queries />} />
              <Route path="checkout" element={<CheckoutForm />} />
              <Route path="return" element={<Return />} />
              <Route path="boost" element={<BoostAd />} />
            </Route>
          </Routes>
        </Suspense>
      )}

      {(!checked || !isSignedIn) && <FullscreenSpinner />}
    </>
  )
}

export default App
