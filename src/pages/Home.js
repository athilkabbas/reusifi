import React, { useEffect, useState, useRef, useContext } from 'react'
import styles from './Home.module.css'
import { useNavigate } from 'react-router-dom'
import {
  Layout,
  Spin,
  Modal,
  Dropdown,
  Drawer,
  Divider,
  Button,
  Row,
  Col,
  Select,
  Popover,
  Image,
} from 'antd'
import { EllipsisVertical, Settings2, Search } from 'lucide-react'
import {
  LogoutOutlined,
  HeartFilled,
  LoadingOutlined,
  MailOutlined,
  CloseCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { LocateFixed } from 'lucide-react'
import { Input, Space, Empty } from 'antd'
import InfiniteScroll from 'react-infinite-scroll-component'
import { List, Skeleton, Radio } from 'antd'
import { Card, Grid } from 'antd'
import { signInWithRedirect, signOut } from '@aws-amplify/auth'
import { Context } from '../context/provider'
import { useIsMobile } from '../hooks/windowSize'
import { callApi } from '../helpers/api'
import { options } from '../helpers/categories'
import MenuWrapper from '../component/Menu'
import FooterWrapper from '../component/Footer'
import HeaderWrapper from '../component/Header'
import useLocationComponent from '../hooks/location'
import { useIndexedDBImages } from '../hooks/indexedDB'
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
const { Content } = Layout

const { useBreakpoint } = Grid
const Home = () => {
  useLocationComponent()
  const { clearAllIds } = useIndexedDBImages()
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const scrollableDivRef = useRef(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const screens = useBreakpoint()
  const {
    data,
    setData,
    search,
    setSearch,
    location,
    setLocation,
    priceFilter,
    setPriceFilter,
    scrollPosition,
    setScrollPosition,
    initialLoad,
    setInitialLoad,
    currentPage,
    setCurrentPage,
    hasMore,
    setHasMore,
    filterList,
    setFilterList,
    setFavData,
    setUnreadChatCount,
    user,
    currentLocation,
    setCurrentLocation,
    setTriggerLocation,
    currentLocationLabel,
    locationAccessLoading,
    setCurrentLocationLabel,
    setMaxPrice,
    setMinPrice,
    maxPrice,
    minPrice,
    setLocationLabel,
    locationLabel,
    category,
    setCategory,
    subCategory,
    setSubCategory,
    setApplied,
    applied,
    currLocRemoved,
    setCurrLocRemoved,
  } = useContext(Context)
  const [handleFavLoading, setHandleFavLoading] = useState(false)

  const isMobile = useIsMobile()

  const [subCategoryOptions, setSubCategoryOptions] = useState([])

  useEffect(() => {
    if (category) {
      for (let option of options) {
        if (option.value === category) {
          setSubCategoryOptions(option.children)
          break
        }
      }
    } else {
      setSubCategoryOptions([])
      setSubCategory('')
    }
  }, [category])

  const calculateLimit = () => {
    const viewportHeight = window.innerHeight
    const itemHeight = 300 // adjust if needed
    const rowsVisible = Math.ceil(viewportHeight / itemHeight)
    const columns = getColumnCount() // depending on screen size (see below)
    return rowsVisible * columns * 8
  }

  const getColumnCount = () => {
    const width = window.innerWidth
    if (width < 576) return 2 // xs
    if (width < 768) return 3 // sm
    if (width < 992) return 3 // md
    if (width < 1200) return 4 // lg
    if (width < 1600) return 4 // xl
    return 6 // xxl
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
  const locationInfoConfig = {
    title: 'Enable location access',
    content:
      'To enable location access, please allow location permission for this site in the browser’s address bar',
    closable: false,
    maskClosable: false,
    okText: 'Close',
    onOk: () => {},
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
  const [limit, setLimit] = useState(0) // default

  const [radiusValue, setRadiusValue] = useState(
    currentLocationLabel || locationLabel ? 50 : ''
  )

  useEffect(() => {
    if (currentLocationLabel || locationLabel) {
      setRadiusValue(50)
    } else {
      setRadiusValue('')
    }
  }, [currentLocationLabel, locationLabel])

  const bottomRef = useRef(null)

  const bottomRefPrice = useRef(null)

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
    let prevWidth = window.innerWidth
    let prevHeight = window.innerHeight
    const updateLimit = () => {
      const newLimit = calculateLimit()
      setLimit(newLimit)
    }
    updateLimit() // on mount
    const handleResize = () => {
      const currentWidth = window.innerWidth
      const currentHeight = window.innerHeight
      if (hasMore && currentWidth > prevWidth) {
        setData([])
        setCurrentPage(1)
        setInitialLoad(true)
        updateLimit()
      }
      prevWidth = currentWidth
      if (
        currentHeight < prevHeight &&
        (document.activeElement.id === 'homeMinId' ||
          document.activeElement.id === 'homeMaxId')
      ) {
        scrollToBottom()
      } else if (
        currentHeight < prevHeight &&
        document.activeElement.id === 'locationId'
      ) {
        scrollToBottomPrice()
      }
      prevHeight = currentHeight
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [hasMore])

  useEffect(() => {
    if (
      scrollableDivRef.current &&
      !chatLoading &&
      !favLoading &&
      !handleFavLoading &&
      !loading
    ) {
      requestAnimationFrame(() => {
        if (scrollableDivRef.current) {
          scrollableDivRef.current.scrollTo(0, scrollPosition)
        }
      })
    }
  }, [scrollPosition, chatLoading, favLoading, handleFavLoading, loading, data])

  const handleMenuClick = async ({ key }) => {
    if (key === '1') {
      navigate('/account')
    } else if (key === '2') {
      navigate('/query')
    } else if (key === '3') {
      await clearAllIds()
      signOut()
    }
  }

  const windowHeight = window.innerHeight

  const handleFav = async (selectedItem, favourite) => {
    try {
      setScrollPosition(scrollableDivRef.current.scrollTop)
      // setFavInitialLoad(true);
      setHandleFavLoading(true)
      if (favourite) {
        await callApi(
          'https://api.reusifi.com/prod/getFavouritesAdd',
          'POST',
          false,
          {
            id: selectedItem['item']['uuid'],
            favourite,
            email: user.userId,
          }
        )
      } else {
        await callApi(
          'https://api.reusifi.com/prod/getFavouritesRemove',
          'POST',
          false,
          {
            id: selectedItem['item']['uuid'],
            favourite,
            email: user.userId,
          }
        )
      }
      if (!favourite) {
        setFilterList((prevValue) => {
          return prevValue.filter((item) => {
            return item !== selectedItem['item']['uuid']
          })
        })
        setFavData((prevValue) => {
          return prevValue.filter((item) => {
            return item['item']['uuid'] !== selectedItem['item']['uuid']
          })
        })
      } else {
        setFilterList([...filterList, selectedItem['item']['uuid']])
        setFavData((prevValue) => [selectedItem, ...prevValue])
      }
      setHandleFavLoading(false)
    } catch (err) {
      setHandleFavLoading(false)
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

  const encodeCursor = (obj) => {
    const jsonStr = JSON.stringify(obj)
    return btoa(unescape(encodeURIComponent(jsonStr))) // handles UTF-8 safely
  }

  function isLeafNode(value, treeData) {
    function findNode(nodes) {
      for (const node of nodes) {
        if (node.value === value) return node
        if (node.children) {
          const found = findNode(node.children)
          if (found) return found
        }
      }
      return null
    }

    const node = findNode(treeData)
    return node ? !node.children || node.isLeaf === true : false
  }

  const loadMoreData = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop
      setLoading(true)
      let results
      if (search.trim() || applied || currentLocation) {
        results = await callApi(
          'https://api.reusifi.com/prod/getProductsSearch',
          'POST',
          false,
          {
            search: search.trim(),
            page: currentPage,
            perPage: limit,
            location,
            currentLocation,
            minPrice,
            maxPrice,
            sortByPrice: priceFilter,
            category,
            subCategory,
            radius: radiusValue,
            userId: user.userId,
          }
        )
      } else {
        results = await callApi(
          `https://api.reusifi.com/prod/getProducts?&page=${encodeURIComponent(
            currentPage
          )}&perPage=${encodeURIComponent(limit)}&userId=${user.userId}`,
          'GET'
        )
      }
      setCurrentPage((currentPage) => currentPage + 1)
      setHasMore(results.data.pagination.hasMore)
      setData([...data, ...results.data.items])
      setFilterList([...filterList, ...results.data.favList])
      setLoading(false)
      setScrollPosition(scrollPosition)
      setInitialLoad(false)
      setApplied(true)
    } catch (err) {
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

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    if (
      !locationAccessLoading &&
      limit &&
      initialLoad &&
      (search.trim() || applied || currentLocation)
    ) {
      setLoading(true)
      timer.current = setTimeout(() => {
        loadMoreData()
      }, 300)
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [
    search,
    limit,
    applied,
    currentLocation,
    radiusValue,
    locationAccessLoading,
  ])

  useEffect(() => {
    if (
      initialLoad &&
      limit &&
      !search.trim() &&
      !applied &&
      !currentLocation &&
      !locationAccessLoading
    ) {
      try {
        setChatLoading(true)
        setFavLoading(true)
        setLoading(true)
        const getChatCount = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          'GET'
        )
        const loadMoreDataPromise = loadMoreData()

        Promise.all([getChatCount, loadMoreDataPromise])
          .then(([chatResult]) => {
            setUnreadChatCount(chatResult.data.count)
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
            setFavLoading(false)
            setLoading(false)
          })
      } catch (err) {
        setChatLoading(false)
        setFavLoading(false)
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
  }, [
    initialLoad,
    limit,
    search,
    applied,
    currentLocation,
    locationAccessLoading,
  ])
  const subMenuItems = [
    {
      key: '1',
      label: (
        <span style={{ fontSize: '13px', fontWeight: '300' }}>My Account</span>
      ),
      icon: (
        <UserOutlined
          style={{
            color: '#389e0d',
            fontSize: isMobile ? '10px' : '15px',
            fontWeight: '300',
          }}
        />
      ),
    },
    {
      key: '2',
      label: (
        <span style={{ fontSize: '13px', fontWeight: '300' }}>Contact</span>
      ),
      icon: (
        <MailOutlined
          style={{
            color: '#389e0d',
            fontSize: isMobile ? '10px' : '15px',
          }}
        />
      ),
    },
    {
      key: '3',
      label: (
        <span style={{ fontSize: '13px', fontWeight: '300' }}>Sign Out</span>
      ),
      icon: (
        <LogoutOutlined
          style={{
            color: '#389e0d',
            fontSize: isMobile ? '10px' : '15px',
            fontWeight: '300',
          }}
        />
      ),
    },
  ]
  const navigate = useNavigate()
  const onChangePriceFilter = (event) => {
    setPriceFilter(event.target.value)
    setApplied(false)
  }
  const [drawerOpen, setDrawerOpen] = useState(false)
  const showDrawer = () => {
    setDrawerOpen(true)
  }
  const onClose = () => {
    setDrawerOpen(false)
  }
  const locationTimer = useRef(null)

  const handleLocationSelect = async (value, options) => {
    try {
      const data = await callApi(
        `https://api.reusifi.com/prod/getLocationAutocomplete?placeId=${encodeURIComponent(
          options.placeId
        )}`,
        'GET'
      )
      setLocation(data.data.reverse().join(','))
      setLocationLabel(value)
      setCurrentLocation('')
      setCurrentLocationLabel('')
      setCurrLocRemoved(true)
    } catch (err) {
      // message.info("Pincode not found");
    }
  }
  const [locationLabels, setLocationLabels] = useState([])
  const radius = [
    { label: '0.5 km', value: 0.5 },
    { label: '1 km', value: 1 },
    { label: '2 km', value: 2 },
    { label: '3 km', value: 3 },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '15 km', value: 15 },
    { label: '20 km', value: 20 },
    { label: '25 km', value: 25 },
    { label: '50 km', value: 50 },
    { label: '100 km', value: 100 },
    { label: '250 km', value: 250 },
    { label: '500 km', value: 500 },
    { label: 'ALL', value: '' },
  ]
  const [locationLoading, setLocationLoading] = useState(false)

  const handleLocation = (value) => {
    setLocationLoading(true)
    if (locationTimer.current) {
      clearTimeout(locationTimer.current)
    }
    if (!value) {
      requestAnimationFrame(() => {
        setLocationLabels([])
        setLocationLoading(false)
      })
      return
    }
    locationTimer.current = setTimeout(async () => {
      try {
        const data = await callApi(
          `https://api.reusifi.com/prod/getLocationAutocomplete?location=${encodeURIComponent(
            value
          )}`,
          'GET'
        )
        setLocationLabels(data.data)
        setLocationLoading(false)
      } catch (err) {
        setLocationLoading(false)
      }
    }, 300)
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
        <HeaderWrapper>
          <MenuWrapper
            setScrollPosition={setScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={['1']}
            isMobile={isMobile}
          />
        </HeaderWrapper>
      )}
      <Drawer
        title="Filters"
        closable={{ 'aria-label': 'Close Button' }}
        onClose={onClose}
        open={drawerOpen}
        width={isMobile ? '100%' : '60dvw'}
        styles={{
          body: {
            overscrollBehaviorY: 'contain',
          },
        }}
      >
        <Space
          size="middle"
          direction="vertical"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Space size="middle" direction="vertical">
            <Divider style={{ fontSize: '15px', fontWeight: '300' }} plain>
              Category
            </Divider>
            <Space.Compact
              size="large"
              style={{
                position: 'relative',
              }}
            >
              <Select
                allowClear
                styles={{
                  popup: {
                    root: { maxHeight: '400px', overflow: 'auto' },
                  },
                }}
                getPopupContainer={() => document.body}
                className={'my-custom-select'}
                id={'homeCId'}
                style={{
                  width: !isMobile ? '50dvw' : 'calc(100dvw - 50px)',
                }}
                value={category || undefined}
                onChange={(value) => {
                  if (!value) {
                    setCategory('')
                  } else {
                    setCategory(value)
                  }
                  setApplied(false)
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
                allowClear
                styles={{
                  popup: {
                    root: { maxHeight: '400px', overflow: 'auto' },
                  },
                }}
                value={subCategory || undefined}
                getPopupContainer={() =>
                  document.getElementById('drawerContainerId')
                }
                className={'my-custom-select'}
                id={'homeSCId'}
                style={{
                  width: !isMobile ? '50dvw' : 'calc(100dvw - 50px)',
                }}
                onChange={(value) => {
                  if (!value) {
                    setSubCategory('')
                  } else {
                    setSubCategory(value)
                  }
                  setApplied(false)
                }}
                placeholder="Subcategory"
                filterOption={false}
                options={subCategoryOptions}
              ></Select>
            </Space.Compact>
          </Space>
          <Space size="middle" direction="vertical">
            <Divider style={{ fontSize: '15px', fontWeight: '300' }} plain>
              Location
            </Divider>
            <Space.Compact size="large" style={{ position: 'relative' }}>
              <Select
                allowClear
                styles={{
                  popup: {
                    root: { maxHeight: '400px', overflow: 'auto' },
                  },
                }}
                getPopupContainer={() => document.body}
                className={'my-custom-select'}
                id={'locationId'}
                style={{
                  width: !isMobile ? '50dvw' : 'calc(100dvw - 50px)',
                }}
                showSearch
                searchValue={locationLabel || null}
                onSearch={(value) => {
                  if (value.length <= 100) {
                    handleLocation(value)
                    setLocationLabel(value)
                  }
                }}
                onChange={(value) => {
                  if (!value) {
                    setLocationLabels([])
                    setLocation('')
                  }
                  setLocationLabel(value)
                  setApplied(false)
                }}
                placeholder="Location"
                filterOption={false}
                notFoundContent={
                  locationLoading ? (
                    <Spin
                      size="small"
                      indicator={
                        <LoadingOutlined
                          style={{
                            color: '#52c41a',
                          }}
                          spin
                        />
                      }
                    />
                  ) : (
                    <Empty />
                  )
                }
                onClick={(e) => {
                  scrollToBottomPrice()
                }}
                onSelect={(value, options) => {
                  handleLocationSelect(value, options)
                }}
                options={(locationLabels || []).map((item) => ({
                  value: item.Address.Label,
                  label: item.Address.Label,
                  key: item.PlaceId,
                  placeId: item.PlaceId,
                }))}
              ></Select>
            </Space.Compact>
            &nbsp;&nbsp;or
            <Space.Compact size="large">
              <Button
                disabled={currentLocationLabel}
                loading={locationAccessLoading}
                style={{
                  fontSize: '13px',
                  fontWeight: '300',
                  color: '#52c41a',
                  width: !isMobile ? '30dvw' : '60dvw',
                }}
                onClick={() => {
                  navigator.permissions
                    .query({ name: 'geolocation' })
                    .then(function (result) {
                      if (result.state === 'denied') {
                        Modal.info(locationInfoConfig)
                      }
                    })
                  setLocation('')
                  setLocationLabel('')
                  setApplied(false)
                  setCurrLocRemoved(false)
                  setTriggerLocation((value) => !value)
                }}
              >
                <LocateFixed />
                Use your current location
              </Button>
            </Space.Compact>
            <Space.Compact
              size="large"
              style={{
                display: currentLocationLabel ? 'block' : 'none',
              }}
            >
              <Input
                onChange={(e) => {
                  if (!e.target.value) {
                    setCurrentLocationLabel('')
                    setCurrentLocation('')
                    setApplied(false)
                    setCurrLocRemoved(true)
                  }
                }}
                style={{
                  width: !isMobile ? '50dvw' : 'calc(100dvw - 50px)',
                }}
                value={currentLocationLabel || null}
                allowClear
              ></Input>
            </Space.Compact>
            <Space.Compact size="large">
              <Input value="Radius" style={{ width: '20dvw' }} readOnly />
              <Select
                styles={{
                  popup: {
                    root: { maxHeight: '400px', overflow: 'auto' },
                  },
                }}
                getPopupContainer={() => document.body}
                disabled={!currentLocation && !location}
                style={{
                  width: !isMobile ? '20dvw' : '45dvw',
                }}
                value={radiusValue}
                placeholder="Radius"
                filterOption={false}
                onSelect={(value, options) => {
                  setRadiusValue(value)
                  setApplied(false)
                }}
                options={(radius || []).map((item, index) => ({
                  value: item.value,
                  label: item.label,
                  key: index,
                }))}
                onClick={() => {
                  scrollToBottom()
                }}
              ></Select>
            </Space.Compact>
          </Space>
          <Space
            size="middle"
            direction="vertical"
            style={{ width: !isMobile ? '50dvw' : 'calc(100dvw - 50px)' }}
          >
            <Divider
              style={{
                fontSize: '15px',
                fontWeight: '300',
              }}
              plain
            >
              Price
            </Divider>
            <Space size="small" style={{ width: '100%' }}>
              <Space.Compact size="large">
                <Radio.Group
                  // style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
                  buttonStyle="solid"
                  onChange={onChangePriceFilter}
                  value={priceFilter}
                  size="large"
                >
                  <Radio.Button
                    style={{ fontSize: '13px', fontWeight: '300' }}
                    value={'asc'}
                  >
                    Low to High
                  </Radio.Button>
                  <Radio.Button
                    style={{ fontSize: '13px', fontWeight: '300' }}
                    value={'desc'}
                  >
                    High to Low
                  </Radio.Button>
                </Radio.Group>
              </Space.Compact>
              <CloseCircleOutlined
                onClick={() => {
                  setApplied(false)
                  setPriceFilter('')
                }}
              />
            </Space>
            {/* &nbsp;&nbsp;or */}
            <Space.Compact size="large">
              <Space size="large">
                <Space.Compact size="large">
                  <Input
                    allowClear
                    id="homeMinId"
                    onChange={(event) => {
                      // setPriceFilter("");
                      if (
                        !/^(|0|[1-9]\d*)(\.\d{0,2})?$/.test(event.target.value)
                      ) {
                        return
                      }
                      setMinPrice(event.target.value)
                      setApplied(false)
                    }}
                    value={minPrice || null}
                    placeholder="min"
                    style={{ width: '150px' }}
                    onClick={() => {
                      scrollToBottom()
                    }}
                    maxLength={15}
                  ></Input>
                </Space.Compact>
                <Space.Compact size="large">
                  <Input
                    allowClear
                    id="homeMaxId"
                    onChange={(event) => {
                      // setPriceFilter("");
                      if (
                        !/^(|0|[1-9]\d*)(\.\d{0,2})?$/.test(event.target.value)
                      ) {
                        return
                      }
                      setMaxPrice(event.target.value)
                      setApplied(false)
                    }}
                    value={maxPrice || null}
                    placeholder="max"
                    style={{ width: '150px' }}
                    onClick={() => {
                      scrollToBottom()
                    }}
                    maxLength={15}
                  ></Input>
                </Space.Compact>
              </Space>
            </Space.Compact>
          </Space>
          <div
            ref={bottomRefPrice}
            style={{ display: 'block', height: 0 }}
          ></div>
          <br />
          <Space
            size="large"
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <Space.Compact
              size="large"
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <Button
                disabled={
                  !category &&
                  !priceFilter &&
                  !location &&
                  !currentLocation &&
                  !minPrice &&
                  !maxPrice
                }
                style={{
                  background: '#52c41a',
                  fontSize: '13px',
                  fontWeight: '300',
                }}
                onClick={() => {
                  setSearch('')
                  setLocation('')
                  setLocationLabels('')
                  setLocationLabel('')
                  setPriceFilter('')
                  setCategory('')
                  setCurrentPage(1)
                  setData([])
                  setInitialLoad(true)
                  setCurrentLocation('')
                  setCurrentLocationLabel('')
                  setCurrLocRemoved(true)
                  setMinPrice('')
                  setMaxPrice('')
                  setApplied(false)
                  setRadiusValue('')
                  onClose()
                }}
                type="primary"
              >
                Clear
              </Button>
            </Space.Compact>
            <Space.Compact
              size="large"
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <Button
                disabled={
                  (!category &&
                    !priceFilter &&
                    !location &&
                    !currentLocation &&
                    !currLocRemoved &&
                    !minPrice &&
                    !maxPrice) ||
                  applied
                }
                style={{
                  background: '#52c41a',
                  fontSize: '13px',
                  fontWeight: '300',
                }}
                onClick={() => {
                  setCurrentPage(1)
                  setData([])
                  setInitialLoad(true)
                  setApplied(true)
                  onClose()
                }}
                type="primary"
              >
                Apply
              </Button>
            </Space.Compact>
          </Space>
        </Space>
        <br />
        <br />
        <br />
        <div ref={bottomRef} style={{ display: 'block', height: 0 }}></div>
      </Drawer>
      <Space
        size="large"
        direction="vertical"
        style={{
          padding: '15px',
        }}
      >
        <Space size="middle">
          <Space.Compact
            size="large"
            style={{
              height: 'fit-content',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Input
              prefix={<Search style={{ color: '#9CA3AF', scale: '0.7' }} />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
                setData([])
                setInitialLoad(true)
              }}
              suffix={
                <Popover
                  placement="bottomRight"
                  styles={{ root: { width: '250px' } }}
                  content={
                    'Please provide as many details as possible in your search (e.g., for a phone: brand, color, memory, condition) to help you find the most relevant items.'
                  }
                  trigger="click"
                >
                  <InfoCircleOutlined
                    style={{ cursor: 'pointer', color: '#52c41a' }}
                  />
                </Popover>
              }
              placeholder="Search"
              style={{
                width: 'calc(100dvw - 100px)',
                height: 'fit-content',
                // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: '7px',
              }}
              maxLength={300}
            />
          </Space.Compact>
          <Space.Compact>
            <Space>
              <Settings2
                style={{ transform: 'scale(1)', color: '#9CA3AF' }}
                onClick={showDrawer}
              />
              <Dropdown
                trigger={['click']}
                menu={{
                  items: subMenuItems,
                  onClick: handleMenuClick,
                  style: {
                    width: '150px',
                  },
                }}
              >
                <a onClick={(e) => e.preventDefault()}>
                  <Space>
                    <EllipsisVertical style={{ color: '#9CA3AF' }} />
                  </Space>
                </a>
              </Dropdown>
            </Space>
          </Space.Compact>
        </Space>
      </Space>
      <Content>
        <div
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            height: '100%',
            background: '#F9FAFB',
            borderRadius: '0px',
            overflowY: 'scroll',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            padding: '15px 15px 70px 15px',
          }}
        >
          <InfiniteScroll
            style={{ overflowX: 'hidden', background: '#F9FAFB' }}
            dataLength={data.length}
            next={() => {
              loadMoreData()
            }}
            hasMore={hasMore}
            scrollableTarget="scrollableDiv"
          >
            {user &&
              !loading &&
              !chatLoading &&
              !favLoading &&
              (data.length > 0 ? (
                <List
                  grid={{
                    xs: 2,
                    sm: 3,
                    md: 4,
                    lg: 5,
                    xl: 6,
                    xxl: 7,
                    gutter: 10,
                  }}
                  dataSource={data}
                  renderItem={(item, index) => {
                    return (
                      <>
                        <List.Item
                          key={item['item']['uuid']}
                          style={{ display: 'flex', justifyContent: 'center' }}
                        >
                          <Card
                            style={{
                              height: '306px',
                              width: '186px',
                              display: 'flex',
                              flexDirection: 'column',
                              background: 'transparent',
                              border: 'none',
                              boxShadow:
                                '0 1px 2px 0 rgba(0, 0, 0, 0.05),  0 5px 15px rgba(0, 0, 0, 0.1)',
                            }}
                            styles={{
                              body: {
                                padding: '5px 5px 5px 5px',
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                background: 'transparent',
                              },
                            }}
                            onClick={() => {
                              setScrollPosition(
                                scrollableDivRef.current.scrollTop
                              )
                              navigate('/details', {
                                state: {
                                  item,
                                  ad: user.userId === item['item']['email'],
                                },
                              })
                            }}
                            cover={
                              <>
                                <Image
                                  src={item['images'][0]}
                                  {...(index <= 5 && { fetchPriority: 'high' })}
                                  loading={'lazy'}
                                  alt={item['item']['title']}
                                  style={{
                                    height: '220px',
                                    objectFit: 'cover',
                                  }}
                                  placeholder={
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        height: '220px',
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
                              </>
                            }
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-evenly',
                                flexGrow: 1,
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: '300',
                                    color: '#111827',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {capitalize(item['item']['title'])}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span
                                  style={{
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    fontSize: '15px',
                                    color: '#237804',
                                  }}
                                >
                                  £{item['item']['price']}
                                </span>
                                <div
                                  onClick={(event) => {
                                    handleFav(
                                      item,
                                      !filterList.includes(
                                        item['item']['uuid']
                                      ),
                                      event
                                    )
                                    event.preventDefault()
                                    event.stopPropagation()
                                  }}
                                  style={{
                                    paddingRight: '3px',
                                    display: 'flex',
                                    scale: '1.2',
                                  }}
                                >
                                  {filterList.includes(
                                    item['item']['uuid']
                                  ) && (
                                    <HeartFilled
                                      style={{
                                        color: '#52c41a',
                                      }}
                                    ></HeartFilled>
                                  )}
                                  {!filterList.includes(
                                    item['item']['uuid']
                                  ) && (
                                    <HeartFilled
                                      style={{
                                        color: '#9CA3AF',
                                      }}
                                    ></HeartFilled>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </List.Item>
                      </>
                    )
                  }}
                />
              ) : (
                <div
                  style={{
                    height: '50vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Empty description="No items found" />
                </div>
              ))}
            {(loading || chatLoading || favLoading) && (
              <Row gutter={[0, 10]}>
                {Array.from({ length: limit }).map((_, index) => {
                  return (
                    <Col
                      key={index}
                      xs={12}
                      sm={8}
                      md={6}
                      lg={4.8}
                      xl={4}
                      xxl={3.4}
                      style={{ display: 'flex', justifyContent: 'center' }}
                    >
                      <Skeleton.Node
                        style={{
                          height: '286px',
                          width: screens.xs ? '44dvw' : '186px',
                          borderRadius: '8px',
                        }}
                        active
                      />
                    </Col>
                  )
                })}
              </Row>
            )}
          </InfiniteScroll>
        </div>
      </Content>
      {isMobile && (
        <FooterWrapper>
          <MenuWrapper
            setScrollPosition={setScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={['1']}
            isMobile={isMobile}
          />
        </FooterWrapper>
      )}
      {(handleFavLoading || locationAccessLoading) && (
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
export default Home
