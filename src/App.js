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
import useWebSocketManager from './hooks/webSocketManager'

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

  const [wsConfig, setWsConfig] = useState(null)

  const location = useLocation()
  const locationRef = useRef(location.pathname)
  useEffect(() => {
    locationRef.current = location.pathname
  }, [location])

  const { connect, disconnect, socketRef } = useWebSocketManager()

  const getWebSocketUrl = async (currentUser) => {
    const session = await fetchAuthSession()
    const tokens = session?.tokens

    if (!tokens?.idToken) throw new Error('no-id-token-on-refresh')

    const token = tokens.idToken.toString()
    const baseUrl = `wss://apichat.reusifi.com/production`
    return `${baseUrl}?userId=${currentUser.userId}&token=${token}`
  }

  useEffect(() => {
    const init = async () => {
      try {
        const session = await fetchAuthSession()
        const tokens = session?.tokens
        if (!tokens?.idToken) throw new Error('no-id-token')

        const token = tokens.idToken.toString()
        const decoded = jwtDecode(token)

        const currentUser = await getCurrentUser()

        setUser(currentUser)
        setEmail(decoded.email)
        setIsSignedIn(true)
        setChecked(true)

        setSocketLoading(true)

        const connectConfig = {
          getUrlFn: () => getWebSocketUrl(currentUser),
          onOpen: () => {
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
                message.info('You have a new message. Please refresh to view.')
              }
              setUnreadChatCount(1)
            } catch (e) {}
          },
          onError: () => {},
          onClose: () => {},
        }

        setWsConfig(connectConfig)

        await connect(connectConfig)
      } catch (err) {
        setIsSignedIn(false)
        setChecked(true)
        setSocketLoading(false)
      }
    }

    init()

    return () => {
      disconnect()
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        if (isSignedIn && wsConfig) {
          const isClosed =
            !socketRef.current ||
            socketRef.current.readyState === WebSocket.CLOSED

          if (isClosed) {
            await connect(wsConfig)
          }
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isSignedIn, wsConfig, connect, socketRef.current?.readyState])

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
