import React, { useState, useEffect, useContext, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { callApi } from '../helpers/api'
import { Button, Result, Modal, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import { Context } from '../context/provider'
import { signInWithRedirect } from '@aws-amplify/auth'
import axios from 'axios'
import { LoadingOutlined } from '@ant-design/icons'
import { useIndexedDBImages } from '../hooks/indexedDB'

const Return = () => {
  const { clearAllIds } = useIndexedDBImages()
  const [status, setStatus] = useState(null)
  const [customerEmail, setCustomerEmail] = useState('')
  const navigate = useNavigate()
  const [submitLoading, setSubmitLoading] = useState(false)

  const isModalVisibleRef = useRef(false)
  const errorSessionConfig = {
    title: 'Session has expired.',
    content:
      'Ad submission failed. Your payment has been refunded. Please try again shortly.',
    closable: false,
    maskClosable: false,
    okText: 'Login',
    onOk: async () => {
      isModalVisibleRef.current = false
      await clearAllIds()
      signInWithRedirect()
    },
  }
  const errorSessionConfigRefundFailure = {
    title: 'Session has expired.',
    content: 'Please raise a query',
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
    content:
      'Ad submission failed. Your payment has been refunded. Please try again shortly.',
    closable: false,
    maskClosable: false,
    okText: 'OK',
    onOk: () => {
      isModalVisibleRef.current = false
      navigate('/addProduct')
    },
  }

  const errorConfigBoost = {
    title: 'An error has occurred.',
    content:
      'Ad boost failed. Your payment has been refunded. Please try again shortly.',
    closable: false,
    maskClosable: false,
    okText: 'OK',
    onOk: () => {
      isModalVisibleRef.current = false
      navigate('/ads')
    },
  }

  const errorConfigActive = {
    title: 'An error has occurred.',
    content:
      'Ad activation failed. Your payment has been refunded. Please try again shortly.',
    closable: false,
    maskClosable: false,
    okText: 'OK',
    onOk: () => {
      isModalVisibleRef.current = false
      navigate('/ads')
    },
  }

  const errorConfigRefundFailure = {
    title: 'An error has occurred.',
    content: 'Please raise a query',
    closable: false,
    maskClosable: false,
    okText: 'OK',
    onOk: () => {
      isModalVisibleRef.current = false
      navigate('/')
    },
  }

  const errorActivateORBoost = {
    title: 'An error has occurred.',
    content: 'Your payment has been refunded.',
    closable: false,
    maskClosable: false,
    okText: 'OK',
    onOk: () => {
      isModalVisibleRef.current = false
      navigate('/ads')
    },
  }

  const errorAdSubmit = {
    title: 'An error has occurred.',
    content: 'Your payment has been refunded.',
    closable: false,
    maskClosable: false,
    okText: 'OK',
    onOk: () => {
      isModalVisibleRef.current = false
      navigate('/addProduct')
    },
  }

  const {
    setCount,
    setAdInitialLoad,
    setAdData,
    setAdLastEvaluatedKey,
    user,
    setCurrentLocationLabel,
    setCurrentLocation,
    setCurrLocRemoved,
    form,
    boostForm,
    setForm,
  } = useContext(Context)

  const [submit, setSubmit] = useState(false)
  const [sessionId, setSessionId] = useState('')

  const [adType, setAdType] = useState('')

  useEffect(() => {
    if (status === 'complete' && adType === 'POSTAD') {
      handleSubmit(true, true)
    } else if (
      status === 'complete' &&
      (adType === 'BOOSTAD3' || adType === 'BOOSTAD7')
    ) {
      handleBoost(adType)
    } else if (status === 'complete' && adType === 'ACTIVATE') {
      handleActivate()
    }
  }, [status])

  const handleActivate = async () => {
    try {
      setSubmitLoading(true)
      await callApi('https://api.reusifi.com/prod/activateAd', 'POST', false, {
        uuid: boostForm.uuid,
      })
      setAdData([])
      setAdLastEvaluatedKey(null)
      setAdInitialLoad(true)
      setSubmit(true)
      setSubmitLoading(false)
    } catch (err) {
      setSubmitLoading(false)
      try {
        await callApi('https://api.reusifi.com/prod/refund', 'POST', false, {
          session_id: sessionId,
        })
        if (isModalVisibleRef.current) {
          return
        }
        isModalVisibleRef.current = true
        if (err?.status === 401) {
          Modal.error(errorSessionConfig)
        } else if (err?.status === 422) {
          Modal.error({
            ...errorActivateORBoost,
            content: err.response.data.message + errorActivateORBoost.content,
          })
        } else {
          Modal.error(errorConfigActive)
        }
      } catch (err) {
        if (isModalVisibleRef.current) {
          return
        }
        isModalVisibleRef.current = true
        if (err?.status === 401) {
          Modal.error(errorSessionConfigRefundFailure)
        } else {
          Modal.error(errorConfigRefundFailure)
        }
      }
      return
    }
  }

  const handleBoost = async (adType) => {
    try {
      setSubmitLoading(true)
      await callApi('https://api.reusifi.com/prod/boostAd', 'POST', false, {
        adType,
        boostForm,
      })
      setAdData([])
      setAdLastEvaluatedKey(null)
      setAdInitialLoad(true)
      setSubmit(true)
      setSubmitLoading(false)
    } catch (err) {
      setSubmitLoading(false)
      try {
        await callApi('https://api.reusifi.com/prod/refund', 'POST', false, {
          session_id: sessionId,
        })
        if (isModalVisibleRef.current) {
          return
        }
        isModalVisibleRef.current = true
        if (err?.status === 401) {
          Modal.error(errorSessionConfig)
        } else if (err?.status === 422) {
          Modal.error({
            ...errorActivateORBoost,
            content: err.response.data.message + errorActivateORBoost.content,
          })
        } else {
          Modal.error(errorConfigBoost)
        }
      } catch (err) {
        if (isModalVisibleRef.current) {
          return
        }
        isModalVisibleRef.current = true
        if (err?.status === 401) {
          Modal.error(errorSessionConfigRefundFailure)
        } else {
          Modal.error(errorConfigRefundFailure)
        }
      }
      return
    }
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

  const handleSubmit = async (submit, paid) => {
    try {
      setSubmitLoading(true)
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
        sessionId,
        files,
        keywords: form.keywords,
        submit,
        paid,
      }
      await callApi(
        'https://api.reusifi.com/prod/addProduct',
        'POST',
        false,
        data
      )
      setCount((prevValue) => prevValue + 1)
      setAdData([])
      setAdLastEvaluatedKey(null)
      setAdInitialLoad(true)
      setCurrLocRemoved(true)
      setCurrentLocationLabel('')
      setCurrentLocation('')
      setSubmit(true)
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
      setSubmitLoading(false)
    } catch (err) {
      setSubmitLoading(false)
      try {
        await callApi('https://api.reusifi.com/prod/refund', 'POST', false, {
          session_id: sessionId,
        })
        if (isModalVisibleRef.current) {
          return
        }
        isModalVisibleRef.current = true
        if (err?.status === 401) {
          Modal.error(errorSessionConfig)
        } else if (err?.status === 422) {
          Modal.error({
            ...errorAdSubmit,
            content: err.response.data.message + errorAdSubmit.content,
          })
        } else {
          Modal.error(errorConfig)
        }
      } catch (err) {
        if (isModalVisibleRef.current) {
          return
        }
        isModalVisibleRef.current = true
        if (err?.status === 401) {
          Modal.error(errorSessionConfigRefundFailure)
        } else {
          Modal.error(errorConfigRefundFailure)
        }
      }
      return
    }
  }

  useEffect(() => {
    const fetchStatus = async () => {
      const queryString = window.location.search
      const urlParams = new URLSearchParams(queryString)
      const sessionId = urlParams.get('session_id')
      const adType = urlParams.get('adType')
      const result = await callApi(
        `https://api.reusifi.com/prod/checkoutSessionStatus?session_id=${sessionId}`,
        'GET'
      )
      setSessionId(sessionId)
      setAdType(adType)
      setStatus(result.data.status)
      setCustomerEmail(result.data.customer_email)
    }
    fetchStatus()
  }, [])

  if (status === 'open') {
    return <Navigate to="/checkout" />
  }

  if (status === 'complete' && submit && adType === 'POSTAD') {
    return (
      <Result
        status="success"
        title="Successfully posted an Ad"
        subTitle="Your ad is now live on Reusifi."
        extra={[
          <Button
            style={{
              background: '#52c41a',
              fontSize: '13px',
              fontWeight: '300',
            }}
            onClick={() => {
              navigate('/ads')
            }}
            type="primary"
            key="console"
          >
            Go to My Ads
          </Button>,
        ]}
      />
    )
  }
  if (status === 'complete' && submit && adType === 'BOOSTAD3') {
    return (
      <Result
        status="success"
        title="Successfully boosted Ad"
        subTitle="Your ad has been successfully boosted for 3 days."
        extra={[
          <Button
            style={{
              background: '#52c41a',
              fontSize: '13px',
              fontWeight: '300',
            }}
            onClick={() => {
              navigate('/ads')
            }}
            type="primary"
            key="console"
          >
            Go to My Ads
          </Button>,
        ]}
      />
    )
  }
  if (status === 'complete' && submit && adType === 'BOOSTAD7') {
    return (
      <Result
        status="success"
        title="Successfully boosted Ad"
        subTitle="Your ad has been successfully boosted for 7 days."
        extra={[
          <Button
            style={{
              background: '#52c41a',
              fontSize: '13px',
              fontWeight: '300',
            }}
            onClick={() => {
              navigate('/ads')
            }}
            type="primary"
            key="console"
          >
            Go to My Ads
          </Button>,
        ]}
      />
    )
  }

  if (status === 'complete' && submit && adType === 'ACTIVATE') {
    return (
      <Result
        status="success"
        title="Successfully posted an Ad"
        subTitle="Your ad is now live on Reusifi."
        extra={[
          <Button
            style={{
              background: '#52c41a',
              fontSize: '13px',
              fontWeight: '300',
            }}
            onClick={() => {
              navigate('/ads')
            }}
            type="primary"
            key="console"
          >
            Go to My Ads
          </Button>,
        ]}
      />
    )
  }
  return (
    <Spin
      fullscreen
      indicator={
        <LoadingOutlined style={{ fontSize: 48, color: '#52c41a' }} spin />
      }
    />
  )
}

export default Return
