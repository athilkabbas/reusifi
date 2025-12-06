import React, { useContext, useEffect, useRef, useState } from 'react'
import styles from './AddDress.module.css'
import { Col, Popover, Select, Skeleton, Space, Spin } from 'antd'
import { Input, notification } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Layout, Modal } from 'antd'
import { InfoCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { LocateFixed } from 'lucide-react'
import { Image, Upload, message } from 'antd'
import { Button, Row } from 'antd'
import axios from 'axios'
import { signInWithRedirect } from '@aws-amplify/auth'
import imageCompression from 'browser-image-compression'
import { LoadingOutlined } from '@ant-design/icons'
import { Context } from '../context/provider'
import { useIsMobile } from '../hooks/windowSize'
import { callApi } from '../helpers/api'
import MenuWrapper from '../component/Menu'
import FooterWrapper from '../component/Footer'
import HeaderWrapper from '../component/Header'
import { options } from '../helpers/categories'
import useLocationComponent from '../hooks/location'
import { useIndexedDBImages } from '../hooks/indexedDB'
const { TextArea } = Input
const { Content } = Layout
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })

const AddDress = () => {
  const {
    count,
    setCount,
    setAdInitialLoad,
    setAdData,
    setAdLastEvaluatedKey,
    addProductInitialLoad,
    setAddProductInitialLoad,
    setUnreadChatCount,
    user,
    locationAccessLoading,
    currentLocationLabel,
    setTriggerLocation,
    currentLocation,
    setCurrentLocationLabel,
    setCurrentLocation,
    setCurrLocRemoved,
    form,
    setForm,
  } = useContext(Context)

  const [api, contextHolder] = notification.useNotification()

  useLocationComponent()

  const [subCategoryOptions, setSubCategoryOptions] = useState([])

  useEffect(() => {
    if (form.category) {
      for (let option of options) {
        if (option.value === form.category) {
          setSubCategoryOptions(option.children)
          break
        }
      }
    } else {
      setSubCategoryOptions([])
      handleChange('', 'subCategory')
    }
  }, [form.category])

  const [isSubmitted, setIsSubmitted] = useState(false)
  const isMobile = useIsMobile()
  const { clearAllIds } = useIndexedDBImages()
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

  const locationInfoConfig = {
    title: 'Enable location access',
    content:
      'To enable location access, please click the location icon at the end of the browser’s address bar and allow location permission for this site.',
    closable: false,
    maskClosable: false,
    okText: 'Close',
    onOk: () => {},
  }

  useEffect(() => {
    if (addProductInitialLoad) {
      try {
        setChatLoading(true)
        setLoading(true)
        const getChatCount = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          'GET'
        )

        const getAdCount = callApi(
          `https://api.reusifi.com/prod/getProductsCount?count=${true}&email=${encodeURIComponent(
            user.userId
          )}`,
          'GET'
        )

        Promise.all([getChatCount, getAdCount])
          .then(([chatResult, adResult]) => {
            setUnreadChatCount(chatResult.data.count)
            setCount(adResult.data.count)
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
            setLoading(false)
            setAddProductInitialLoad(false)
          })
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
        return
      }
    }
  }, [addProductInitialLoad])
  const handleChange = (value, type) => {
    setForm((prevValue) => {
      return { ...prevValue, [type]: value }
    })
  }

  const navigate = useNavigate()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    setPreviewImage(file.url || file.preview)
    setPreviewOpen(true)
  }

  const handleBeforeUpload = async (file) => {
    if (form.keywords.length === 0) {
      message.info('Please select Subcategory')
      return Upload.LIST_IGNORE
    }
    const value = await getActualMimeType(file)
    if (!value) {
      openNotificationWithIcon(
        'error',
        `${file.name} is in an unsupported format.`,
        'Error'
      )
      return Upload.LIST_IGNORE
    } else if (file.size / 1024 / 1024 > 30) {
      openNotificationWithIcon('error', `${file.name} is over 30MB`, 'Error')
      return Upload.LIST_IGNORE
    }
    return false
  }

  const openNotificationWithIcon = (type, message, title) => {
    api[type]({
      message: title,
      description: `${message}`,
      duration: 0,
      style: {
        whiteSpace: 'pre-wrap',
      },
    })
  }

  const handleChangeImage = async ({ fileList }) => {
    setForm((prevValue) => {
      return { ...prevValue, images: [...fileList] }
    })
  }

  useEffect(() => {
    if (user) {
      setForm((prevValue) => {
        return { ...prevValue, email: user.userId }
      })
    }
  }, [user])

  useEffect(() => {
    if (currentLocation && currentLocationLabel) {
      setForm((prevValue) => {
        return {
          ...prevValue,
          location: currentLocation,
          locationLabel: currentLocationLabel,
        }
      })
    }
  }, [currentLocation, currentLocationLabel])

  const getActualMimeType = async (file) => {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer).subarray(0, 4)

    // JPEG magic bytes: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return true
    }

    // PNG magic bytes: 89 50 4E 47
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return true
    }

    return false
  }

  const isValid = () => {
    if (!form.images || form.images.length === 0) return false
    for (let key in form) {
      if (
        key !== 'images' &&
        typeof form[key] !== 'string' &&
        form[key] === null
      ) {
        return false
      } else if (typeof form[key] === 'string' && form[key].trim() === '') {
        return false
      }
    }
    return true
  }

  const uploadImages = async (fileList, imageType) => {
    const thumbnailOptions = {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 500,
      useWebWorker: true,
      initialQuality: 0.7,
      fileType: imageType,
    }

    const viewingOptions = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: imageType,
    }

    const compressedThumbnails = [
      await imageCompression(fileList[0].originFileObj, thumbnailOptions),
    ]
    const compressedViewings = await Promise.all(
      fileList.map((image) =>
        imageCompression(image.originFileObj, viewingOptions)
      )
    )

    const allCompressed = [...compressedThumbnails, ...compressedViewings]
    const urlRes = await callApi(
      `https://api.reusifi.com/prod/getUrlNew?email=${encodeURIComponent(
        user.userId
      )}&contentType=${encodeURIComponent(imageType)}&count=${
        allCompressed.length
      }`,
      'GET'
    )
    const uploadURLs = urlRes.data.uploadURLs
    const s3Keys = urlRes.data.s3Keys

    await Promise.all(
      allCompressed.map((img, idx) =>
        axios.put(uploadURLs[idx], img, {
          headers: {
            'Content-Type': imageType,
            'Cache-Control': 'public, max-age=2592000',
          },
        })
      )
    )
    const thumbnailS3Keys = [s3Keys[0]]
    const viewingS3Keys = s3Keys.slice(1)
    return {
      thumbnailS3Keys,
      viewingS3Keys,
    }
  }

  const [badLanguage, setBadLanguage] = useState({
    title: false,
    description: false,
  })

  const handleSubmit = async (submit, paid) => {
    try {
      const { thumbnailS3Keys, viewingS3Keys } = await uploadImages(
        form.images,
        'image/jpeg'
      )
      let files = form.images.map((file, index) => {
        const { preview, originFileObj, ...fileRest } = file
        return { ...fileRest, s3Key: viewingS3Keys[index] }
      })
      // Prepare form data with separate keys for thumbnails and viewings
      const data = {
        title: form.title.trim().toLowerCase(),
        description: form.description.trim().toLowerCase(),
        email: user.userId.toLowerCase(),
        location: form.location.split(',').map(parseFloat),
        locationLabel: form.locationLabel,
        price: parseFloat(form.price).toFixed(2),
        category: form.category.toLowerCase(),
        subCategory: form.subCategory.toLowerCase(),
        thumbnailS3Keys,
        viewingS3Keys,
        submit,
        files,
        keywords: form.keywords,
        paid,
      }
      await callApi(
        'https://api.reusifi.com/prod/addProduct',
        'POST',
        false,
        data
      )
      if (!submit) {
        setSubmitLoading(false)
        return true
      }
      setCount((prevValue) => prevValue + 1)
      setAdData([])
      setAdLastEvaluatedKey(null)
      setAdInitialLoad(true)
      setSubmitLoading(false)
      setCurrLocRemoved(true)
      setCurrentLocationLabel('')
      setCurrentLocation('')
      await clearAllIds()
      setForm({
        title: '',
        description: '',
        category: '',
        subCategory: '',
        keywords: [],
        email: '',
        images: [],
        price: null,
        location: '',
        locationLabel: '',
      })
      message.success('Your ad is now live on Reusifi.')
      navigate('/ads')
      return true
    } catch (err) {
      setSubmitLoading(false)
      if (isModalVisibleRef.current) {
        return
      }
      isModalVisibleRef.current = true
      if (err?.status === 401) {
        Modal.error(errorSessionConfig)
      } else if (err?.status === 422) {
        isModalVisibleRef.current = false
        openNotificationWithIcon('error', err.response.data.message, 'Error')
        if (err.response.data.invalidImage) {
          setForm((prevValue) => {
            return {
              ...prevValue,
              images: [
                ...prevValue.images.filter(
                  (image) => !err.response.data.invalidUids.includes(image.uid)
                ),
              ],
            }
          })
        }
        if (err.response.data.invalidText) {
          setBadLanguage((prevValue) => {
            return {
              ...prevValue,
              ...err?.response.data.badLanguage,
            }
          })
        }
      } else {
        Modal.error(errorConfig)
      }
      return false
    }
  }

  const [pincode, setPincode] = useState('')
  const [postCodeLoading, setPostCodeLoading] = useState(false)

  const fetchPincodeDetails = async () => {
    setPostCodeLoading(true)
    try {
      const data = await callApi(
        `https://api.reusifi.com/prod/getLocation?pincode=${encodeURIComponent(
          pincode
        )}`,
        'GET'
      )
      setPostCodeLoading(false)
      handleChange(data.data.Position.reverse().join(','), 'location')
      handleChange(
        data.data.Address.Street ||
          data.data.Address.District ||
          data.data.Address.Locality ||
          data.data.Address.Label,
        'locationLabel'
      )
      setCurrLocRemoved(true)
      setCurrentLocationLabel('')
      setCurrentLocation('')
    } catch (err) {
      message.info('Pincode not found')
    }
  }
  const handlePincode = (e) => {
    const value = e.target.value
    setPincode(value)
    if (!value) {
      handleChange('', 'location')
      handleChange('', 'locationLabel')
    }
  }
  const bottomRef = useRef(null)
  const bottomRefPincode = useRef(null)

  const bottomRefPrice = useRef(null)

  const containerRef = useRef(null)

  const scrollToBottomPincode = () => {
    requestAnimationFrame(() => {
      if (bottomRefPincode?.current) {
        bottomRefPincode.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      }
    })
  }

  const scrollToBottomPrice = () => {
    requestAnimationFrame(() => {
      if (bottomRefPrice?.current) {
        bottomRefPrice.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      }
    })
  }

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (bottomRef?.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    })
  }

  useEffect(() => {
    let prevHeight = window.innerHeight
    const handleResize = () => {
      const currentHeight = window.innerHeight
      if (
        currentHeight < prevHeight &&
        document.activeElement.id === 'sellPriceId'
      ) {
        scrollToBottom()
      } else if (
        currentHeight < prevHeight &&
        document.activeElement.id === 'pincodeId'
      ) {
        scrollToBottomPrice()
      } else if (
        currentHeight < prevHeight &&
        document.activeElement.id === 'descId'
      ) {
        scrollToBottomPincode()
      }
      prevHeight = currentHeight
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [popOpen, setPopOpen] = useState(false)

  const handleOpenChange = (newOpen) => {
    setPopOpen(newOpen)
  }

  return (
    <Layout
      style={{
        height: '100dvh',
        overflowY: 'scroll',
        overflowX: 'hidden',
        background: '#F9FAFB',
        scrollbarWidth: 'none',
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
          <MenuWrapper defaultSelectedKeys={['3']} isMobile={isMobile} />
        </HeaderWrapper>
      )}
      <Content
        style={{
          padding: '15px 15px 70px 15px',
        }}
      >
        {contextHolder}
        {!loading && !chatLoading && user && (
          <>
            <Space
              size="large"
              direction="vertical"
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Space.Compact size="large">
                <Input
                  className={
                    isSubmitted && (!form.title.trim() || badLanguage.title)
                      ? 'my-red-border'
                      : ''
                  }
                  allowClear
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                    marginTop: '30px',
                  }}
                  onChange={(e) => {
                    const text = e.target.value
                    const sanitized = text.replace(/[^a-zA-Z0-9 ]/g, '')
                    handleChange(sanitized, 'title')
                  }}
                  placeholder="Title"
                  value={form.title}
                  maxLength={100}
                />
              </Space.Compact>
              <Space.Compact size="large">
                <div style={{ position: 'relative' }}>
                  <TextArea
                    className={
                      isSubmitted &&
                      (!form.description.trim() || badLanguage.description)
                        ? 'my-red-border'
                        : ''
                    }
                    id={'descId'}
                    allowClear
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                    }}
                    onChange={(e) => {
                      const text = e.target.value
                      const sanitized = text.replace(/[^a-zA-Z0-9 ]/g, '')
                      handleChange(sanitized, 'description')
                    }}
                    autoSize={{ minRows: 8, maxRows: 8 }}
                    placeholder="Description"
                    maxLength={300}
                    value={form.description}
                    onClick={() => {
                      scrollToBottomPincode()
                    }}
                  />
                  <Popover
                    content={
                      'Please provide all the details about your item (e.g., for a phone: color, memory, condition) to help buyers make informed decisions.'
                    }
                    title=""
                    trigger="click"
                    open={popOpen}
                    placement="topLeft"
                    styles={{ root: { width: '250px' } }}
                    onOpenChange={handleOpenChange}
                  >
                    <InfoCircleOutlined
                      style={{
                        position: 'absolute',
                        right: '10px',
                        bottom: '10px',
                        zIndex: 10,
                        color: '#52c41a',
                      }}
                    />
                  </Popover>
                </div>
              </Space.Compact>
              <Space.Compact
                size="large"
                style={{
                  position: 'relative',
                }}
              >
                <Space
                  size="large"
                  direction="vertical"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Space.Compact
                    size="large"
                    style={{
                      position: 'relative',
                    }}
                  >
                    <Select
                      className={
                        isSubmitted
                          ? form.category
                            ? 'my-custom-select'
                            : 'my-custom-select my-red-border'
                          : 'my-custom-select'
                      }
                      allowClear
                      id={'addProductCId'}
                      style={{
                        width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                      }}
                      value={form.category || undefined}
                      onChange={(value) => {
                        if (!value) {
                          handleChange('', 'category')
                        } else {
                          handleChange(value, 'category')
                        }
                      }}
                      placeholder="Category"
                      filterOption={false}
                      options={options}
                    ></Select>
                  </Space.Compact>
                  <Space.Compact
                    size="large"
                    style={{
                      position: 'relative',
                    }}
                  >
                    <Select
                      className={
                        isSubmitted
                          ? form.subCategory
                            ? 'my-custom-select'
                            : 'my-custom-select my-red-border'
                          : 'my-custom-select'
                      }
                      allowClear
                      value={form.subCategory || undefined}
                      id={'addProductSCId'}
                      style={{
                        width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                      }}
                      onChange={(value, option) => {
                        if (!value) {
                          handleChange('', 'subCategory')
                          handleChange([], 'keywords')
                        } else {
                          handleChange(value, 'subCategory')
                          handleChange(option.keywords, 'keywords')
                        }
                      }}
                      placeholder="Subcategory"
                      filterOption={false}
                      options={subCategoryOptions}
                    ></Select>
                  </Space.Compact>
                </Space>
              </Space.Compact>
              <Space.Compact
                size="large"
                style={{
                  // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                }}
              >
                <Input
                  className={
                    isSubmitted
                      ? form.locationLabel
                        ? ''
                        : 'my-red-border'
                      : ''
                  }
                  id={'pincodeId'}
                  value={pincode}
                  onChange={handlePincode}
                  placeholder="Pincode"
                  // allowClear
                  onClick={() => {
                    scrollToBottomPrice()
                  }}
                ></Input>
                <Button
                  loading={postCodeLoading}
                  disabled={!pincode}
                  type="primary"
                  style={{
                    background: '#52c41a',
                    fontSize: '13px',
                    fontWeight: '300',
                  }}
                  onClick={fetchPincodeDetails}
                >
                  Check Pincode
                </Button>
              </Space.Compact>
              &nbsp;&nbsp;or
              <div
                ref={bottomRefPincode}
                style={{ display: 'block', height: 0 }}
              ></div>
              <Space.Compact size="large">
                <Button
                  className={
                    isSubmitted
                      ? form.locationLabel
                        ? ''
                        : 'my-red-border'
                      : ''
                  }
                  disabled={currentLocationLabel}
                  loading={locationAccessLoading}
                  style={{
                    fontSize: '13px',
                    fontWeight: '300',
                    color: '#52c41a',
                    width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                  }}
                  onClick={() => {
                    navigator.permissions
                      .query({ name: 'geolocation' })
                      .then(function (result) {
                        if (result.state === 'denied') {
                          Modal.info(locationInfoConfig)
                        }
                      })
                    setPincode('')
                    setCurrLocRemoved(false)
                    setTriggerLocation((value) => !value)
                  }}
                >
                  <LocateFixed />
                  Use your current location
                </Button>
              </Space.Compact>
              {form.locationLabel && (
                <Space.Compact size="large">
                  <Input
                    onChange={(e) => {
                      setForm((prevValue) => {
                        return {
                          ...prevValue,
                          location: '',
                          locationLabel: '',
                        }
                      })
                      setCurrentLocationLabel('')
                      setCurrentLocation('')
                      setCurrLocRemoved(true)
                      handlePincode(e)
                    }}
                    allowClear
                    style={{
                      width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                    }}
                    value={form.locationLabel}
                  />
                </Space.Compact>
              )}
              <Space.Compact size="large">
                <Input
                  className={
                    isSubmitted ? (form.price ? '' : 'my-red-border') : ''
                  }
                  id="sellPriceId"
                  allowClear
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                  }}
                  prefix="£"
                  onChange={(e) => {
                    const text = e.target.value
                    const sanitized = text.replace(/[^0-9]/g, '')
                    handleChange(sanitized, 'price')
                  }}
                  placeholder="Price"
                  value={form.price}
                  maxLength={15}
                  onClick={() => {
                    scrollToBottom()
                  }}
                />
              </Space.Compact>
              <div
                ref={bottomRefPrice}
                style={{ display: 'block', height: 0 }}
              ></div>
              <Space.Compact size="large">
                <Space size="large" direction="vertical" className="ad-upload">
                  <Upload
                    accept="image/png,image/jpeg"
                    listType="picture"
                    fileList={form.images}
                    onPreview={handlePreview}
                    beforeUpload={handleBeforeUpload}
                    onChange={handleChangeImage}
                    maxCount={6}
                    multiple
                  >
                    <Button
                      className={
                        isSubmitted
                          ? form.images.length > 0
                            ? ''
                            : 'my-red-border'
                          : ''
                      }
                      style={{
                        color: 'black',
                        fontSize: '13px',
                        fontWeight: '300',
                        width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                      }}
                      icon={<UploadOutlined />}
                    >
                      Upload (Max: 6)
                    </Button>
                  </Upload>
                  {previewImage && (
                    <Image
                      loading="lazy"
                      wrapperStyle={{
                        display: 'none',
                      }}
                      style={{ objectFit: 'cover' }}
                      preview={{
                        visible: previewOpen,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        afterOpenChange: (visible) =>
                          !visible && setPreviewImage(''),
                      }}
                      src={previewImage}
                    />
                  )}
                </Space>
              </Space.Compact>
              <Space.Compact size="large">
                <span style={{ fontSize: '13px', fontWeight: '300' }}>
                  The ad will be deactivated automatically after 30 days
                </span>
              </Space.Compact>
              <Space.Compact
                size="large"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Button
                  style={{
                    background: '#52c41a',
                    fontSize: '13px',
                    fontWeight: '300',
                  }}
                  onClick={async () => {
                    setIsSubmitted(true)
                    if (!isValid()) {
                      message.info('All fields are mandatory')
                      return
                    }
                    setSubmitLoading(true)
                    if (count < 3) {
                      await handleSubmit(true, false)
                    } else {
                      const isValid = await handleSubmit(false, true)
                      if (isValid) {
                        navigate('/checkout', { state: { adType: 'POSTAD' } })
                      }
                    }
                  }}
                  type="primary"
                >
                  Submit
                </Button>
              </Space.Compact>
              <br />
              <div
                ref={bottomRef}
                style={{ display: 'block', height: 0 }}
              ></div>
            </Space>
          </>
        )}
        {(loading || chatLoading) && (
          <Row gutter={[30, 30]}>
            {Array.from({ length: 9 }).map((_, index) => {
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
                  {index !== 8 && (
                    <Skeleton.Node
                      style={{
                        width: !isMobile ? '50dvw' : 'calc(100dvw - 30px)',
                        height: index !== 2 ? '40px' : '214px',
                        borderRadius: '8px',
                      }}
                      active
                    />
                  )}
                  {index === 8 && (
                    <Skeleton.Node
                      style={{
                        width: '75px',
                        height: '40px',
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
      </Content>
      {isMobile && (
        <FooterWrapper>
          <MenuWrapper defaultSelectedKeys={['3']} isMobile={isMobile} />
        </FooterWrapper>
      )}
      {submitLoading && (
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
export default AddDress
