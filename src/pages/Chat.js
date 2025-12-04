import React, { useEffect, useState, useRef, useContext } from 'react'
import { Dropdown, message, Spin } from 'antd'
import { Input } from 'antd'
import { Layout, Modal, Image } from 'antd'
import { Button } from 'antd'
import { fetchAuthSession, signInWithRedirect } from '@aws-amplify/auth'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Skeleton, Space, Typography } from 'antd'
import { Context } from '../context/provider'
import { LoadingOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/windowSize'
import { callApi } from '../helpers/api'
import MenuWrapper from '../component/Menu'
import FooterWrapper from '../component/Footer'
import HeaderWrapper from '../component/Header'
import { EllipsisVertical } from 'lucide-react'
import { useIndexedDBImages } from '../hooks/indexedDB'
import { formatTimestamp } from '../helpers/formatTime'
import useWebSocketManager from '../hooks/webSocketManager'
const { TextArea } = Input
const { Content } = Layout
const Chat = () => {
  const [ichatData, setIChatData] = useState([])
  const location = useLocation()
  const navigate = useNavigate()
  const { clearAllIds } = useIndexedDBImages()
  const { recipient } = location.state || ''
  const { conversationId, productId, title, email, image } =
    location.state || ''
  if (
    !recipient &&
    !conversationId &&
    !productId &&
    !title &&
    !email &&
    !image
  ) {
    navigate('/')
  }
  const [messageValue, setMessageValue] = useState('')
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null)
  const bottomRef = useRef(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const scrollableDivRef = useRef(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const { Text } = Typography
  const sendMessage = async (
    message,
    recipientUserId,
    senderUserId,
    productId,
    title,
    image,
    email
  ) => {
    try {
      if (socketRef.current) {
        socketRef.current.send(
          JSON.stringify({
            action: 'sendMessage',
            recipientUserId: recipientUserId,
            senderUserId: senderUserId,
            productId: productId,
            message: message,
            title: title,
            image: image,
            email: email,
          })
        )
      }
    } catch (err) {
      if (isModalVisibleRef.current) {
        return
      }
      isModalVisibleRef.current = true
      if (err?.status === 401) {
        Modal.error(errorSessionConfig)
      } else {
        Modal.error(errorConfig)
      }
    }
  }
  const {
    setIChatInitialLoad,
    setUnreadChatCount,
    setSellingChatData,
    setSellingChatInitialLoad,
    setSellingChatLastEvaluatedKey,
    setBuyingChatData,
    setBuyingChatInitialLoad,
    setBuyingChatLastEvaluatedKey,
    actionType,
    user,
  } = useContext(Context)
  const [chatLoading, setChatLoading] = useState(false)
  const [socketLoading, setSocketLoading] = useState(false)
  const [moreWidth, setMoreWidth] = useState(true)
  const isModalVisibleRef = useRef(false)
  const errorSessionConfig = {
    title: 'Session has expired.',
    content: 'Please login again.',
    closable: false,
    maskClosable: false,
    okText: 'Login',
    onOk: async () => {
      isModalVisibleRef.current = false
      await clearAllIds()
      signInWithRedirect()
    },
  }
  const errorConfig = {
    title: 'An error has occurred.',
    content: 'Please reload.',
    closable: false,
    maskClosable: false,
    okText: 'Reload',
    onOk: () => {
      isModalVisibleRef.current = false
      window.location.reload()
    },
  }
  const isMobile = useIsMobile()
  const calculateLimit = () => {
    const viewportHeight = window.innerHeight
    const itemHeight = 70 // adjust if needed
    const rowsVisible = Math.ceil(viewportHeight / itemHeight)
    const columns = getColumnCount() // depending on screen size (see below)
    return rowsVisible * 8
  }

  const getColumnCount = () => {
    const width = window.innerWidth
    if (width < 576) return 2 // xs
    if (width < 768) return 3 // sm
    if (width < 992) return 4 // md
    if (width < 1200) return 5 // lg
    if (width < 1600) return 6 // xl
    return 8 // xxl
  }

  const [wsConfig, setWsConfig] = useState(null)

  const [limit, setLimit] = useState(0) // default
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (bottomRef?.current) {
        bottomRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'end',
        })
      }
    })
  }

  useEffect(() => {
    let prevWidth = window.innerWidth
    let prevHeight = window.innerHeight
    const updateLimit = () => {
      const newLimit = calculateLimit()
      setLimit(newLimit)
    }

    updateLimit()

    const handleResize = () => {
      const currentWidth = window.innerWidth
      const currentHeight = window.innerHeight
      if (currentWidth > prevWidth) {
        setIChatData([])
        setLastEvaluatedKey(null)
        setIChatInitialLoad(true)
        updateLimit()
        setMoreWidth(true)
      } else {
        setMoreWidth(false)
      }
      if (
        currentHeight < prevHeight &&
        document.activeElement.id === 'chatTextAreaId'
      ) {
        scrollToBottom()
      }
      prevWidth = currentWidth
      prevHeight = currentHeight
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [hasMore])

  const { connect, disconnect, socketRef } = useWebSocketManager()

  const getWebSocketUrl = async (currentUser, productId) => {
    const session = await fetchAuthSession()
    const tokens = session?.tokens

    if (!tokens?.idToken) throw new Error('no-id-token-on-refresh')

    const token = tokens.idToken.toString()
    const baseUrl = `wss://apichat.reusifi.com/production`
    return `${baseUrl}?userId=${currentUser.userId}&productId=${productId}&token=${token}`
  }

  useEffect(() => {
    const init = async () => {
      try {
        setSocketLoading(true)
        const currentUser = user
        const connectConfig = {
          getUrlFn: () =>
            getWebSocketUrl(currentUser, productId || recipient?.item?.uuid),
          onOpen: () => {
            setSocketLoading(false)
          },
          onMessage: (event) => {
            try {
              const data = JSON.parse(event.data)
              setIChatData((prev) => [
                {
                  message: data.message,
                  timestamp: data.timestamp,
                  recipientId: data.recipientUserId,
                  senderId: data.senderUserId,
                  productId: data.productId,
                },
                ...prev,
              ])

              callApi(
                'https://api.reusifi.com/prod/getChatsRead',
                'POST',
                false,
                {
                  userId1: data.recipientUserId,
                  userId2: data.senderUserId,
                  productId: data.productId,
                  read: true,
                }
              )
              if (actionType === 'Selling') {
                setSellingChatData([])
                setSellingChatLastEvaluatedKey(null)
                setSellingChatInitialLoad(true)
              } else {
                setBuyingChatData([])
                setBuyingChatLastEvaluatedKey(null)
                setBuyingChatInitialLoad(true)
              }
            } catch (err) {
              if (isModalVisibleRef.current) return
              isModalVisibleRef.current = true
              if (err?.status === 401) {
                Modal.error(errorSessionConfig)
              } else {
                Modal.error(errorConfig)
              }
            }
          },
          onError: () => {},
          onClose: () => {},
        }
        setWsConfig(connectConfig)
        await connect(connectConfig)
      } catch {
        setSocketLoading(false)
        if (isModalVisibleRef.current) return
        isModalVisibleRef.current = true
        Modal.error(errorSessionConfig)
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
        if (wsConfig) {
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
  }, [wsConfig, connect, socketRef.current?.readyState])

  const getChats = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop
      setLoading(true)
      let result
      let readRes
      if (recipient && recipient?.['item']?.['email']) {
        ;[result, readRes] = await Promise.all([
          callApi(
            `https://api.reusifi.com/prod/getChatsConversation?userId1=${encodeURIComponent(
              user.userId
            )}&userId2=${encodeURIComponent(
              recipient['item']['email']
            )}&productId=${encodeURIComponent(
              recipient['item']['uuid']
            )}&lastEvaluatedKey=${encodeURIComponent(
              lastEvaluatedKey
            )}&limit=${encodeURIComponent(limit)}`,
            'GET'
          ),
          callApi('https://api.reusifi.com/prod/getChatsRead', 'POST', false, {
            userId1: user.userId,
            userId2: recipient['item']['email'],
            productId: recipient['item']['uuid'],
            read: true,
          }),
        ])
        if (actionType === 'Selling') {
          setSellingChatData((sellingChatData) => {
            return sellingChatData.map((item) => {
              let conversationId = [user.userId, recipient['item']['email']]
                .sort()
                .join(`#${recipient['item']['uuid']}#`)
              if (item.conversationId === conversationId) {
                return { ...item, read: 'true' }
              }
              return item
            })
          })
        } else {
          setBuyingChatData((buyingChatData) => {
            return buyingChatData.map((item) => {
              let conversationId = [user.userId, recipient['item']['email']]
                .sort()
                .join(`#${recipient['item']['uuid']}#`)
              if (item.conversationId === conversationId) {
                return { ...item, read: 'true' }
              }
              return item
            })
          })
        }
      } else if (conversationId) {
        let userIds = conversationId.split('#')
        userIds.splice(1, 1)
        let userId2
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId
            break
          }
        }
        ;[result, readRes] = await Promise.all([
          callApi(
            `https://api.reusifi.com/prod/getChatsConversation?userId1=${encodeURIComponent(
              user.userId
            )}&userId2=${encodeURIComponent(
              userId2
            )}&productId=${encodeURIComponent(
              productId
            )}&lastEvaluatedKey=${encodeURIComponent(
              lastEvaluatedKey
            )}&limit=${encodeURIComponent(limit)}`,
            'GET'
          ),
          callApi('https://api.reusifi.com/prod/getChatsRead', 'POST', false, {
            userId1: user.userId,
            userId2,
            productId,
            read: true,
          }),
        ])
        if (actionType === 'Selling') {
          setSellingChatData((sellingChatData) => {
            return sellingChatData.map((item) => {
              let conversationId = [user.userId, userId2]
                .sort()
                .join(`#${productId}#`)
              if (item.conversationId === conversationId) {
                return { ...item, read: 'true' }
              }
              return item
            })
          })
        } else {
          setBuyingChatData((buyingChatData) => {
            return buyingChatData.map((item) => {
              let conversationId = [user.userId, userId2]
                .sort()
                .join(`#${productId}#`)
              if (item.conversationId === conversationId) {
                return { ...item, read: 'true' }
              }
              return item
            })
          })
        }
      }
      setIChatData((prevValue) => [...prevValue, ...result.data.items])
      setLastEvaluatedKey(result.data.lastEvaluatedKey)
      // If no more data to load, set hasMore to false
      if (result.data.lastEvaluatedKey) {
        setHasMore(true)
      } else {
        setHasMore(false)
      }
      setLoading(false)
      setScrollPosition(scrollPosition)
      setIChatInitialLoad(false)
    } catch (err) {
      setLoading(false)
      if (isModalVisibleRef.current) {
        return
      }
      isModalVisibleRef.current = true
      if (err?.status === 401) {
        Modal.error(errorSessionConfig)
      } else if (err?.status === 422) {
        isModalVisibleRef.current = false
        message.info(err?.response?.data?.message)
        navigate(-1)
      } else {
        Modal.error(errorConfig)
      }
      return
    }
  }

  const subMenuItems = [
    {
      key: '1',
      label: (
        <span style={{ fontSize: '13px', fontWeight: '300' }}>Ad details</span>
      ),
    },
  ]

  useEffect(() => {
    const getChatsAndCount = async () => {
      try {
        setChatLoading(true)
        setLoading(true)

        await getChats()
        const getChatCount = await callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          'GET'
        )
        setUnreadChatCount(getChatCount.data.count)
        setChatLoading(false)
        setLoading(false)
      } catch (err) {
        setChatLoading(false)
        setLoading(false)
        if (isModalVisibleRef.current) {
          return
        }
        isModalVisibleRef.current = true
        if (err?.status === 401) {
          Modal.error(errorSessionConfig)
        } else {
          Modal.error(errorConfig)
        }
        return
      }
    }
    if (
      limit &&
      moreWidth &&
      ((recipient && recipient?.['item']?.['email']) ||
        (conversationId && productId))
    ) {
      getChatsAndCount()
    }
  }, [limit, conversationId, recipient, productId, moreWidth])

  useEffect(() => {
    if (scrollableDivRef.current && !loading && !chatLoading)
      requestAnimationFrame(() => {
        if (scrollableDivRef.current) {
          scrollableDivRef.current.scrollTo(0, scrollPosition)
        }
      })
  }, [scrollPosition, loading, ichatData, chatLoading])

  const handleChange = (value) => {
    setMessageValue(value)
  }

  const handleSubmit = () => {
    if (messageValue) {
      if (recipient && recipient?.['item']?.['email']) {
        sendMessage(
          messageValue,
          recipient['item']['email'],
          user.userId,
          recipient['item']['uuid'],
          recipient['item']['title'],
          recipient['images'][0],
          recipient['item']['email']
        )
      } else if (conversationId) {
        let userIds = conversationId.split('#')
        userIds.splice(1, 1)
        let userId2
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId
            break
          }
        }
        sendMessage(messageValue, userId2, user.userId, productId)
      }
      setIChatData((prevValue) => [
        {
          message: messageValue,
          timestamp: Date.now(),
          senderId: user.userId,
          productId: productId,
        },
        ...prevValue,
      ])
      if (actionType === 'Selling') {
        setSellingChatData([])
        setSellingChatLastEvaluatedKey(null)
        setSellingChatInitialLoad(true)
      } else {
        setBuyingChatData([])
        setBuyingChatLastEvaluatedKey(null)
        setBuyingChatInitialLoad(true)
      }
    }
    setMessageValue('')
  }

  const [open, setOpen] = useState(false)

  useEffect(() => {
    const contentBody = document.querySelector('#chatContainer')
    if (contentBody) {
      if (open) {
        requestAnimationFrame(() => {
          contentBody.style.overflow = 'hidden'
          contentBody.style.touchAction = 'none'
        })
      } else {
        requestAnimationFrame(() => {
          contentBody.style.overflow = 'auto'
          contentBody.style.touchAction = 'auto'
        })
      }
    }
    return () => {
      if (contentBody) {
        requestAnimationFrame(() => {
          contentBody.style.overflow = 'auto'
          contentBody.style.touchAction = 'auto'
        })
      }
    }
  }, [open])

  return (
    <Layout
      style={{
        height: '100dvh',
        background: '#F9FAFB',
        overflow: 'scroll',
      }}
    >
      {!isMobile && (
        <HeaderWrapper
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0px',
            height: '50px',
          }}
        >
          <MenuWrapper
            setScrollPosition={setScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={['0']}
            isMobile={isMobile}
          />
        </HeaderWrapper>
      )}
      <HeaderWrapper
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0px',
          height: '50px',
        }}
      >
        <Space
          style={{
            display: 'flex',
            background: 'white',
            width: '100dvw',
            height: '60px',
            padding: '0px 10px 0px 10px',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: '300',
              padding: '15px',
            }}
          >
            {title || recipient?.['item']?.['title']}
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Image
              loading="lazy"
              preview={true}
              width={'30px'}
              src={recipient?.['images']?.[0] || image}
              alt={'No Longer Available'}
              style={{
                height: '40px',
                objectFit: 'cover',
                borderRadius: '5px',
              }}
              onClick={(e) => {
                e.stopPropagation()
              }}
              placeholder={
                <div
                  style={{
                    width: '30px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  <Spin
                    indicator={
                      <LoadingOutlined
                        style={{
                          fontSize: 12,
                          color: '#52c41a',
                        }}
                        spin
                      />
                    }
                  />
                </div>
              }
            />
            <Dropdown
              trigger={['click']}
              menu={{
                items: subMenuItems,
                onClick: () => {
                  navigate('/details', {
                    state: {
                      item: {
                        item: {
                          uuid: productId || recipient?.['item']?.['uuid'],
                          title: title || recipient?.['item']?.['title'],
                          email: email || recipient?.['item']?.['email'],
                        },
                        images: [image || recipient?.['images']?.[0]],
                      },
                      ad:
                        user.userId === recipient?.['item']?.['email'] ||
                        user.userId === email,
                    },
                  })
                },
                style: { width: '150px' },
              }}
            >
              <a
                style={{ display: 'flex' }}
                onClick={(e) => e.preventDefault()}
              >
                <Space>
                  <EllipsisVertical
                    style={{
                      color: '#9CA3AF',
                      display: 'flex',
                    }}
                  />
                </Space>
              </a>
            </Dropdown>
          </div>
        </Space>
      </HeaderWrapper>
      <Content>
        <div
          id={'chatContainer'}
          style={{
            background: '#F9FAFB',
            borderRadius: '0px',
            display: 'flex',
            flexDirection: 'column-reverse',
            height: 'calc(100% - 120px)',
            width: '100%',
            position: 'fixed',
          }}
        >
          <Space.Compact
            size="large"
            style={{
              padding: '10px',
              background: '#F9FAFB',
              display: 'flex',
            }}
          >
            <TextArea
              id="chatTextAreaId"
              onClick={() => {
                scrollToBottom()
                setOpen(true)
              }}
              autoSize={{ minRows: 1, maxRows: 5 }}
              onChange={(event) => handleChange(event.target.value)}
              placeholder="Enter message"
              value={messageValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey || isMobile || window.innerWidth < 1200) {
                    return
                  } else {
                    e.preventDefault()
                    handleSubmit()
                  }
                }
              }}
            />
            <Button
              style={{
                background: '#52c41a',
                display: 'flex',
                alignSelf: 'flex-end',
                fontSize: '13px',
                fontWeight: '300',
              }}
              type="primary"
              onClick={() => handleSubmit()}
            >
              send
            </Button>
          </Space.Compact>
          <div
            id="scrollableDiv"
            ref={scrollableDivRef}
            style={{
              background: '#F9FAFB',
              borderRadius: '0px',
              display: 'flex',
              overflowY: 'auto',
              flexDirection: 'column-reverse',
              scrollbarWidth: 'none',
              width: '100%',
            }}
          >
            <InfiniteScroll
              style={{
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column-reverse',
                background: '#F9FAFB',
              }}
              dataLength={ichatData.length}
              next={() => {
                getChats()
              }}
              hasMore={hasMore}
              inverse
              scrollableTarget="scrollableDiv"
            >
              {!loading && !chatLoading && user && (
                <>
                  {ichatData.map((item) => {
                    if (item.senderId === user.userId) {
                      return (
                        <div
                          key={item.timestamp}
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            padding: '10px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              background: '#E5E7EB',
                              borderRadius: '16px 16px 4px 16px',
                              padding: '10px',
                              maxWidth: '80dvw', // prevent it from overflowing
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                wordBreak: 'break-word',
                                justifyContent: 'end',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {item.message.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                  {line}
                                  <br />
                                </React.Fragment>
                              ))}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'end',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: '10px',
                                }}
                              >
                                {formatTimestamp(item.timestamp)}
                              </Text>
                            </div>
                          </div>
                        </div>
                      )
                    } else {
                      return (
                        <div
                          key={item.timestamp}
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            padding: '10px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              background: '#d9f7be',
                              borderRadius: '16px 16px 16px 4px',
                              padding: '10px',
                              maxWidth: '80dvw', // prevent overflow
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                wordBreak: 'break-word',
                                justifyContent: 'start',
                                paddingLeft: '10px',
                              }}
                            >
                              {item.message.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                  {line}
                                  <br />
                                </React.Fragment>
                              ))}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'start',
                                paddingLeft: '10px',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: '10px',
                                }}
                              >
                                {formatTimestamp(item.timestamp)}
                              </Text>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  })}
                </>
              )}
              {(loading || chatLoading) && (
                <Skeleton
                  style={{ padding: '20px' }}
                  paragraph={{
                    rows: 4,
                  }}
                  active
                />
              )}
            </InfiniteScroll>
          </div>
        </div>
      </Content>
      {isMobile && (
        <FooterWrapper>
          <MenuWrapper
            setScrollPosition={setScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={['0']}
            isMobile={isMobile}
          />
        </FooterWrapper>
      )}
      <div ref={bottomRef}></div>
      {socketLoading && (
        <Spin
          fullscreen
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: '#52c41a' }} spin />
          }
        />
      )}
    </Layout>
  )
}
export default Chat
