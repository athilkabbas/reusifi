import React, { useContext, useEffect, useRef, useState } from 'react'
import styles from './Details.module.css'
import { Skeleton, Spin, Descriptions, Col, Tag } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { Layout, message, Modal, Popconfirm } from 'antd'
import { Image, Space } from 'antd'
import { Button, Typography, Row } from 'antd'
import { Carousel } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { signInWithRedirect } from '@aws-amplify/auth'
import { Context } from '../context/provider'
import { useIsMobile } from '../hooks/windowSize'
import { callApi } from '../helpers/api'
import MenuWrapper from '../component/Menu'
import FooterWrapper from '../component/Footer'
import HeaderWrapper from '../component/Header'
import AwsMap from '../component/Map'
import CopyButton from '../component/CopyButton'
import { useIndexedDBImages } from '../hooks/indexedDB'
import { formatTimestamp } from '../helpers/formatTime'
const { Content } = Layout
const Details = () => {
  const location = useLocation()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { item, ad } = location.state || ''
  if (!item && !ad) {
    navigate('/')
  }
  const { clearAllIds } = useIndexedDBImages()
  const [chatLoading, setChatLoading] = useState(false)
  const [chatProductLoading, setChatProductLoading] = useState(false)
  const [chatProduct, setChatProduct] = useState(false)
  const [unblockLoading, setUnblockLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activateLoading, setActivateLoading] = useState(false)
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  const {
    setAdData,
    setCount,
    setUnreadChatCount,
    setSellingChatData,
    setSellingChatInitialLoad,
    setSellingChatLastEvaluatedKey,
    setBuyingChatData,
    setBuyingChatInitialLoad,
    setBuyingChatLastEvaluatedKey,
    actionType,
    setActionType,
    user,
    setBoostForm,
  } = useContext(Context)

  const [detailData, setDetailData] = useState([])
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
    content: 'Please try again later.',
    closable: false,
    maskClosable: false,
    okText: 'Reload',
    onOk: () => {
      isModalVisibleRef.current = false
      window.location.reload()
    },
  }

  const { Text } = Typography

  useEffect(() => {
    if (item) {
      try {
        setChatLoading(true)
        setLoading(true)
        setChatProductLoading(true)
        const getChatCount = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          'GET'
        )

        const getData = callApi(
          `https://api.reusifi.com/prod/getProductsId?id=${encodeURIComponent(
            item['item']['uuid']
          )}`,
          'GET'
        )
        const getChatProduct = callApi(
          `https://api.reusifi.com/prod/getChatProduct?userId1=${encodeURIComponent(
            user.userId
          )}&productId=${encodeURIComponent(item['item']['uuid'])}`,
          'GET'
        )
        Promise.all([getChatCount, getData, getChatProduct])
          .then(([chatResult, result, chatProductResult]) => {
            setUnreadChatCount(chatResult.data.count)
            setDetailData(result.data)
            setChatProduct(chatProductResult.data)
            if (
              result.data.length === 0 ||
              (!ad && result.data[0]?.item?.deactivated)
            ) {
              message.info('Ad no longer available')
              navigate(-1)
            }
          })
          .catch((err) => {
            if (isModalVisibleRef.current) {
              return
            }
            isModalVisibleRef.current = true
            if (err?.status === 401) {
              Modal.error(errorSessionConfig)
            } else {
              Modal.error(errorConfig)
            }
          })
          .finally(() => {
            setChatLoading(false)
            setChatProductLoading(false)
            setLoading(false)
          })
      } catch (err) {
        setChatLoading(false)
        setChatProductLoading(false)
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
  }, [item])

  const handleChat = async () => {
    try {
      setUnblockLoading(true)
      await callApi('https://api.reusifi.com/prod/unBlockUser', 'POST', false, {
        unBlock: true,
        userId1: user.userId,
        userId2: chatProduct.userId2,
        productId: item['item']['uuid'],
      })
      if (actionType === 'Selling') {
        setSellingChatData([])
        setSellingChatLastEvaluatedKey(null)
        setSellingChatInitialLoad(true)
      } else {
        setBuyingChatData([])
        setBuyingChatLastEvaluatedKey(null)
        setBuyingChatInitialLoad(true)
      }
      setUnblockLoading(false)
      message.success('User unblocked')
      setActionType('Buying')
      navigate('/chat', { state: { recipient: item } })
    } catch (err) {
      setUnblockLoading(false)
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

  const handleDelete = async () => {
    try {
      setDeleteLoading(true)
      await callApi('https://api.reusifi.com/prod/deleteAdNew', 'POST', false, {
        id: item['item']['uuid'],
      })
      setCount((prevCount) => prevCount - 1)
      setAdData((prevValue) => {
        return prevValue.filter((value) => {
          return value['item']['uuid'] !== item['item']['uuid']
        })
      })
      setDeleteLoading(false)
      message.success('Ad deleted')
      navigate('/ads')
    } catch (err) {
      setDeleteLoading(false)
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
  const [loadedImages, setLoadedImages] = useState([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const handleLoad = (index) => {
    setLoadedImages((prev) => {
      const copy = [...prev]
      copy[index] = true
      return copy
    })
  }

  const descriptionItems = [
    {
      key: '1',
      label: 'Title',
      children: capitalize(detailData?.[0]?.['item']['title'] || ''),
    },
    {
      key: '2',
      label: 'Description',
      children: capitalize(detailData?.[0]?.['item']['description'] || ''),
    },
    {
      key: '3',
      label: 'Category',
      children: capitalize(detailData?.[0]?.['item']['category'] || ''),
    },
    {
      key: '4',
      label: 'SubCategory',
      children: capitalize(detailData?.[0]?.['item']['subCategory'] || ''),
    },
    {
      key: '5',
      label: 'location',
      children: detailData?.[0]?.['item']['locationLabel'],
    },
    {
      key: '6',
      label: 'Price',
      children: `£${detailData?.[0]?.['item']['price']}`,
    },
    {
      key: '7',
      label: 'Ad Id',
      children: (
        <>
          {detailData?.[0]?.['item']['uuid']}
          &nbsp;
          <CopyButton text={detailData?.[0]?.['item']['uuid']}></CopyButton>
        </>
      ),
    },
    {
      key: '8',
      label: 'User details',
      children: (
        <>
          <Link
            to="/userDetails"
            state={{ userId: detailData?.[0]?.item?.email }}
          >
            {detailData?.[0]?.['item']['email']}
          </Link>
          &nbsp;
          <CopyButton text={detailData?.[0]?.['item']['email']}></CopyButton>
        </>
      ),
    },
    {
      key: '9',
      label: 'Posted on',
      children: formatTimestamp(detailData?.[0]?.['item']['createdAtOrig']),
    },
  ]

  if (ad) {
    descriptionItems.push({
      key: '10',
      label: 'Expires on',
      children: formatTimestamp(detailData?.[0]?.item?.expiresAtOrig * 1000),
    })
  }
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
          <MenuWrapper defaultSelectedKeys={['0']} isMobile={isMobile} />
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
            scrollbarWidth: 'none',
            padding: '15px 15px 70px 15px',
          }}
        >
          {!loading &&
            !chatLoading &&
            !chatProductLoading &&
            detailData.length > 0 && (
              <>
                <Space
                  size="large"
                  direction="vertical"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '30px',
                  }}
                >
                  <Space.Compact
                    size="large"
                    style={{
                      display: 'flex',
                    }}
                  >
                    <Image.PreviewGroup
                      preview={{
                        visible: previewVisible,
                        current: previewIndex,
                        onVisibleChange: (visible) =>
                          setPreviewVisible(visible),
                        onChange: (current) => setPreviewIndex(current),
                      }}
                    >
                      {/* Hidden images for preview */}
                      {detailData[0].hiResImg.map((img, i) => (
                        <Image
                          alt={detailData[0]['item']['title']}
                          key={`hidden-${i}`}
                          src={img}
                          style={{ display: 'none' }}
                        />
                      ))}
                      {detailData[0].hiResImg.length === 1 ? (
                        detailData[0].hiResImg.map((img, i) => (
                          <div
                            key={i}
                            style={{
                              width: '100%',
                              height: '100%',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setPreviewIndex(i)
                              setPreviewVisible(true)
                            }}
                          >
                            {!loadedImages[i] && (
                              <div
                                style={{
                                  width: '300px',
                                  height: '400px',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  backgroundColor: '#f0f0f0',
                                }}
                              >
                                <Spin
                                  indicator={
                                    <LoadingOutlined
                                      style={{ fontSize: 48, color: '#52c41a' }}
                                      spin
                                    />
                                  }
                                />
                              </div>
                            )}
                            <Image
                              preview={false} // Disable built-in preview to avoid duplicates
                              src={img}
                              alt={detailData[0]['item']['title']}
                              style={{
                                borderRadius: '12px',
                                display: loadedImages[i] ? 'block' : 'none',
                                width: '300px',
                                height: '400px',
                                objectFit: 'contain',
                              }}
                              onLoad={() => handleLoad(i)}
                              onError={() => handleLoad(i)}
                            />
                          </div>
                        ))
                      ) : (
                        <Carousel
                          arrows
                          style={{
                            borderRadius: '12px',
                            // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            width: 300,
                            height: 400,
                          }}
                        >
                          {detailData[0].hiResImg.map((img, i) => (
                            <div
                              key={i}
                              style={{
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                setPreviewIndex(i)
                                setPreviewVisible(true)
                              }}
                            >
                              {!loadedImages[i] && (
                                <div
                                  style={{
                                    width: '300px',
                                    height: '400px',
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
                              )}
                              <Image
                                preview={false} // Disable built-in preview to avoid duplicates
                                src={img}
                                alt={detailData[0]['item']['title']}
                                style={{
                                  borderRadius: '12px',
                                  display: loadedImages[i] ? 'block' : 'none',
                                  width: '300px',
                                  height: '400px',
                                  objectFit: 'contain',
                                }}
                                onLoad={() => handleLoad(i)}
                                onError={() => handleLoad(i)}
                              />
                            </div>
                          ))}
                        </Carousel>
                      )}
                    </Image.PreviewGroup>
                  </Space.Compact>
                  {detailData?.[0]['item']['boosted'] && (
                    <Space.Compact>
                      <Tag
                        style={{ transform: 'scale(1.5)', color: '#52c41a' }}
                        color={'white'}
                      >
                        Boosted until{' '}
                        {formatTimestamp(detailData?.[0]['item']['createdAt'])}
                      </Tag>
                    </Space.Compact>
                  )}
                  {Object.values(loadedImages).every((item) => item) && (
                    <Space.Compact size="large">
                      <Descriptions
                        size="small"
                        bordered
                        extra={
                          ad ? (
                            detailData[0]['item']['deactivated'] === true ? (
                              <Button
                                onClick={() => {
                                  setBoostForm((prevValue) => {
                                    return {
                                      ...prevValue,
                                      uuid: detailData[0]['item']['uuid'],
                                    }
                                  })
                                  navigate('/checkout', {
                                    state: { adType: 'ACTIVATE' },
                                  })
                                }}
                                style={{
                                  background: '#52c41a',
                                  fontSize: '13px',
                                  fontWeight: '300',
                                }}
                                type="primary"
                              >
                                Activate
                              </Button>
                            ) : (
                              <>
                                {' '}
                                <Button
                                  onClick={() => {
                                    navigate('/boost', {
                                      state: {
                                        uuid: detailData?.[0]?.['item']['uuid'],
                                        expiresAtOrig:
                                          detailData?.[0]?.['item'][
                                            'expiresAtOrig'
                                          ],
                                        boosted:
                                          detailData?.[0]?.['item']['boosted'],
                                        createdAt:
                                          detailData?.[0]?.['item'][
                                            'createdAt'
                                          ],
                                      },
                                    })
                                  }}
                                  style={{
                                    background: '#52c41a',
                                    fontSize: '13px',
                                    fontWeight: '300',
                                  }}
                                  type="primary"
                                >
                                  Boost
                                </Button>
                              </>
                            )
                          ) : (
                            <></>
                          )
                        }
                        style={{
                          borderRadius: '12px',
                          padding: isMobile ? '12px' : '20px',
                          fontSize: '13px',
                          fontWeight: 300,
                        }}
                        title="Ad details"
                        items={descriptionItems}
                      />
                    </Space.Compact>
                  )}
                  {detailData?.[0]['item']['location'] &&
                    Object.values(loadedImages).every((item) => item) && (
                      <AwsMap
                        center={[
                          ...detailData[0]['item']['location'],
                        ].reverse()}
                        zoom={10}
                      />
                    )}
                  {Object.values(loadedImages).every((item) => item) && (
                    <>
                      {ad && (
                        <Space.Compact
                          size="large"
                          style={{
                            display: 'flex',
                            marginTop: '70px',
                          }}
                        >
                          <Popconfirm
                            title="Do you want to delete this Ad?"
                            onConfirm={handleDelete}
                            onCancel={() => {}}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              style={{
                                fontSize: '13px',
                                fontWeight: '300',
                              }}
                              danger
                              type="primary"
                            >
                              Delete
                            </Button>
                          </Popconfirm>
                        </Space.Compact>
                      )}
                      {!ad && (
                        <Space.Compact
                          size="large"
                          style={{
                            display: 'flex',
                            marginTop: '30px',
                          }}
                        >
                          {chatProduct.blocked ? (
                            <Popconfirm
                              title="You have blocked this user, do you want to unblock?"
                              onConfirm={handleChat}
                              onCancel={() => {}}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                style={{
                                  background: '#52c41a',
                                  fontSize: '13px',
                                  fontWeight: '300',
                                }}
                                type="primary"
                              >
                                Chat
                              </Button>
                            </Popconfirm>
                          ) : (
                            <Button
                              style={{
                                background: '#52c41a',
                                fontSize: '13px',
                                fontWeight: '300',
                              }}
                              onClick={() => {
                                setActionType('Buying')
                                navigate('/chat', {
                                  state: { recipient: item },
                                })
                              }}
                              type="primary"
                            >
                              Chat
                            </Button>
                          )}
                        </Space.Compact>
                      )}
                    </>
                  )}
                  {!ad && (
                    <Space.Compact>
                      <Button
                        onClick={() => {
                          navigate('/report', {
                            state: {
                              productId: detailData?.[0]?.['item']['uuid'],
                            },
                          })
                        }}
                        style={{
                          fontSize: '13px',
                          fontWeight: '300',
                          marginTop: '50px',
                        }}
                        danger
                        type="primary"
                      >
                        Report
                      </Button>
                    </Space.Compact>
                  )}
                </Space>
              </>
            )}
          {(loading ||
            chatLoading ||
            chatProductLoading ||
            !Object.values(loadedImages).every((item) => item)) && (
            <Row gutter={[10, 10]}>
              <Col key={0} xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Skeleton.Node
                    style={{ height: '400px', width: '300px' }}
                    active
                  />
                </div>
              </Col>
              <Col key={1} xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Skeleton.Node
                    style={{
                      height: '400px',
                      width: isMobile ? 'calc(100dvw - 50px)' : '50dvw',
                    }}
                    active
                  />
                </div>
              </Col>
            </Row>
          )}
        </div>
      </Content>
      {isMobile && (
        <FooterWrapper>
          <MenuWrapper defaultSelectedKeys={['0']} isMobile={isMobile} />
        </FooterWrapper>
      )}
      {(unblockLoading || deleteLoading || activateLoading) && (
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
export default Details
