import React, { useEffect, useState, useRef, useContext } from "react";
import { Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Badge } from "antd";
import { Layout, Menu, Modal } from "antd";
import { Button } from "antd";
import {
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
  signOut,
} from "@aws-amplify/auth";
import InfiniteScroll from "react-infinite-scroll-component";
import { Skeleton, Space, Typography } from "antd";
import { Context } from "../context/provider";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  ProductFilled,
  MailFilled,
  HeartFilled,
  LogoutOutlined,
  LoadingOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
const { TextArea } = Input;
const IconText = ["Home", "Sell", "Chats", "My Ads", "Favourites", ""];
const { Header, Content, Footer } = Layout;
const Chat = () => {
  const [ichatData, setIChatData] = useState([]);
  const location = useLocation();
  const { recipient } = location.state || "";
  const { conversationId, productId } = location.state;
  const [messageValue, setMessageValue] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ws, setWs] = useState("");
  const [reconnect, setReconnect] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const bottomRef = useRef(null); // To reference the bottom of the chat container
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollableDivRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { Text } = Typography;
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
  const sendMessage = (
    message,
    recipientUserId,
    senderUserId,
    productId,
    title,
    image
  ) => {
    try {
      if (ws) {
        ws.send(
          JSON.stringify({
            action: "sendMessage",
            recipientUserId: recipientUserId,
            senderUserId: senderUserId,
            productId: productId,
            message: message,
            title: title,
            image: image,
          })
        );
      }
    } catch (err) {
      setReconnect((reconnect) => !reconnect);
    }
  };
  const {
    setChatInitialLoad,
    setChatData,
    setChatLastEvaluatedKey,
    setIChatInitialLoad,
    unreadChatCount,
    setUnreadChatCount,
  } = useContext(Context);
  const [chatLoading, setChatLoading] = useState(false);
  const [socketLoading, setSocketLoading] = useState(false);
  const textAreaRef = useRef(null);
  const errorSessionConfig = {
    title: "Session has expired.",
    content: "Please login again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: async () => {
      await signInWithRedirect();
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
  const isMobile = useIsMobile();
  const calculateLimit = () => {
    const viewportHeight = window.innerHeight;
    const itemHeight = 70; // adjust if needed
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

  const scrollToBottom = () => {
    setTimeout(() => {
      console.log("athil");
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }, 300);
  };

  useEffect(() => {
    let prevWidth = window.innerWidth;
    let prevHeight = window.innerHeight;
    const updateLimit = () => {
      const newLimit = calculateLimit();
      setLimit(newLimit);
    };

    updateLimit();

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      if (hasMore && currentWidth !== prevWidth) {
        prevWidth = currentWidth;
        setIChatData([]);
        setLastEvaluatedKey(null);
        setIChatInitialLoad(true);
        updateLimit();
      }
      if (currentHeight > prevHeight + 100) {
        textAreaRef.current.blur();
      }
      prevHeight = currentHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasMore]);

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

  // useEffect(() => {
  //   if (data.length > 0) {
  //     setInitialLoad(false);
  //   } else {
  //     setInitialLoad(true);
  //   }
  // }, []);

  useEffect(() => {
    let socket;
    const fetchUser = async () => {
      try {
        setSocketLoading(true);
        let token = "";
        const session = await fetchAuthSession();
        const tokens = session.tokens;

        if (tokens?.idToken) {
          token = tokens.idToken;
        } else {
          const error = new Error("Session expired");
          error.status = 401;
          throw error;
        }

        const currentUser = await getCurrentUser();
        setUser(currentUser);

        socket = new WebSocket(
          `wss://apichat.reusifi.com/production?userId=${
            currentUser.userId
          }&productId=${productId || recipient["item"]["uuid"]}&token=${token}`
        );
        setWs(socket);
        socket.onopen = () => {
          console.log("Connected to the WebSocket");
          setSocketLoading(false);
        };

        socket.onerror = (err) => {
          setSocketLoading(false);
          Modal.error(errorConfig);
        };

        socket.onmessage = async (event) => {
          console.log("Message from server:", event);
          const data = JSON.parse(event.data);
          setIChatData((prevValue) => [
            {
              message: data.message,
              timestamp: data.timestamp,
              recipientId: data.recipientUserId,
              senderId: data.senderUserId,
              productId: data.productId,
            },
            ...prevValue,
          ]);
          await callApi(
            `https://api.reusifi.com/prod/getChatsRead?userId1=${encodeURIComponent(
              data.recipientUserId
            )}&userId2=${encodeURIComponent(data.senderUserId)}&productId=${
              data.productId
            }&read=${encodeURIComponent(true)}`,
            "GET"
          );
          setChatData([]);
          setChatLastEvaluatedKey(null);
          setChatInitialLoad(true);
        };
        // To close the connection
        socket.onclose = () => {
          console.log("Disconnected from WebSocket");
        };
      } catch (err) {
        setSocketLoading(false);
        if (
          err?.name === "NotAuthorizedException" &&
          err?.message?.includes("Refresh Token has expired")
        ) {
          Modal.error(errorSessionConfig);
        } else if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
      }
    };
    if (productId || (recipient && recipient["item"]["uuid"])) {
      fetchUser();
    }
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      } else if (socket && socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => {
          socket.close();
        };
      }
    };
  }, [reconnect, productId, recipient]);

  const getChats = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let result;
      let readRes;
      if (recipient && recipient["item"]["email"]) {
        [result, readRes] = await Promise.all([
          callApi(
            `https://api.reusifi.com/prod/getChatsConversation?userId1=${encodeURIComponent(
              user.userId
            )}&userId2=${encodeURIComponent(
              recipient["item"]["email"]
            )}&productId=${encodeURIComponent(
              recipient["item"]["uuid"]
            )}&lastEvaluatedKey=${encodeURIComponent(
              lastEvaluatedKey
            )}&limit=${encodeURIComponent(limit)}`,
            "GET"
          ),
          callApi(
            `https://api.reusifi.com/prod/getChatsRead?userId1=${encodeURIComponent(
              user.userId
            )}&userId2=${encodeURIComponent(
              recipient["item"]["email"]
            )}&productId=${encodeURIComponent(
              recipient["item"]["uuid"]
            )}&read=${encodeURIComponent(true)}`,
            "GET"
          ),
        ]);
        setChatData((chatData) => {
          return chatData.map((item) => {
            let conversationId = [user.userId, recipient["item"]["email"]]
              .sort()
              .join(`#${recipient["item"]["uuid"]}#`);
            if (item.conversationId === conversationId) {
              return { ...item, read: "true" };
            }
            return item;
          });
        });
      } else if (conversationId) {
        let userIds = conversationId.split("#");
        userIds.splice(1, 1);
        let userId2;
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId;
            break;
          }
        }
        [result, readRes] = await Promise.all([
          callApi(
            `https://api.reusifi.com/prod/getChatsConversation?userId1=${encodeURIComponent(
              user.userId
            )}&userId2=${encodeURIComponent(
              userId2
            )}&productId=${encodeURIComponent(
              productId
            )}&lastEvaluatedKey=${encodeURIComponent(
              lastEvaluatedKey
            )}&limit=${encodeURIComponent(limit)}`,
            "GET"
          ),
          callApi(
            `https://api.reusifi.com/prod/getChatsRead?userId1=${encodeURIComponent(
              user.userId
            )}&userId2=${encodeURIComponent(
              userId2
            )}&productId=${encodeURIComponent(
              productId
            )}&read=${encodeURIComponent(true)}`,
            "GET"
          ),
        ]);
        setChatData((chatData) => {
          return chatData.map((item) => {
            let conversationId = [user.userId, userId2]
              .sort()
              .join(`#${productId}#`);
            if (item.conversationId === conversationId) {
              return { ...item, read: "true" };
            }
            return item;
          });
        });
      }
      setIChatData((prevValue) => [...prevValue, ...result.data.items]);
      setLastEvaluatedKey(result.data.lastEvaluatedKey);
      // If no more data to load, set hasMore to false
      if (result.data.lastEvaluatedKey) {
        setHasMore(true);
      } else {
        setHasMore(false);
      }
      setLoading(false);
      setScrollPosition(scrollPosition);
      setIChatInitialLoad(false);
    } catch (err) {
      setLoading(false);
      if (err?.status === 401) {
        Modal.error(errorSessionConfig);
      } else {
        Modal.error(errorConfig);
      }
      console.log(err);
    }
  };

  // useEffect(() => {
  //   if (chatData.length > 0) {
  //     setChatInitialLoad(false);
  //   } else {
  //     setChatInitialLoad(true);
  //   }
  // }, []);

  useEffect(() => {
    const getChatsAndCount = async () => {
      try {
        setChatLoading(true);
        setLoading(true);

        await getChats();
        const getChatCount = await callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );
        setUnreadChatCount(getChatCount.data.count);
        setChatLoading(false);
        setLoading(false);
      } catch (err) {
        setChatLoading(false);
        setLoading(false);
        if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
      }
    };
    if (
      user &&
      user.userId &&
      limit &&
      ((recipient && recipient["item"]["email"]) ||
        (conversationId && productId))
    ) {
      getChatsAndCount();
    }
  }, [user, limit, conversationId, recipient, productId]);

  // useEffect(() => {
  //   if (
  //     token && user && limit &&
  //     user.userId &&
  //     ((recipient && recipient["item"]["email"]) || conversationId) && !iChatInitialLoad
  //   ) {
  //     getChats();
  //   }
  // }, [user, recipient, conversationId,token,limit]);

  const handleNavigation = async (event) => {
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
        await signOut();
        break;
    }
  };
  // useEffect(() => {
  //   if (scrollableDivRef.current && !loading && !chatLoading) {
  //     const el = scrollableDivRef.current;
  //     if (el.scrollHeight <= el.clientHeight && hasMore && limit) {
  //       getChats();
  //     }
  //   }
  // }, [ichatData,loading,chatLoading,limit]);

  useEffect(() => {
    if (scrollableDivRef.current && !loading && !chatLoading)
      requestAnimationFrame(() => {
        scrollableDivRef.current.scrollTo(0, scrollPosition);
        setScrollLoadMoreData(false);
      });
  }, [scrollPosition, loading, scrollLoadMoreData, ichatData, chatLoading]);

  const handleChange = (value) => {
    setMessageValue(value.target.value);
  };
  const handleSubmit = () => {
    if (messageValue) {
      if (recipient && recipient["item"]["email"]) {
        sendMessage(
          messageValue,
          recipient["item"]["email"],
          user.userId,
          recipient["item"]["uuid"],
          recipient["item"]["title"],
          recipient["images"][0]
        );
        // setChatData((chatData) => {
        //   return chatData.map((item) => {
        //     let conversationId = [user.userId, recipient["item"]["email"]]
        //       .sort()
        //       .join(`#${recipient["item"]["uuid"]}#`);
        //     if (item.conversationId === conversationId) {
        //       return { ...item, message: messageValue };
        //     }
        //     return item;
        //   });
        // });
      } else if (conversationId) {
        let userIds = conversationId.split("#");
        userIds.splice(1, 1);
        let userId2;
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId;
            break;
          }
        }
        sendMessage(messageValue, userId2, user.userId, productId);
        // setChatData((chatData) => {
        //   return chatData.map((item) => {
        //     if (item.conversationId === conversationId) {
        //       return { ...item, message: messageValue };
        //     }
        //     return item;
        //   });
        // });
      }
      setIChatData((prevValue) => [
        {
          message: messageValue,
          timestamp: Date.now(),
          senderId: user.userId,
          productId: productId,
        },
        ...prevValue,
      ]);
      setChatData([]);
      setChatLastEvaluatedKey(null);
      setChatInitialLoad(true);
    }
    setMessageValue("");
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

  return (
    <Layout
      style={{ height: "100dvh", overflow: "hidden", background: "#F9FAFB" }}
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
            defaultSelectedKeys={["0"]}
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
      <Content>
        <div
          className="hide-scrollbar overflow-auto"
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            background: "#F9FAFB",
            borderRadius: "0px",
            overflow: "scroll",
            display: "flex",
            flexDirection: "column-reverse",
            height: !isMobile ? "calc(100% - 120px)" : "100%",
            position: !isMobile ? "relative" : "fixed",
            bottom: !isMobile ? "0px" : "120px",
            width: "100%",
            paddingTop: !isMobile ? "0px" : "120px",
          }}
        >
          <InfiniteScroll
            style={{
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column-reverse",
              background: "#F9FAFB",
            }}
            dataLength={ichatData.length}
            next={() => {
              getChats();
              setScrollLoadMoreData(true);
            }}
            hasMore={hasMore}
            inverse
            scrollableTarget="scrollableDiv"
          >
            {!loading && !chatLoading && user && (
              <>
                {ichatData.map((item) => {
                  if (item.senderId === user.userId) {
                    return (
                      <div
                        key={item.timestamp}
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          padding: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            background: "#E5E7EB",
                            borderRadius: "16px 16px 4px 16px",
                            padding: "10px",
                            maxWidth: "80vw", // prevent it from overflowing
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              wordBreak: "break-word",
                              justifyContent: "end",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {item.message.split("\n").map((line, index) => (
                              <React.Fragment key={index}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                          </div>
                          <div
                            style={{ display: "flex", justifyContent: "end" }}
                          >
                            <Text style={{ fontSize: "10px" }}>
                              {formatChatTimestamp(item.timestamp)}
                            </Text>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={item.timestamp}
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                          padding: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            background: "#E0E7FF",
                            borderRadius: "16px 16px 16px 4px",
                            padding: "10px",
                            maxWidth: "80vw", // prevent overflow
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              wordBreak: "break-word",
                              justifyContent: "start",
                              paddingLeft: "10px",
                            }}
                          >
                            {item.message.split("\n").map((line, index) => (
                              <React.Fragment key={index}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "start",
                              paddingLeft: "10px",
                            }}
                          >
                            <Text style={{ fontSize: "10px" }}>
                              {formatChatTimestamp(item.timestamp)}
                            </Text>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </>
            )}
            {(loading || chatLoading) && (
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
      <Space.Compact
        size="large"
        style={{
          padding: 10,
          position: "fixed",
          bottom: "50px",
          height: "60px",
          width: "calc(100% - 10px)",
        }}
      >
        <TextArea
          ref={textAreaRef}
          autoSize={{ minRows: 1, maxRows: 1 }}
          onChange={(value) => handleChange(value)}
          placeholder="Enter message"
          onFocus={scrollToBottom}
          onBlur={scrollToBottom}
          value={messageValue}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (e.shiftKey || isMobile) {
                return;
              } else {
                e.preventDefault();
                handleSubmit();
              }
            }
          }}
        />
        <Button
          style={{ background: "#10B981" }}
          type="primary"
          onClick={() => handleSubmit()}
        >
          send
        </Button>
      </Space.Compact>
      {isMobile && (
        <Footer
          style={{
            position: "fixed",
            bottom: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0px",
            width: "100vw",
            height: "50px",
          }}
        >
          <div className="demo-logo" />
          <Menu
            onClick={(event) => handleNavigation(event)}
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["0"]}
            items={items}
            style={{
              justifyContent: "space-around",
              flex: 1,
              minWidth: 0,
              background: "#6366F1",
            }}
          />
        </Footer>
      )}
      <div ref={bottomRef} />
      {socketLoading && (
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
export default Chat;
