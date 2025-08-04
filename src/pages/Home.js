import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Layout,
  Menu,
  Spin,
  message,
  Modal,
  Switch,
  TreeSelect,
} from "antd";
import { EllipsisVertical } from "lucide-react";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  SearchOutlined,
  ProductFilled,
  MailFilled,
  HeartFilled,
  LoadingOutlined,
  MenuOutlined,
  UpOutlined,
  DownOutlined,
  MessageOutlined,
  ProductOutlined,
  HeartOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { Input, Select, Space, Empty } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { List, Skeleton, Radio } from "antd";
import { Card, Typography } from "antd";
import { getCurrentUser, signInWithRedirect, signOut } from "@aws-amplify/auth";
import {
  states,
  districtMap,
  locationsCascader,
  locationsTreeSelect,
} from "../helpers/locations";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import { options } from "./AddDress";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
const IconText = ["Home", "Sell", "Chats", "My Ads", "Favourites", ""];
const { Text } = Typography;
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const { Header, Content, Footer } = Layout;
const Home = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
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
    unreadChatCount,
    setUnreadChatCount,
  } = useContext(Context);
  const [handleFavLoading, setHandleFavLoading] = useState(false);

  const isMobile = useIsMobile();

  const items = [
    HomeOutlined,
    UploadOutlined,
    MessageOutlined,
    ProductOutlined,
    HeartOutlined,
    MenuOutlined,
  ].map((icon, index) => {
    let divHtml;
    if (isMobile) {
      divHtml = (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 10,
            height: "50px",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "16px", marginTop: "0px" }}>
            {React.createElement(icon)}
          </span>
          <span style={{ fontSize: "10px", marginTop: "5px" }}>
            {IconText[index]}
          </span>
        </div>
      );
    } else {
      divHtml = (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            fontSize: 10,
            height: "50px",
            justifyContent: "center",
            width: "20px",
          }}
        >
          <span style={{ fontSize: "20px", marginTop: "0px" }}>
            {React.createElement(icon)}
          </span>
          <span
            style={{ fontSize: "15px", marginTop: "5px", marginLeft: "5px" }}
          >
            {IconText[index]}
          </span>
        </div>
      );
    }
    if (index === 2) {
      return {
        key: String(index + 1),
        icon: (
          <div style={{ position: "relative", bottom: "6px" }}>
            <Badge dot={unreadChatCount}>{divHtml}</Badge>
          </div>
        ),
      };
    } else if (index === 5) {
      return {
        key: String(index + 1),
        icon: divHtml,
        children: [
          {
            key: "6-1",
            label: "Contact",
            icon: React.createElement(MailFilled),
          },
          {
            key: "6-2",
            label: "Sign out",
            icon: React.createElement(LogoutOutlined),
          },
        ],
      };
    }
    return {
      key: String(index + 1),
      icon: divHtml,
    };
  });
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

  // useEffect(() => {
  //   if (scrollableDivRef.current && !chatLoading && !favLoading && !handleFavLoading && !loading) {
  //     const el = scrollableDivRef.current;
  //     if (el.scrollHeight <= el.clientHeight && hasMore && limit) {
  //       loadMoreData();
  //     }
  //   }
  // }, [chatLoading,favLoading,handleFavLoading,loading,data,limit]);

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
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
  }, [search, location, priceFilter, limit, category]);

  useEffect(() => {
    if (user && initialLoad && limit && !search.trim() && !category) {
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
  }, [user, initialLoad, limit, search, category]);

  const navigate = useNavigate();
  const handleNavigation = async (event) => {
    setScrollPosition(scrollableDivRef.current.scrollTop);
    switch (event.key) {
      case "1":
        navigate("/");
        break;
      case "2":
        navigate("/addProduct");
        break;
      case "3":
        navigate("/chatPage");
        break;
      case "4":
        navigate("/ads");
        break;
      case "5":
        navigate("/favourite");
        break;
      case "6-1":
        navigate("/contact");
        break;
      case "6-2":
        signOut();
        break;
    }
  };
  const onChangePriceFilter = (event) => {
    setCurrentPage(1);
    setData([]);
    setInitialLoad(true);
    setPriceFilter(event.target.value);
  };
  const [open, setOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
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
        size="small"
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
            {inputChecked ? (
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
                prefix={
                  <Switch
                    style={{ background: "#52c41a" }}
                    defaultChecked
                    onChange={(checked) => {
                      setCategory("");
                      setSearch("");
                      setLocation({ state: "", district: "" });
                      setPriceFilter("");
                      setDistricts([]);
                      setInputChecked(checked);
                      setOpen(false);
                      setInitialLoad(true);
                      setCurrentPage(1);
                      document.body.style.overscrollBehaviorY = "";
                    }}
                  ></Switch>
                }
                showSearch
                allowClear
                style={{
                  width: "calc(100vw - 50px)",
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
                  setCurrentPage(1);
                  setData([]);
                  setInitialLoad(true);
                  setTimeout(() => {
                    setOpen(false);
                  }, 0);
                }}
                treeData={options}
              />
            ) : (
              <Input
                prefix={
                  <Switch
                    onChange={(checked) => {
                      setSearch("");
                      setCategory("");
                      setLocation({ state: "", district: "" });
                      setPriceFilter("");
                      setDistricts([]);
                      setInputChecked(checked);
                      setInitialLoad(true);
                      setCurrentPage(1);
                      setOpen(true);
                      document.body.style.overscrollBehaviorY = "none";
                    }}
                  ></Switch>
                }
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
                  width: "calc(100vw - 50px)",
                  height: "fit-content",
                  // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  borderRadius: "7px",
                }}
              />
            )}
          </Space.Compact>
          <Space.Compact>
            <EllipsisVertical style={{ color: "grey", marginTop: "7px" }} />
          </Space.Compact>
        </Space>
        <Space.Compact
          size="large"
          style={{
            display: !search.trim() && !category ? "none" : "flex",
            flexDirection: "row",
          }}
        >
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
              width: "calc(100vw - 200px)",
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
                setCurrentPage(1);
                setData([]);
                setInitialLoad(true);
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
              setCurrentPage(1);
              setData([]);
              setInitialLoad(true);
              setTimeout(() => {
                setLocationOpen(false);
              }, 0);
            }}
            treeData={locationsTreeSelect}
          />
        </Space.Compact>
        <Space.Compact
          size="large"
          style={{
            padding: "10px",
            display: !search.trim() && !category ? "none" : "flex",
            alignItems: "center",
          }}
        >
          <Text strong>Price</Text>
          &nbsp; &nbsp;
          <Radio.Group
            // style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
            buttonStyle="solid"
            onChange={onChangePriceFilter}
            value={priceFilter}
          >
            <Radio.Button value={"asc"}>Low to High</Radio.Button>
            <Radio.Button value={"desc"}>High to Low</Radio.Button>
          </Radio.Group>
        </Space.Compact>
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
                    md: 3,
                    lg: 4,
                    xl: 4,
                    xxl: 6,
                    gutter: 10,
                  }}
                  dataSource={data}
                  renderItem={(item) => {
                    return (
                      <>
                        <List.Item key={item["item"]["uuid"]}>
                          <Card
                            style={{ height: "325px" }}
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
              <Skeleton
                paragraph={{
                  rows: 4,
                }}
                active
              />
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
