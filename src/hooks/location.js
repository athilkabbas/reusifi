import { useEffect, useState, useContext } from 'react'
import { Context } from '../context/provider'
import { callApi } from '../helpers/api'

const useLocationComponent = () => {
  const {
    setCurrentLocation,
    triggerLocation,
    setCurrentLocationLabel,
    setLocationAccessLoading,
    currentLocationLabel,
    currLocRemoved,
  } = useContext(Context)
  const [error, setError] = useState(null)

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
          setCurrentLocationLabel(data.data.Address.Label)
          setLocationAccessLoading(false)
        } catch (err) {
          setLocationAccessLoading(false)
          // message.info("Pincode not found");
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
