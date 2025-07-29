import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Layout, Menu, Spin, theme, message, Modal } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  ProductFilled,
  MailFilled,
  HeartOutlined,
  HeartFilled,
  LoadingOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import { List, Skeleton, Empty } from "antd";
import { Card } from "antd";
import { getCurrentUser, signInWithRedirect, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
const IconText = ["Home", "Sell", "Chats", "My Ads", "Favourites", ""];
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const { Header, Content, Footer } = Layout;
const Favourites = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const scrollableDivRef = useRef(null);
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [handleFavLoading, setHandleFavLoading] = useState(false);
  const isMobile = useIsMobile();
  const {
    filterList,
    setFilterList,
    favScrollPosition,
    setFavScrollPosition,
    favInitialLoad,
    setFavInitialLoad,
    favData,
    setFavData,
    favHasMore,
    setFavHasMore,
    setFavLastEvaluatedKey,
    favLastEvaluatedKey,
    unreadChatCount,
    setUnreadChatCount,
  } = useContext(Context);

  const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    HeartFilled,
    MenuOutlined,
  ].map((icon, index) => {
    let divHtml;
    if (isMobile) {
      divHtml = (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 10,
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
            alignItems: "center",
            fontSize: 10,
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
        icon: <Badge dot={unreadChatCount}>{divHtml}</Badge>,
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
  const errorSessionConfig = {
    title: "Session has expired.",
    content: "Please login again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: () => {
      signInWithRedirect();
    },
  };
  const errorConfig = {
    title: "An error has occurred.",
    content: "Please try again later.",
    closable: false,
    maskClosable: false,
    okText: "Close",
    onOk: () => {
      navigate("/");
    },
  };
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
      if (favHasMore && currentWidth > prevWidth) {
        setFavData([]);
        setFavLastEvaluatedKey(null);
        setFavInitialLoad(true);
        updateLimit();
      }
      prevWidth = currentWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [favHasMore]);

  const handleImageLoad = (uuid) => {
    setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
  };

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    getUser();
  }, []);

  // useEffect(() => {
  //   if (scrollableDivRef.current  &&  !loading && !handleFavLoading && !chatLoading && !favLoading) {
  //     const el = scrollableDivRef.current;
  //     if (el.scrollHeight <= el.clientHeight && favHasMore && limit) {
  //       loadMoreData();
  //     }
  //   }
  // }, [loading,favData,handleFavLoading,chatLoading,favLoading,limit]);

  useEffect(() => {
    if (scrollableDivRef.current && !loading && !handleFavLoading) {
      requestAnimationFrame(() => {
        scrollableDivRef.current.scrollTo(0, favScrollPosition);
        setScrollLoadMoreData(false, scrollLoadMoreData);
      });
    }
  }, [favScrollPosition, loading, favData, handleFavLoading]);

  const handleFav = async (id, favourite) => {
    try {
      setFavScrollPosition(scrollableDivRef.current.scrollTop);
      setHandleFavLoading(true);
      if (favourite) {
        const results = await callApi(
          `https://api.reusifi.com/prod/getFavouritesAdd?id=${encodeURIComponent(
            id
          )}&favourite=${encodeURIComponent(
            favourite
          )}&email=${encodeURIComponent(user.userId)}`,
          "GET"
        );
      } else {
        const results = await callApi(
          `https://api.reusifi.com/prod/getFavouritesRemove?id=${encodeURIComponent(
            id
          )}&favourite=${encodeURIComponent(
            favourite
          )}&email=${encodeURIComponent(user.userId)}`,
          "GET"
        );
      }
      if (!favourite) {
        setFilterList((prevValue) => {
          return prevValue.filter((item) => {
            return item !== id;
          });
        });
        setFavData((prevValue) => {
          return prevValue.filter((item) => {
            return item["item"]["uuid"] !== id;
          });
        });
      } else {
        setFilterList([...filterList, id]);
      }
      setHandleFavLoading(false);
    } catch (err) {
      setHandleFavLoading(false);
      if (err?.status === 401) {
        Modal.error(errorSessionConfig);
      } else {
        message.error("An Error has occurred");
        // Modal.error(errorConfig)
      }
    }
  };

  const loadMoreData = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let results;
      results = await callApi(
        `https://api.reusifi.com/prod/getFavouritesEmail?email=${encodeURIComponent(
          user.userId
        )}&limit=${encodeURIComponent(
          limit
        )}&lastEvaluatedKey=${encodeURIComponent(
          JSON.stringify(favLastEvaluatedKey)
        )}`,
        "GET"
      );
      setFavLastEvaluatedKey(results.data.lastEvaluatedKey);
      if (!results.data.lastEvaluatedKey) {
        setFavHasMore(false);
      } else {
        setFavHasMore(true);
      }
      if (favInitialLoad) {
        setFavData([...results.data.finalResult]);
      } else {
        setFavData([...favData, ...results.data.finalResult]);
      }
      const uuids = results.data.finalResult.map(
        (item) => item["item"]["uuid"]
      );
      setFilterList([...filterList, ...uuids]);
      setLoading(false);
      setFavScrollPosition(scrollPosition);
      setFavInitialLoad(false);
    } catch (err) {
      setLoading(false);
      // message.error("An Error has occurred")
      if (err?.status === 401) {
        Modal.error(errorSessionConfig);
      } else {
        Modal.error(errorConfig);
      }
      console.log(err);
    }
  };

  useEffect(() => {
    if (user && favInitialLoad && limit) {
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
          .then(([chatResult, favResult]) => {
            setUnreadChatCount(chatResult.data.count);
          })
          .catch((err) => {
            if (err?.status === 401) {
              Modal.error(errorSessionConfig);
            } else {
              Modal.error(errorConfig);
            }
            console.error(err);
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
        if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
      }
    }
  }, [user, favInitialLoad, limit]);

  const navigate = useNavigate();
  const handleNavigation = async (event) => {
    setFavScrollPosition(scrollableDivRef.current.scrollTop);
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
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout
      style={{
        height: "100dvh",
        overflow: "hidden",
        background: "#F9FAFB",
      }}
    >
      {!isMobile && (
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0px",
            height: "50px",
          }}
        >
          <Menu
            onClick={(event) => handleNavigation(event)}
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["5"]}
            items={items}
            style={{
              minWidth: 0,
              justifyContent: "space-around",
              flex: 1,
              background: "#6366F1",
            }}
          />
        </Header>
      )}
      <Content style={{ padding: "0 15px" }}>
        <div
          className="hide-scrollbar overflow-auto"
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            padding: "15px 5px",
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
            dataLength={favData.length}
            next={() => {
              setScrollLoadMoreData(true);
              loadMoreData();
            }}
            hasMore={favHasMore}
            scrollableTarget="scrollableDiv"
          >
            {user &&
              !loading &&
              !chatLoading &&
              !favLoading &&
              (favData.length > 0 ? (
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
                  dataSource={favData}
                  renderItem={(item) => {
                    return (
                      <>
                        <List.Item key={item["item"]["uuid"]}>
                          <Card
                            hoverable
                            bodyStyle={{ padding: "15px 0px 0px 0px" }}
                            style={{
                              borderRadius: "12px",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                              padding: "10px",
                            }}
                            onClick={() => {
                              setFavScrollPosition(
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
                              <div
                                key={item["item"]["uuid"]}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                {!loadedImages[item["item"]["uuid"]] && (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "200px",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      backgroundColor: "#f0f0f0",
                                    }}
                                  >
                                    <Spin
                                      indicator={
                                        <LoadingOutlined
                                          style={{
                                            fontSize: 48,
                                            color: "#6366F1",
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
                                    display: loadedImages[item["item"]["uuid"]]
                                      ? "block"
                                      : "none",
                                    height: "200px",
                                    objectFit: "contain",
                                    borderRadius: "5px",
                                  }}
                                  onLoad={() =>
                                    handleImageLoad(item["item"]["uuid"])
                                  }
                                  onError={() =>
                                    handleImageLoad(item["item"]["uuid"])
                                  }
                                />
                              </div>
                            }
                          >
                            <div
                              style={{
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{ fontSize: "16px", color: "#111827" }}
                              >
                                {capitalize(item["item"]["title"])}
                              </span>
                            </div>
                            <div
                              style={{
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{ fontSize: "15px", color: "#4B5563" }}
                              >
                                ₹{item["item"]["price"]}
                              </span>
                            </div>
                            {item["item"]["email"] !== user.userId && (
                              <div
                                onClick={(event) => {
                                  handleFav(
                                    item["item"]["uuid"],
                                    !filterList.includes(item["item"]["uuid"]),
                                    event
                                  );
                                  event.preventDefault();
                                  event.stopPropagation();
                                }}
                                style={{
                                  display: "flex",
                                  justifyContent: "end",
                                }}
                              >
                                {filterList.includes(item["item"]["uuid"]) && (
                                  <HeartFilled
                                    style={{ color: "#E0245E" }}
                                  ></HeartFilled>
                                )}
                                {!filterList.includes(item["item"]["uuid"]) && (
                                  <HeartOutlined></HeartOutlined>
                                )}
                              </div>
                            )}
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
        <Footer
          style={{
            position: "fixed",
            bottom: 0,
            zIndex: 1,
            width: "100vw",
            display: "flex",
            alignItems: "center",
            padding: "0px",
            height: "50px",
          }}
        >
          <Menu
            onClick={(event) => handleNavigation(event)}
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["5"]}
            items={items}
            style={{
              minWidth: 0,
              justifyContent: "space-around",
              flex: 1,
              background: "#6366F1",
            }}
          />
        </Footer>
      )}
      {handleFavLoading && (
        <Spin
          fullscreen
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />
          }
        />
      )}
    </Layout>
  );
};
export default Favourites;
