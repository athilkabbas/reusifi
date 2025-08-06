import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Spin,
  Modal,
  Switch,
  TreeSelect,
  Dropdown,
  Drawer,
  Divider,
  Button,
  Row,
  Col,
} from "antd";
import { EllipsisVertical, Settings2 } from "lucide-react";
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
import { Card, Typography } from "antd";
import {
  getCurrentUser,
  signInWithRedirect,
  signOut,
  fetchUserAttributes,
} from "@aws-amplify/auth";
import { locationsTreeSelect } from "../helpers/locations";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import { options } from "./AddDress";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
const { Text } = Typography;
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const { Content } = Layout;
const Home = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [attributes, setAttributes] = useState(null);
  const timer = useRef(null);
  const [districts, setDistricts] = useState([]);
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
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      // const attributes = await fetchUserAttributes();
      // console.log(attributes);
      // setAttributes(attributes);
    };
    getUser();
  }, []);

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

  const handleChange = (value, type) => {
    setData([]);
    setCurrentPage(1);
    setInitialLoad(true);
    if (type === "state") {
      setLocation((prevValue) => {
        return { ...prevValue, [type]: value, district: "" };
      });
    } else {
      setLocation((prevValue) => {
        return { ...prevValue, [type]: value };
      });
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
  const [inputChecked, setInputChecked] = useState(false);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState(false);
  const [apply, setApply] = useState(false);
  const loadMoreData = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let results;
      if (search.trim() || category) {
        results = await callApi(
          `https://api.reusifi.com/prod/getProductsSearch?&search=${encodeURIComponent(
            search.trim()
          )}&page=${encodeURIComponent(
            currentPage
          )}&perPage=${encodeURIComponent(limit)}&state=${encodeURIComponent(
            location.state
          )}&district=${encodeURIComponent(
            location.district
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
    if (
      apply &&
      limit &&
      initialLoad &&
      (search.trim() ||
        category ||
        Object.values(location).some((value) => value) ||
        priceFilter)
    ) {
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
  }, [search, location, priceFilter, limit, category, apply]);

  useEffect(() => {
    if (user && initialLoad && limit && !search.trim() && !category && !apply) {
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
            console.log(err);
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
  }, [user, initialLoad, limit, search, category, apply]);
  const subMenuItems = [
    {
      key: "1",
      label: "Contact",
      icon: (
        <MailOutlined
          style={{ color: "#389e0d", fontSize: isMobile ? "10px" : "15px" }}
        />
      ),
    },
    {
      key: "2",
      label: "Sign Out",
      icon: (
        <LogoutOutlined
          style={{ color: "#389e0d", fontSize: isMobile ? "10px" : "15px" }}
        />
      ),
    },
  ];
  const navigate = useNavigate();
  const onChangePriceFilter = (event) => {
    setPriceFilter(event.target.value);
  };
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const showDrawer = () => {
    setDrawerOpen(true);
  };
  const onClose = () => {
    setOpen(false);
    setLocationOpen(false);
    document.body.style.overscrollBehaviorY = "";
    setDrawerOpen(false);
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
          padding: "10px",
        }}
      >
        <Space>
          <Space.Compact
            size="large"
            style={{
              height: "fit-content",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
                setData([]);
                setInitialLoad(true);
                if (!event.target.value.trim()) {
                  setLocation({ state: "", district: "" });
                  setPriceFilter("");
                  setDistricts([]);
                }
              }}
              placeholder="Search"
              style={{
                width: "calc(100dvw - 70px)",
                height: "fit-content",
                // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: "7px",
              }}
            />
          </Space.Compact>
          <Space.Compact>
            <Space size={0}>
              <Settings2
                style={{ transform: "scale(1)", color: "#9CA3AF" }}
                onClick={showDrawer}
              />
              <Dropdown
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
              <Space size="middle" direction="vertical">
                <Divider plain>Category</Divider>
                <Space.Compact size="large">
                  <TreeSelect
                    onPopupScroll={() => {
                      if (
                        document.activeElement instanceof HTMLElement &&
                        (isMobile ||
                          window.visualViewport?.innerWidth < 1200 ||
                          window.innerWidth < 1200)
                      ) {
                        document.activeElement.blur();
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
                      width: "calc(100dvw - 50px)",
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
                    placeholder="Search by category"
                    treeDefaultExpandAll
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
                    }}
                    treeData={options}
                  />
                </Space.Compact>
                <Divider plain>Location</Divider>
                <Space.Compact size="large">
                  <TreeSelect
                    onPopupScroll={() => {
                      if (
                        document.activeElement instanceof HTMLElement &&
                        (isMobile ||
                          window.visualViewport?.innerWidth < 1200 ||
                          window.innerWidth < 1200)
                      ) {
                        document.activeElement.blur();
                      }
                      document.body.style.overscrollBehaviorY = "none";
                    }}
                    suffixIcon={
                      locationOpen ? (
                        <UpOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocationOpen(false);
                            document.body.style.overscrollBehaviorY = "";
                          }}
                        />
                      ) : (
                        <DownOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocationOpen(true);
                            document.body.style.overscrollBehaviorY = "none";
                          }}
                        />
                      )
                    }
                    showSearch
                    allowClear
                    style={{
                      width: "calc(100dvw - 200px)",
                      borderRadius: "7px",
                      height: "fit-content",
                    }}
                    value={location.district || location.state || null}
                    styles={{
                      popup: {
                        root: {
                          maxHeight: 400,
                          overflow: "auto",
                          overscrollBehavior: "contain",
                        },
                      },
                    }}
                    placeholder="Location"
                    treeDefaultExpandAll
                    onClick={() => {
                      document.body.style.overscrollBehaviorY = "none";
                      setLocationOpen(true);
                    }}
                    open={locationOpen}
                    onChange={(value) => {
                      if (!value) {
                        setLocation({ state: "", district: "" });
                        return;
                      }
                      const [statePart, ...districtParts] = value.split("-");
                      const isDistrict = districtParts.length > 0;
                      if (isDistrict) {
                        setLocation({
                          state: statePart,
                          district: districtParts.join("-"),
                        });
                      } else {
                        setLocation({ state: value, district: "" });
                      }
                      setTimeout(() => {
                        setLocationOpen(false);
                      }, 0);
                    }}
                    treeData={locationsTreeSelect}
                  />
                </Space.Compact>
                &nbsp;&nbsp;or
                <Space.Compact size="large">
                  <Button>
                    <LocateFixed />
                    Use your location
                  </Button>
                </Space.Compact>
                <Divider plain>Price</Divider>
                <Space size="small">
                  <Space.Compact size="large">
                    <Radio.Group
                      // style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
                      buttonStyle="solid"
                      onChange={onChangePriceFilter}
                      value={priceFilter}
                      size="large"
                    >
                      <Radio.Button value={"asc"}>Low to High</Radio.Button>
                      <Radio.Button value={"desc"}>High to Low</Radio.Button>
                    </Radio.Group>
                  </Space.Compact>
                  <CloseCircleOutlined onClick={() => setPriceFilter("")} />
                </Space>
                &nbsp;&nbsp;or
                <Space.Compact size="large">
                  <Space size="large">
                    <Space.Compact size="large">
                      <Input
                        placeholder="min"
                        style={{ width: "150px" }}
                      ></Input>
                    </Space.Compact>
                    <Space.Compact size="large">
                      <Input
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
                      style={{ background: "#52c41a" }}
                      onClick={() => {
                        setSearch("");
                        setLocation({ state: "", district: "" });
                        setPriceFilter("");
                        setCategory("");
                        setCurrentPage(1);
                        setData([]);
                        setInitialLoad(true);
                        setApply(false);
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
                      style={{ background: "#52c41a" }}
                      onClick={() => {
                        setCurrentPage(1);
                        setData([]);
                        setInitialLoad(true);
                        setApply(true);
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
          className="hide-scrollbar overflow-auto"
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            padding: 5,
            height: "100%",
            background: "#F9FAFB",
            borderRadius: "0px",
            overflowY: "scroll",
            overflowX: "hidden",
            paddingBottom: "60px",
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
