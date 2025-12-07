import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  Layout,
  Space,
  Skeleton,
  Modal,
  Avatar,
  Spin,
  Row,
  Col,
  Image,
} from 'antd'
import { signInWithRedirect } from '@aws-amplify/auth'
import { Context } from '../context/provider'
import { useIsMobile } from '../hooks/windowSize'
import { callApi } from '../helpers/api'
import MenuWrapper from '../component/Menu'
import FooterWrapper from '../component/Footer'
import HeaderWrapper from '../component/Header'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserOutlined, LoadingOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import { useIndexedDBImages } from '../hooks/indexedDB'
const { Content } = Layout
const { TextArea } = Input
const UserDetails = () => {
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()
  const { clearAllIds } = useIndexedDBImages()
  const { userId } = location.state || ''
  if (!userId) {
    navigate('/')
  }
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
  const [loading, setLoading] = useState(false)

  const { setUnreadChatCount, user } = useContext(Context)

  const [account, setAccount] = useState({})

  useEffect(() => {
    const getChatAndAccount = async () => {
      try {
        setLoading(true)
        const currentUser = user
        const chatCountPromise = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            currentUser.userId
          )}&count=${encodeURIComponent(true)}`,
          'GET'
        )
        const accountPromise = callApi(
          `https://api.reusifi.com/prod/getAccount?userId=${encodeURIComponent(
            userId
          )}&userDetails=${encodeURIComponent(true)}`,
          'GET'
        )
        const [chatCount, account] = await Promise.all([
          chatCountPromise,
          accountPromise,
        ])
        setUnreadChatCount(chatCount.data.count)
        setAccount(account?.data?.items)
        setLoading(false)
      } catch (err) {
        // message.error("An Error has occurred")
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
    if (userId) {
      getChatAndAccount()
    }
  }, [userId])

  return (
    <Layout
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#F9FAFB',
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
          <MenuWrapper defaultSelectedKeys={['6-1']} isMobile={isMobile} />
        </HeaderWrapper>
      )}
      <Content>
        <div
          style={{
            background: '#F9FAFB',
            borderRadius: '0px',
            overflowY: 'scroll',
            height: '100%',
            overflowX: 'hidden',
            padding: '15px 15px 70px 15px',
            scrollbarWidth: 'none',
          }}
        >
          {!loading && (
            <Space
              size="middle"
              direction="vertical"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '20px',
              }}
            >
              {account?.image && account?.image !== 'DELETE_IMAGE' && (
                <Space.Compact
                  size="large"
                  style={{
                    display: 'flex',
                  }}
                >
                  <Image
                    imgProps={{
                      loading: 'lazy',
                    }}
                    width={'100px'}
                    preview={true}
                    src={account?.image}
                    alt={'No Longer Available'}
                    style={{
                      objectFit: 'cover',
                      borderRadius: '5px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    placeholder={
                      <div
                        style={{
                          height: '150px',
                          width: '100px',
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
                                fontSize: 48,
                                color: '#52c41a',
                              }}
                              spin
                            />
                          }
                        />
                      </div>
                    }
                  />
                </Space.Compact>
              )}
              {(!account?.image || account?.image === 'DELETE_IMAGE') && (
                <Avatar size={150} icon={<UserOutlined />} />
              )}
              {account?.email && (
                <Space.Compact size="large">
                  <Input
                    readOnly
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                      marginTop: '30px',
                    }}
                    value={account?.email}
                    maxLength={100}
                  />
                </Space.Compact>
              )}
              <Space.Compact size="large">
                <Input
                  readOnly
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                    marginTop: '30px',
                  }}
                  placeholder="Name"
                  value={account?.name}
                  maxLength={100}
                />
              </Space.Compact>
              <Space.Compact size="large">
                <TextArea
                  readOnly
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                  }}
                  autoSize={{ minRows: 8, maxRows: 8 }}
                  placeholder="Description"
                  maxLength={300}
                  value={account?.description}
                />
              </Space.Compact>
            </Space>
          )}
          {loading && (
            <Row gutter={[30, 30]}>
              {Array.from({ length: 4 }).map((_, index) => {
                return (
                  <Col
                    key={index}
                    xs={24}
                    sm={24}
                    md={24}
                    lg={24}
                    xl={24}
                    xxl={24}
                    style={{ display: 'flex', justifyContent: 'center' }}
                  >
                    {index === 0 && (
                      <Skeleton.Avatar size={150} active shape={'circle'} />
                    )}
                    {index !== 0 && (
                      <Skeleton.Node
                        style={{
                          width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                          height: index !== 3 ? '40px' : '214px',
                          borderRadius: '8px',
                        }}
                        active
                      />
                    )}
                  </Col>
                )
              })}
            </Row>
          )}
        </div>
      </Content>
      {isMobile && (
        <FooterWrapper>
          <MenuWrapper defaultSelectedKeys={['6-1']} isMobile={isMobile} />
        </FooterWrapper>
      )}
    </Layout>
  )
}
export default UserDetails
