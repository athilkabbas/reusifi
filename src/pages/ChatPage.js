import React, { useEffect, useState, useRef, useContext } from "react";
import { Col, message, Row, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { Layout, Menu, theme, Modal } from "antd";
import { Image } from "antd";
import { getCurrentUser, signInWithRedirect } from "@aws-amplify/auth";
import { List } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Card, Skeleton } from "antd";
import { Dropdown, Space } from "antd";
import { Context } from "../context/provider";
import { Empty } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import { EllipsisVertical } from "lucide-react";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";

const menuItems = [
  {
    key: "1",
    danger: true,
    label: "Block",
  },
  {
    key: "2",
    danger: true,
    label: "Delete",
  },
];

const menuItemsBlocked = [
  {
    key: "1",
    danger: false,
    label: "Unblock",
  },
  {
    key: "2",
    danger: true,
    label: "Delete",
  },
];
const { Content } = Layout;
const ChatPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const scrollableDivRef = useRef(null);
  const [chatLoading, setChatLoading] = useState(false);
  const {
    chatScrollPosition,
    setChatScrollPosition,
    chatInitialLoad,
    setChatInitialLoad,
    chatData,
    setChatData,
    setChatHasMore,
    chatHasMore,
    chatLastEvaluatedKey,
    setChatLastEvaluatedKey,
    setUnreadChatCount,
  } = useContext(Context);
  const [loadedImages, setLoadedImages] = useState({});
  const handleImageLoad = (uuid) => {
    setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
  };
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const isMobile = useIsMobile();

  const calculateLimit = () => {
    const viewportHeight = window.innerHeight;
    const itemHeight = 170; // adjust if needed
    const rowsVisible = Math.ceil(viewportHeight / itemHeight);
    const columns = getColumnCount(); // depending on screen size (see below)
    return rowsVisible * 8;
  };

  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width < 576) return 2; // xs
    if (width < 768) return 3; // sm
    if (width < 992) return 4; // md
    if (width < 1200) return 5; // lg
    if (width < 1600) return 6; // xl
    return 8; // xxl
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
      if (chatHasMore && currentWidth > prevWidth) {
        setChatData([]);
        setChatLastEvaluatedKey(null);
        setChatInitialLoad(true);
        updateLimit();
      }
      prevWidth = currentWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [chatHasMore]);

  useEffect(() => {
    if (scrollableDivRef.current && !loading && !chatLoading) {
      requestAnimationFrame(() => {
        if (scrollableDivRef.current) {
          scrollableDivRef.current.scrollTo(0, chatScrollPosition);
        }
      });
    }
  }, [chatScrollPosition, loading, chatData, chatLoading]);

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

  const handleMenuClick = async (e, index) => {
    try {
      setChatScrollPosition(scrollableDivRef.current.scrollTop);
      e.domEvent.preventDefault();
      e.domEvent.stopPropagation();
      // This will give you the key of the clicked item
      setMenuLoading(true);
      const clickedItemKey = e.key;
      let userIds = chatData[index].conversationId.split("#");
      userIds.splice(1, 1);
      let userId2;
      for (let userId of userIds) {
        if (user.userId !== userId) {
          userId2 = userId;
          break;
        }
      }
      if (clickedItemKey === "1") {
        const result = await callApi(
          `https://api.reusifi.com/prod/blockUserNew?block=${true}&userId1=${encodeURIComponent(
            user.userId
          )}&userId2=${encodeURIComponent(
            userId2
          )}&productId=${encodeURIComponent(chatData[index].productId)}`,
          "GET"
        );
        setChatData((prevValue) => {
          return prevValue.map((item) => {
            if (item.conversationId === chatData[index].conversationId) {
              return { ...item, blocked: true };
            }
            return item;
          });
        });
        message.success("User blocked");
      } else {
        const result = await callApi(
          `https://api.reusifi.com/prod/deleteChat?deleteChat=${true}&userId1=${encodeURIComponent(
            user.userId
          )}&userId2=${encodeURIComponent(
            userId2
          )}&productId=${encodeURIComponent(chatData[index].productId)}`,
          "GET"
        );
        setChatData((prevValue) => {
          return prevValue.map((item) => {
            if (item.conversationId === chatData[index].conversationId) {
              return { ...item, deleted: true };
            }
            return item;
          });
        });
        message.success("Chat deleted");
      }
      const getChatsReadPromise = callApi(
        `https://api.reusifi.com/prod/getChatsRead?userId1=${encodeURIComponent(
          user.userId
        )}&userId2=${encodeURIComponent(userId2)}&productId=${
          chatData[index].productId
        }&read=${encodeURIComponent(true)}`,
        "GET"
      );
      const getChatCountPromise = callApi(
        `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
          user.userId
        )}&count=${encodeURIComponent(true)}`,
        "GET"
      );

      const [chatCount] = await Promise.all([
        getChatCountPromise,
        getChatsReadPromise,
      ]);
      setUnreadChatCount(chatCount.data.count);
      setChatData((chatData) => {
        return chatData.map((item) => {
          let conversationId = [user.userId, userId2]
            .sort()
            .join(`#${chatData[index].productId}#`);
          if (item.conversationId === conversationId) {
            return { ...item, read: "true" };
          }
          return item;
        });
      });
      setMenuLoading(false);
    } catch (err) {
      setMenuLoading(false);
      if (isModalVisibleRef.current) {
        return;
      }
      isModalVisibleRef.current = true;
      if (err?.status === 401) {
        Modal.error({
          ...errorSessionConfig,
          content: err.message + "chat menu",
        });
      } else {
        Modal.error(errorConfig);
      }
      return;
    }
  };

  const handleMenuClickUnblock = async (e, index) => {
    try {
      setChatScrollPosition(scrollableDivRef.current.scrollTop);
      setMenuLoading(true);
      e.domEvent.preventDefault();
      e.domEvent.stopPropagation();
      const clickedItemKey = e.key;
      let userIds = chatData[index].conversationId.split("#");
      userIds.splice(1, 1);
      let userId2;
      for (let userId of userIds) {
        if (user.userId !== userId) {
          userId2 = userId;
          break;
        }
      }
      if (clickedItemKey === "1") {
        const result = await callApi(
          `https://api.reusifi.com/prod/unBlockUser?unBlock=${true}&userId1=${encodeURIComponent(
            user.userId
          )}&userId2=${encodeURIComponent(
            userId2
          )}&productId=${encodeURIComponent(chatData[index].productId)}`,
          "GET"
        );
        setChatData((prevValue) => {
          return prevValue.map((item) => {
            if (item.conversationId === chatData[index].conversationId) {
              return { ...item, blocked: false };
            }
            return item;
          });
        });
        message.success("User unblocked");
      } else {
        const result = await callApi(
          `https://api.reusifi.com/prod/deleteChat?deleteChat=${true}&userId1=${encodeURIComponent(
            user.userId
          )}&userId2=${encodeURIComponent(
            userId2
          )}&productId=${encodeURIComponent(chatData[index].productId)}`,
          "GET"
        );
        setChatData((prevValue) => {
          return prevValue.map((item) => {
            if (item.conversationId === chatData[index].conversationId) {
              return { ...item, deleted: true };
            }
            return item;
          });
        });
        message.success("Chat deleted");
      }
      setMenuLoading(false);
    } catch (err) {
      setMenuLoading(false);
      if (isModalVisibleRef.current) {
        return;
      }
      isModalVisibleRef.current = true;
      if (err?.status === 401) {
        Modal.error({
          ...errorSessionConfig,
          content: err.message + "chat unblock",
        });
      } else {
        Modal.error(errorConfig);
      }
      return;
    }
  };
  const menu = (index) => {
    return (
      <Menu
        onClick={(event) => {
          handleMenuClick(event, index);
        }}
      >
        {menuItems.map((item) => (
          <Menu.Item key={item.key} danger={item.danger}>
            {item.label}
          </Menu.Item>
        ))}
      </Menu>
    );
  };
  const formatTimeStamp = (timestamp) => {
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    // Combine into a human-readable string
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
  };

  function formatChatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return timeString;
    if (isYesterday) return `Yesterday ${timeString}`;

    return `${day}/${month}/${year} ${timeString}`;
  }

  const menuBlocked = (index) => {
    return (
      <Menu
        onClick={(event) => {
          handleMenuClickUnblock(event, index);
        }}
      >
        {menuItemsBlocked.map((item) => (
          <Menu.Item key={item.key} danger={item.danger}>
            {item.label}
          </Menu.Item>
        ))}
      </Menu>
    );
  };
  const getChats = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      const result = await callApi(
        `https://api.reusifi.com/prod/getChatsNew?userId1=${encodeURIComponent(
          user.userId
        )}&lastEvaluatedKey=${encodeURIComponent(
          chatLastEvaluatedKey
        )}&limit=${encodeURIComponent(limit)}`,
        "GET"
      );
      setChatData([...chatData, ...result.data.items]);
      setChatLastEvaluatedKey(result.data.lastEvaluatedKey);
      // If no more data to load, set hasMore to false
      setLoading(false);
      if (!result.data.lastEvaluatedKey) {
        setChatHasMore(false);
      } else {
        setChatHasMore(true);
      }
      setChatScrollPosition(scrollPosition);
      setChatInitialLoad(false);
    } catch (err) {
      setLoading(false);
      // message.error("An Error has occurred")
      if (isModalVisibleRef.current) {
        return;
      }
      isModalVisibleRef.current = true;
      if (err?.status === 401) {
        Modal.error(errorSessionConfig);
      } else {
        Modal.error(errorConfig);
      }
      return;
    }
  };
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.userId && chatInitialLoad && limit) {
      try {
        setChatLoading(true);
        setLoading(true);
        const getChatCount = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );

        const getChatsPromise = getChats();

        Promise.all([getChatCount, getChatsPromise])
          .then(([chatResult]) => {
            setUnreadChatCount(chatResult.data.count);
          })
          .catch((err) => {
            if (isModalVisibleRef.current) {
              return;
            }
            isModalVisibleRef.current = true;
            if (err?.status === 401) {
              Modal.error(errorSessionConfig);
            } else {
              Modal.error(errorConfig);
            }
            console.error(err);
          })
          .finally(() => {
            setChatLoading(false);
            setLoading(false);
          });
      } catch (err) {
        // message.error("An Error has occurred")
        if (isModalVisibleRef.current) {
          return;
        }
        isModalVisibleRef.current = true;
        if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
        return;
      }
    }
  }, [user, chatInitialLoad, limit]);

  return (
    <Layout
      style={{
        height: "100dvh",
        overflow: "hidden",
        background: "#F9FAFB",
      }}
    >
      {!isMobile && (
        <HeaderWrapper
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0px",
            height: "50px",
          }}
        >
          <MenuWrapper
            setScrollPosition={setChatScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={["2"]}
            isMobile={isMobile}
          />
        </HeaderWrapper>
      )}
      <Content>
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
            style={{
              overflowX: "hidden",
              background: "#F9FAFB",
            }}
            dataLength={chatData.length}
            next={() => {
              getChats();
            }}
            hasMore={chatHasMore}
            scrollableTarget="scrollableDiv"
          >
            {!loading && !chatLoading && user && chatData.length > 0 && (
              <List
                grid={{
                  xs: 1,
                  sm: 1,
                  md: 1,
                  lg: 1,
                  xl: 1,
                  xxl: 1,
                  gutter: 10,
                }}
                dataSource={chatData}
                renderItem={(item, index) => {
                  if (item.deleted) {
                    return null;
                  }
                  return (
                    <>
                      <List.Item key={item.timestamp}>
                        <Card
                          style={{
                            borderRadius: "12px",
                            // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            height: "150px",
                            width: !isMobile ? "50vw" : "calc(100dvw - 10px)",
                            backgroundColor:
                              item.read === "false" ? "#f6ffed" : "#ffffff",
                          }}
                          onClick={() => {
                            if (item.blocked) {
                              message.info(
                                "You have blocked this user, unblock to chat"
                              );
                            } else {
                              setChatScrollPosition(
                                scrollableDivRef.current.scrollTop
                              );
                              navigate("/chat", {
                                state: {
                                  conversationId: item.conversationId,
                                  productId: item.productId,
                                },
                              });
                            }
                          }}
                          key={item.conversationId}
                          title={
                            <Row>
                              <Col
                                span={22}
                                style={{
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                  overflow: "hidden",
                                  paddingRight: "70px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "15px",
                                    fontWeight: "300",
                                  }}
                                >
                                  {capitalize(item.title)}
                                </span>
                              </Col>
                              <Col>
                                {!item.blocked && (
                                  <Dropdown
                                    overlay={menu(index)}
                                    trigger={["click"]}
                                    placement="bottomRight"
                                  >
                                    <a
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Space>
                                        <EllipsisVertical
                                          style={{
                                            color: "grey",
                                            scale: "0.9",
                                          }}
                                        />
                                      </Space>
                                    </a>
                                  </Dropdown>
                                )}
                                {item.blocked && (
                                  <Dropdown
                                    overlay={menuBlocked(index)}
                                    trigger={["click"]}
                                    placement="bottomRight"
                                  >
                                    <a
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Space>
                                        <EllipsisVertical
                                          style={{
                                            color: "grey",
                                            scale: "0.9",
                                          }}
                                        />
                                      </Space>
                                    </a>
                                  </Dropdown>
                                )}
                              </Col>
                            </Row>
                          }
                          bordered
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                  overflow: "hidden",
                                  maxWidth: isMobile ? "50dvw" : "30dvw",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                {item.read === "false" && (
                                  <span
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      backgroundColor: "#ff4d4f",
                                      display: "inline-block",
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight:
                                      item.read === "false" ? "600" : "300",
                                  }}
                                >
                                  {item.message}
                                </span>
                              </div>
                              <div style={{ fontSize: "10px" }}>
                                {formatChatTimestamp(item.timestamp)}{" "}
                              </div>
                            </div>
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "50px",
                                height: "60px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {!loadedImages[item.productId] && (
                                <div
                                  style={{
                                    width: "50px",
                                    height: "60px",
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
                                          color: "#52c41a",
                                        }}
                                        spin
                                      />
                                    }
                                  />
                                </div>
                              )}
                              <Image
                                preview={true}
                                src={item.image}
                                alt={item.title}
                                style={{
                                  display: loadedImages[item.productId]
                                    ? "block"
                                    : "none",
                                  height: "60px",
                                  objectFit: "contain",
                                  borderRadius: "5px",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                onLoad={() => handleImageLoad(item.productId)}
                                onError={() => handleImageLoad(item.productId)}
                              />
                            </div>
                          </div>
                        </Card>
                      </List.Item>
                    </>
                  );
                }}
              />
            )}
            {(loading || chatLoading) && (
              <Skeleton
                paragraph={{
                  rows: 4,
                }}
                active
              />
            )}
            {chatData.length === 0 && !loading && !chatLoading && (
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
            )}
          </InfiniteScroll>
        </div>
      </Content>
      {isMobile && (
        <FooterWrapper>
          <MenuWrapper
            setScrollPosition={setChatScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={["2"]}
            isMobile={isMobile}
          />
        </FooterWrapper>
      )}
      {menuLoading && (
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

export default ChatPage;
