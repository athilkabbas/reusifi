import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Spin,
  Modal,
  TreeSelect,
  Dropdown,
  Drawer,
  Divider,
  Button,
  Row,
  Col,
  Select,
} from "antd";
import { EllipsisVertical, Settings2, Search } from "lucide-react";
import {
  LogoutOutlined,
  HeartFilled,
  LoadingOutlined,
  UpOutlined,
  DownOutlined,
  MailOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { LocateFixed } from "lucide-react";
import { Input, Space, Empty } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { List, Skeleton, Radio } from "antd";
import { Card } from "antd";
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import { locationsTreeSelect } from "../helpers/locations";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import { options } from "../helpers/categories";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
import useLocationComponent from "../component/Location";
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const { Content } = Layout;
const Home = () => {
  useLocationComponent();
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const scrollableDivRef = useRef(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
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
  } = useContext(Context);
  const [handleFavLoading, setHandleFavLoading] = useState(false);

  const isMobile = useIsMobile();
  const [loadedImages, setLoadedImages] = useState({});

  const calculateLimit = () => {
    const viewportHeight = window.innerHeight;
    const itemHeight = 300; // adjust if needed
    const rowsVisible = Math.ceil(viewportHeight / itemHeight);
    const columns = getColumnCount(); // depending on screen size (see below)
    return rowsVisible * columns * 8;
  };

  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width < 576) return 2; // xs
    if (width < 768) return 3; // sm
    if (width < 992) return 3; // md
    if (width < 1200) return 4; // lg
    if (width < 1600) return 4; // xl
    return 6; // xxl
  };
  const isModalVisibleRef = useRef(false);
  const errorSessionConfig = {
    title: "Session has expired.",
    content: "Please login again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: () => {
      isModalVisibleRef.current = false;
      signInWithRedirect();
    },
  };
  const locationInfoConfig = {
    title: "Enable location access",
    content:
      "To enable location access, please click the location icon at the end of the browser’s address bar and allow location permission for this site.",
    closable: false,
    maskClosable: false,
    okText: "Close",
    onOk: () => {},
  };
  const errorConfig = {
    title: "An error has occurred.",
    content: "Please reload.",
    closable: false,
    maskClosable: false,
    okText: "Reload",
    onOk: () => {
      isModalVisibleRef.current = false;
      window.location.reload();
    },
  };
  const [limit, setLimit] = useState(0); // default

  useEffect(() => {
    let prevWidth = window.innerWidth;
    const updateLimit = () => {
      const newLimit = calculateLimit();
      setLimit(newLimit);
    };
    updateLimit(); // on mount
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (hasMore && currentWidth > prevWidth) {
        setData([]);
        setCurrentPage(1);
        setInitialLoad(true);
        setLoadedImages({});
        updateLimit();
      }
      prevWidth = currentWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasMore]);

  const handleImageLoad = (uuid) => {
    setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
  };

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
          scrollableDivRef.current.scrollTo(0, scrollPosition);
        }
      });
    }
  }, [
    scrollPosition,
    chatLoading,
    favLoading,
    handleFavLoading,
    loading,
    data,
  ]);

  const handleMenuClick = ({ key }) => {
    if (key === "1") {
      navigate("/contact");
    } else if (key === "2") {
      signOut({ global: true });
    }
  };

  const handleFav = async (selectedItem, favourite) => {
    try {
      setScrollPosition(scrollableDivRef.current.scrollTop);
      // setFavInitialLoad(true);
      setHandleFavLoading(true);
      if (favourite) {
        const results = await callApi(
          `https://api.reusifi.com/prod/getFavouritesAdd?id=${encodeURIComponent(
            selectedItem["item"]["uuid"]
          )}&favourite=${encodeURIComponent(
            favourite
          )}&email=${encodeURIComponent(user.userId)}`,
          "GET"
        );
      } else {
        const results = await callApi(
          `https://api.reusifi.com/prod/getFavouritesRemove?id=${encodeURIComponent(
            selectedItem["item"]["uuid"]
          )}&favourite=${encodeURIComponent(
            favourite
          )}&email=${encodeURIComponent(user.userId)}`,
          "GET"
        );
      }
      if (!favourite) {
        setFilterList((prevValue) => {
          return prevValue.filter((item) => {
            return item !== selectedItem["item"]["uuid"];
          });
        });
        setFavData((prevValue) => {
          return prevValue.filter((item) => {
            return item["item"]["uuid"] !== selectedItem["item"]["uuid"];
          });
        });
      } else {
        setFilterList([...filterList, selectedItem["item"]["uuid"]]);
        setFavData((prevValue) => [selectedItem, ...prevValue]);
      }
      setHandleFavLoading(false);
    } catch (err) {
      setHandleFavLoading(false);
      if (isModalVisibleRef.current) {
        return;
      }
      isModalVisibleRef.current = true;
      if (err?.status === 401) {
        Modal.error({
          ...errorSessionConfig,
          content: err.message + "fav",
        });
      } else {
        Modal.error(errorConfig);
      }
      return;
    }
  };

  const encodeCursor = (obj) => {
    const jsonStr = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(jsonStr))); // handles UTF-8 safely
  };

  function isLeafNode(value, treeData) {
    function findNode(nodes) {
      for (const node of nodes) {
        if (node.value === value) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    }

    const node = findNode(treeData);
    return node ? !node.children || node.isLeaf === true : false;
  }
  const loadMoreData = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let results;
      if (search.trim() || applied || currentLocation) {
        results = await callApi(
          `https://api.reusifi.com/prod/getProductsSearch?&search=${encodeURIComponent(
            search.trim()
          )}&page=${encodeURIComponent(
            currentPage
          )}&perPage=${encodeURIComponent(limit)}&location=${encodeURIComponent(
            location
          )}&currentLocation=${encodeURIComponent(
            currentLocation
          )}&minPrice=${encodeURIComponent(
            minPrice
          )}&maxPrice=${encodeURIComponent(
            maxPrice
          )}&sortByPrice=${encodeURIComponent(
            priceFilter
          )}&category=${encodeURIComponent(
            !subCategory ? category : ""
          )}&subCategory=${encodeURIComponent(subCategory ? category : "")}`,
          "GET"
        );
      } else {
        results = await callApi(
          `https://api.reusifi.com/prod/getProducts?&page=${encodeURIComponent(
            currentPage
          )}&perPage=${encodeURIComponent(limit)}`,
          "GET"
        );
      }
      setCurrentPage((currentPage) => currentPage + 1);
      setHasMore(results.data.pagination.hasMore);
      const notUserData = results.data.items.filter(
        (item) => user.userId !== item["item"]["email"]
      );
      setData([...data, ...notUserData]);
      const favList = notUserData.map((item) => item["item"]["uuid"]);
      const favState = { email: user.userId, favList };
      const cursorFav = encodeCursor(favState);
      const favResult = await callApi(
        `https://api.reusifi.com/prod/getFavouritesList`,
        "POST",
        false,
        { cursorFav }
      );
      setFilterList([...filterList, ...favResult.data.finalResult]);
      setLoading(false);
      setScrollPosition(scrollPosition);
      setInitialLoad(false);
      setApplied(true);
    } catch (err) {
      setLoading(false);
      if (isModalVisibleRef.current) {
        return;
      }
      isModalVisibleRef.current = true;
      if (err?.status === 401) {
        Modal.error({
          ...errorSessionConfig,
          content: err.message + "load more",
        });
      } else {
        Modal.error(errorConfig);
      }
      return;
    }
  };

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (limit && initialLoad && (search.trim() || applied || currentLocation)) {
      setLoading(true);
      timer.current = setTimeout(() => {
        loadMoreData();
      }, 300);
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [search, limit, applied, currentLocation]);

  useEffect(() => {
    if (
      user &&
      initialLoad &&
      limit &&
      !search.trim() &&
      !applied &&
      !currentLocation
    ) {
      try {
        setChatLoading(true);
        setFavLoading(true);
        setLoading(true);
        const getChatCount = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );
        const loadMoreDataPromise = loadMoreData();

        Promise.all([getChatCount, loadMoreDataPromise])
          .then(([chatResult]) => {
            setUnreadChatCount(chatResult.data.count);
          })
          .catch((err) => {
            if (isModalVisibleRef.current) {
              return;
            }
            isModalVisibleRef.current = true;
            if (err?.status === 401) {
              Modal.error({
                ...errorSessionConfig,
                content: err.message + "chat count",
              });
            } else {
              Modal.error(errorConfig);
            }
          })
          .finally(() => {
            setChatLoading(false);
            setFavLoading(false);
            setLoading(false);
          });
      } catch (err) {
        setChatLoading(false);
        setFavLoading(false);
        setLoading(false);
        if (isModalVisibleRef.current) {
          return;
        }
        isModalVisibleRef.current = true;
        if (err?.status === 401) {
          Modal.error({
            ...errorSessionConfig,
            content: err.message + "load more not search",
          });
        } else {
          Modal.error(errorConfig);
        }
        return;
      }
    }
  }, [user, initialLoad, limit, search, applied, currentLocation]);
  const subMenuItems = [
    {
      key: "1",
      label: (
        <span style={{ fontSize: "13px", fontWeight: "300" }}>Contact</span>
      ),
      icon: (
        <MailOutlined
          style={{
            color: "#389e0d",
            fontSize: isMobile ? "10px" : "15px",
          }}
        />
      ),
    },
    {
      key: "2",
      label: (
        <span style={{ fontSize: "13px", fontWeight: "300" }}>Sign Out</span>
      ),
      icon: (
        <LogoutOutlined
          style={{
            color: "#389e0d",
            fontSize: isMobile ? "10px" : "15px",
            fontWeight: "300",
          }}
        />
      ),
    },
  ];
  const navigate = useNavigate();
  const onChangePriceFilter = (event) => {
    setPriceFilter(event.target.value);
    setMinPrice("");
    setMaxPrice("");
    setApplied(false);
  };
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const showDrawer = () => {
    setDrawerOpen(true);
  };
  const onClose = () => {
    setOpen(false);
    document.body.style.overscrollBehaviorY = "";
    setDrawerOpen(false);
  };
  const locationTimer = useRef(null);
  const handleLocationSelect = async (value, options) => {
    try {
      const data = await callApi(
        `https://api.reusifi.com/prod/getLocationAutocomplete?placeId=${encodeURIComponent(
          options.placeId
        )}`,
        "GET"
      );
      setLocation(data.data.reverse().join(","));
      setLocationLabel(value);
      setCurrentLocation("");
      setCurrentLocationLabel("");
      setApplied(false);
    } catch (err) {
      // message.info("Pincode not found");
    }
  };
  const [locationLabels, setLocationLabels] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const handleLocation = (value) => {
    setLocationLoading(true);
    if (locationTimer.current) {
      clearTimeout(locationTimer.current);
    }
    if (!value) {
      setTimeout(() => {
        setLocationLabels([]);
        setLocationLoading(false);
      }, 0);
      return;
    }
    locationTimer.current = setTimeout(async () => {
      try {
        const data = await callApi(
          `https://api.reusifi.com/prod/getLocationAutocomplete?location=${encodeURIComponent(
            value
          )}`,
          "GET"
        );
        setLocationLabels(data.data);
        setLocationLoading(false);
      } catch (err) {
        setLocationLoading(false);
      }
    }, 300);
  };
  return (
    <Layout
      style={{
        height: "100dvh",
        overflow: "hidden",
        background: "#F9FAFB",
      }}
    >
      {!isMobile && (
        <HeaderWrapper>
          <MenuWrapper
            setScrollPosition={setScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={["1"]}
            isMobile={isMobile}
          />
        </HeaderWrapper>
      )}
      <Space
        size="large"
        direction="vertical"
        style={{
          padding: "15px",
        }}
      >
        <Space size="middle">
          <Space.Compact
            size="large"
            style={{
              height: "fit-content",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Input
              prefix={<Search style={{ color: "#9CA3AF" }} />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
                setData([]);
                setInitialLoad(true);
                setLoadedImages({});
              }}
              placeholder="Search"
              style={{
                width: "calc(100dvw - 100px)",
                height: "fit-content",
                // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: "7px",
              }}
            />
          </Space.Compact>
          <Space.Compact>
            <Space>
              <Settings2
                style={{ transform: "scale(1)", color: "#9CA3AF" }}
                onClick={showDrawer}
              />
              <Dropdown
                trigger={["click"]}
                menu={{ items: subMenuItems, onClick: handleMenuClick }}
              >
                <a onClick={(e) => e.preventDefault()}>
                  <Space>
                    <EllipsisVertical style={{ color: "#9CA3AF" }} />
                  </Space>
                </a>
              </Dropdown>
            </Space>
            <Drawer
              title="Filters"
              closable={{ "aria-label": "Close Button" }}
              onClose={onClose}
              open={drawerOpen}
              width={"100dvw"}
            >
              <Space
                size="middle"
                direction="vertical"
                style={{ display: "flex", alignItems: "center" }}
              >
                <Divider style={{ fontSize: "15px", fontWeight: "300" }} plain>
                  Category
                </Divider>
                <Space.Compact size="large">
                  <TreeSelect
                    onPopupScroll={(e) => {
                      if (
                        document.activeElement instanceof HTMLElement &&
                        (isMobile ||
                          window.visualViewport?.width < 1200 ||
                          window.innerWidth < 1200)
                      ) {
                        const popup = e.currentTarget;
                        const scrollTop = popup.scrollTop;

                        // Blur the input to close the keyboard
                        setTimeout(() => {
                          try {
                            document.activeElement.blur({
                              preventScroll: true,
                            });
                          } catch {
                            document.activeElement.blur();
                          }
                        }, 0);

                        // Restore popup scroll immediately
                        popup.scrollTop = scrollTop;
                      }

                      document.body.style.overscrollBehaviorY = "none";
                    }}
                    suffixIcon={
                      open ? (
                        <UpOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            document.body.style.overscrollBehaviorY = "";
                          }}
                        />
                      ) : (
                        <DownOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(true);
                            document.body.style.overscrollBehaviorY = "none";
                          }}
                        />
                      )
                    }
                    showSearch
                    allowClear
                    style={{
                      width: !isMobile ? "50dvw" : "calc(100dvw - 50px)",
                      borderRadius: "7px",
                      height: "fit-content",
                    }}
                    value={category || null}
                    styles={{
                      popup: {
                        root: {
                          maxHeight: 400,
                          overflow: "auto",
                          overscrollBehavior: "contain",
                        },
                      },
                    }}
                    placeholder="Category"
                    onClick={() => {
                      setOpen(true);
                    }}
                    open={open}
                    onChange={(value) => {
                      setCategory(value);
                      const leaf = isLeafNode(value, options);
                      setSubCategory(leaf);
                      setTimeout(() => {
                        setOpen(false);
                      }, 0);
                      setApplied(false);
                    }}
                    treeData={options}
                  />
                </Space.Compact>
                <Divider style={{ fontSize: "15px", fontWeight: "300" }} plain>
                  Location
                </Divider>
                {
                  <Space.Compact size="large">
                    <Select
                      style={{
                        width: !isMobile ? "50dvw" : "calc(100dvw - 50px)",
                      }}
                      showSearch
                      allowClear
                      value={locationLabel || null}
                      onSearch={(value) => {
                        handleLocation(value);
                      }}
                      onChange={(value) => {
                        if (!value) {
                          setLocationLabels([]);
                          setLocation("");
                        }
                        setLocationLabel(value);
                        setApplied(false);
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
                                  color: "#52c41a",
                                }}
                                spin
                              />
                            }
                          />
                        ) : (
                          <Empty />
                        )
                      }
                      onSelect={(value, options) => {
                        handleLocationSelect(value, options);
                      }}
                      options={(locationLabels || []).map((item) => ({
                        value: item.Address.Label,
                        label: item.Address.Label,
                        key: item.PlaceId,
                        placeId: item.PlaceId,
                      }))}
                    ></Select>
                  </Space.Compact>
                }
                &nbsp;&nbsp;or
                <Space.Compact size="large">
                  <Button
                    loading={locationAccessLoading}
                    style={{
                      fontSize: "13px",
                      fontWeight: "300",
                      color: "#52c41a",
                      width: !isMobile ? "50dvw" : "calc(100dvw - 50px)",
                    }}
                    onClick={() => {
                      navigator.permissions
                        .query({ name: "geolocation" })
                        .then(function (result) {
                          if (result.state === "denied") {
                            Modal.info(locationInfoConfig);
                          }
                        });
                      setLocation("");
                      setLocationLabel("");
                      setApplied(false);
                      setTriggerLocation((value) => !value);
                    }}
                  >
                    <LocateFixed />
                    Use your current location
                  </Button>
                </Space.Compact>
                <Space.Compact
                  size="large"
                  style={{ display: currentLocationLabel ? "block" : "none" }}
                >
                  <Input
                    style={{
                      width: !isMobile ? "50dvw" : "calc(100dvw - 50px)",
                    }}
                    value={currentLocationLabel || null}
                  ></Input>
                </Space.Compact>
                <Divider style={{ fontSize: "15px", fontWeight: "300" }} plain>
                  Price
                </Divider>
                <Space size="small">
                  <Space.Compact size="large">
                    <Radio.Group
                      // style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
                      buttonStyle="solid"
                      onChange={onChangePriceFilter}
                      value={priceFilter}
                      size="large"
                    >
                      <Radio.Button
                        style={{ fontSize: "13px", fontWeight: "300" }}
                        value={"asc"}
                      >
                        Low to High
                      </Radio.Button>
                      <Radio.Button
                        style={{ fontSize: "13px", fontWeight: "300" }}
                        value={"desc"}
                      >
                        High to Low
                      </Radio.Button>
                    </Radio.Group>
                  </Space.Compact>
                  <CloseCircleOutlined onClick={() => setPriceFilter("")} />
                </Space>
                &nbsp;&nbsp;or
                <Space.Compact size="large">
                  <Space size="large">
                    <Space.Compact size="large">
                      <Input
                        onChange={(event) => {
                          setPriceFilter("");
                          setMinPrice(event.target.value);
                          setApplied(false);
                        }}
                        value={minPrice || null}
                        placeholder="min"
                        style={{ width: "150px" }}
                      ></Input>
                    </Space.Compact>
                    <Space.Compact size="large">
                      <Input
                        onChange={(event) => {
                          setPriceFilter("");
                          setMaxPrice(event.target.value);
                          setApplied(false);
                        }}
                        value={maxPrice || null}
                        placeholder="max"
                        style={{ width: "150px" }}
                      ></Input>
                    </Space.Compact>
                  </Space>
                </Space.Compact>
                <Space
                  size="middle"
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <Space.Compact
                    size="large"
                    style={{ display: "flex", justifyContent: "center" }}
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
                        background: "#52c41a",
                        fontSize: "13px",
                        fontWeight: "300",
                      }}
                      onClick={() => {
                        setSearch("");
                        setLocation("");
                        setLocationLabels("");
                        setLocationLabel("");
                        setPriceFilter("");
                        setCategory("");
                        setCurrentPage(1);
                        setData([]);
                        setInitialLoad(true);
                        setLoadedImages({});
                        setCurrentLocation("");
                        setCurrentLocationLabel("");
                        setMinPrice("");
                        setMaxPrice("");
                        setApplied(false);
                        onClose();
                      }}
                      type="primary"
                    >
                      Clear
                    </Button>
                  </Space.Compact>
                  <Space.Compact
                    size="large"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    <Button
                      disabled={
                        (!category &&
                          !priceFilter &&
                          !location &&
                          !currentLocation &&
                          !minPrice &&
                          !maxPrice) ||
                        applied
                      }
                      style={{
                        background: "#52c41a",
                        fontSize: "13px",
                        fontWeight: "300",
                      }}
                      onClick={() => {
                        setCurrentPage(1);
                        setData([]);
                        setInitialLoad(true);
                        setLoadedImages({});
                        setApplied(true);
                        onClose();
                      }}
                      type="primary"
                    >
                      Apply
                    </Button>
                  </Space.Compact>
                </Space>
              </Space>
            </Drawer>
          </Space.Compact>
        </Space>
      </Space>
      <Content>
        <div
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            height: "100%",
            background: "#F9FAFB",
            borderRadius: "0px",
            overflowY: "scroll",
            overflowX: "hidden",
            scrollbarWidth: "none",
            padding: "15px 15px 70px 15px",
          }}
        >
          <InfiniteScroll
            style={{ overflowX: "hidden", background: "#F9FAFB" }}
            dataLength={data.length}
            next={() => {
              loadMoreData();
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
                  renderItem={(item) => {
                    return (
                      <>
                        <List.Item
                          key={item["item"]["uuid"]}
                          style={{ display: "flex", justifyContent: "center" }}
                        >
                          <Card
                            style={{ height: "325px", width: "186px" }}
                            bodyStyle={{ padding: "10px 10px 10px 10px" }}
                            onClick={() => {
                              setScrollPosition(
                                scrollableDivRef.current.scrollTop
                              );
                              navigate("/details", {
                                state: {
                                  item,
                                  ad: user.userId === item["item"]["email"],
                                },
                              });
                            }}
                            cover={
                              <>
                                {!loadedImages[item["item"]["uuid"]] && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      height: "250px",
                                      alignItems: "center",
                                      backgroundColor: "#f0f0f0",
                                    }}
                                  >
                                    <Spin
                                      indicator={
                                        <LoadingOutlined
                                          style={{
                                            fontSize: 48,
                                            color: "#52c41a",
                                          }}
                                          spin
                                        />
                                      }
                                    />
                                  </div>
                                )}
                                <img
                                  src={item["images"][0]}
                                  alt={item["item"]["title"]}
                                  style={{
                                    maxHeight: "260px",
                                    objectFit: "contain",
                                    display: loadedImages[item["item"]["uuid"]]
                                      ? "block"
                                      : "none",
                                  }}
                                  onLoad={() =>
                                    handleImageLoad(item["item"]["uuid"])
                                  }
                                  onError={() =>
                                    handleImageLoad(item["item"]["uuid"])
                                  }
                                />
                              </>
                            }
                          >
                            <Card.Meta
                              description={
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "5px",
                                  }}
                                >
                                  <div>
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: "300",
                                        color: "#111827",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {capitalize(item["item"]["title"])}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <span
                                      style={{
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                        fontSize: "15px",
                                        color: "#237804",
                                      }}
                                    >
                                      ₹{item["item"]["price"]}
                                    </span>
                                    <div
                                      onClick={(event) => {
                                        handleFav(
                                          item,
                                          !filterList.includes(
                                            item["item"]["uuid"]
                                          ),
                                          event
                                        );
                                        event.preventDefault();
                                        event.stopPropagation();
                                      }}
                                      style={{
                                        paddingRight: "3px",
                                        display: "flex",
                                        scale: "1.2",
                                      }}
                                    >
                                      {filterList.includes(
                                        item["item"]["uuid"]
                                      ) && (
                                        <HeartFilled
                                          style={{
                                            color: "#52c41a",
                                          }}
                                        ></HeartFilled>
                                      )}
                                      {!filterList.includes(
                                        item["item"]["uuid"]
                                      ) && (
                                        <HeartFilled
                                          style={{
                                            color: "#9CA3AF",
                                          }}
                                        ></HeartFilled>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              }
                            />
                          </Card>
                        </List.Item>
                      </>
                    );
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "50vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Empty description="No items found" />
                </div>
              ))}
            {(loading || chatLoading || favLoading) && (
              <Row gutter={[10, 10]}>
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
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <Skeleton.Node
                        style={{ height: "300px", width: "186px" }}
                        active
                      />
                    </Col>
                  );
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
            defaultSelectedKeys={["1"]}
            isMobile={isMobile}
          />
        </FooterWrapper>
      )}
      {handleFavLoading && (
        <Spin
          fullscreen
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#52c41a" }} spin />
          }
        />
      )}
    </Layout>
  );
};
export default Home;
