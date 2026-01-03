import { useEffect, useState, useContext, useRef } from 'react'
import { Context } from '../context/provider'
import { callApi } from '../helpers/api'
import { Modal } from 'antd'
import { useIndexedDBImages } from './indexedDB'
import { signInWithRedirect } from 'aws-amplify/auth'

const useLocationComponent = () => {
  const {
    setCurrentLocation,
    triggerLocation,
    setCurrentLocationLabel,
    setLocationAccessLoading,
    currentLocationLabel,
    currLocRemoved,
  } = useContext(Context)
  const isModalVisibleRef = useRef(false)
  const [error, setError] = useState(null)
  const { clearAllIds } = useIndexedDBImages()

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

  useEffect(() => {
    if (!navigator.geolocation || currLocRemoved || currentLocationLabel) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setLocationAccessLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setCurrentLocation(
          `${position.coords.latitude},${position.coords.longitude}`
        )
        try {
          const data = await callApi(
            `https://api.reusifi.com/prod/getLocation?longlat=${encodeURIComponent(
              `${position.coords.longitude},${position.coords.latitude}`
            )}`,
            'GET'
          )
          setCurrentLocationLabel(
            data.data.Address.Street ||
              data.data.Address.District ||
              data.data.Address.Locality ||
              data.data.Address.Label
          )
          setLocationAccessLoading(false)
        } catch (err) {
          setLocationAccessLoading(false)
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
      },
      (err) => {
        setError(err.message)
        setLocationAccessLoading(false)
      },
      { enableHighAccuracy: false, maximumAge: 3600000, timeout: 5000 }
    )
  }, [triggerLocation, currentLocationLabel, currLocRemoved])
}

export default useLocationComponent
