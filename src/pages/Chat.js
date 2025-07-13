import React, { useEffect, useState, useRef, useContext, useLayoutEffect } from "react";
import { Col, message, Row, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Select, Badge } from "antd";
import { Breadcrumb, Layout, Menu, theme , Modal} from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import { Button } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import { Divider, List, Typography } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Skeleton, Space } from "antd";
import { Context } from "../context/provider";
import { Empty } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  ProductFilled,
  MailOutlined,
  HeartOutlined,
  MailFilled,
  HeartFilled,
  LogoutOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import testSpeed from "../helpers/internetSpeed";
import { useIsMobile } from "../hooks/windowSize";
import { useSessionCheck } from "../hooks/sessionCheck";
const { TextArea } = Input;
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "My Ads",
  "Contact",
  "Favourites",
  "SignOut",
];
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
  const [speed, setSpeed] = useState(0);
  const { Text, Link } = Typography;
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
  const sendMessage = (message, recipientUserId, senderUserId,productId) => {
    try {
      if (ws) {
        ws.send(
          JSON.stringify({
            action: "sendMessage",
            recipientUserId: recipientUserId,
            senderUserId: senderUserId,
            productId: productId,
            message: message,
          })
        );
      }
    } catch (err) {
      setReconnect((reconnect) => !reconnect);
    }
  };
  const {
    setInitialLoad,
    data,
    chatData,
    setChatInitialLoad,
    setHomeInitialLoad,
    setAdInitialLoad,
    adData,
    setFavData,
    setFavInitialLoad,
    setAdData,
    setChatPageInitialLoad,
    setAdPageInitialLoad,
    setFavPageInitialLoad,
    setFavLastEvaluatedKey,
    setAdLastEvaluatedKey,
    setChatData,
    setChatLastEvaluatedKey,
    setContactInitialLoad,
    setAddProductInitialLoad,
    iChatInitialLoad,
    setIChatInitialLoad,
    unreadChatCount,
    setUnreadChatCount
  } = useContext(Context);
  const [chatLoading, setChatLoading] = useState(false);
  const { token } = useSessionCheck()
   
     const errorSessionConfig = {
  title: 'Session has expired.',
  content: 'Please login again.',
  okButtonProps: { style: { display: 'none' } },
  closable: false,
  maskClosable: false,
}
         const errorConfig = {
  title: 'An error has occurred.',
  content: 'Please try again later.',
  okButtonProps: { style: { display: 'none' } },
  closable: false,
  maskClosable: false,
}

   const calculateLimit = () => {
                  const viewportHeight = window.innerHeight;
                  const itemHeight = 70; // adjust if needed
                  const rowsVisible = Math.ceil(viewportHeight / itemHeight);
                  const columns = getColumnCount(); // depending on screen size (see below)
                  return rowsVisible * 2;
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
                  const updateLimit = () => {
                    const newLimit = calculateLimit();
                    setLimit(newLimit);
                  };
                  updateLimit(); // on mount
                  const handleResize = () => {
                    if (hasMore) {
                      setIChatData([])
                      setLastEvaluatedKey(null)
                      setIChatInitialLoad(true)
                      updateLimit();
                    }
                  };
                  window.addEventListener("resize",handleResize);
                  return () => window.removeEventListener("resize", handleResize);
                }, [hasMore]);

 useEffect(() => {
  if(!chatLoading){
    setUnreadChatCount((prevValue) => Math.max(prevValue - 1, 0))
  }

 },[chatLoading]) 

  
    const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    MailFilled,
    HeartFilled,
    LogoutOutlined,
  ].map((icon, index) => {
    if (index === 2) {
      return {
        key: String(index + 1),
        icon: (
          <Badge overflowCount={999} count={unreadChatCount}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
              <span style={{ fontSize: '16px', marginTop: '0px' }}>{React.createElement(icon)}</span>
              <span style={{ fontSize: '10px', marginTop: '5px' }}>{IconText[index]}</span>
            </div>
          </Badge>
        )
      };
    }
     return {
      key: String(index + 1),
      icon: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
        <span style={{ fontSize: '16px', marginTop: '0px' }}>{React.createElement(icon)}</span>
        <span style={{ fontSize: '10px', marginTop: '5px' }}>{IconText[index]}</span>
      </div>
    )
    };
  });
  
  useEffect(() => {
    if (data.length > 0) {
      setInitialLoad(false);
    } else {
      setInitialLoad(true);
    }
  }, []);

  useEffect(() => {
    let socket;
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        socket = new WebSocket(
          `wss://d33iiy9qcb0yoj.cloudfront.net/production?userId=${currentUser.userId}&productId=${productId || recipient["item"]["uuid"]}`
        );
        setWs(socket);
        socket.onopen = () => {
          console.log("Connected to the WebSocket");
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
              productId: data.productId
            },
            ...prevValue,
          ]);
          await axios.get(
            `https://dwo94t377z7ed.cloudfront.net/prod/getChatsRead?userId1=${
              encodeURIComponent(data.recipientUserId)
            }&userId2=${encodeURIComponent(data.senderUserId)}&read=${encodeURIComponent(true)}`,
            { headers: { Authorization: token } }
          );
        };
        // To close the connection
        socket.onclose = () => {
          console.log("Disconnected from WebSocket");
        };
      } catch (err) {
        // message.error("An Error has occurred")
         if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
        console.log("Error fetching user", err);
      }
    };
    if(token){
      fetchUser();
    }
    return () => {
      if(socket){
        socket.close();
      }
    };
  }, [reconnect,token]);

  const getChats = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let result;
      let readRes
      if (recipient && recipient["item"]["email"]) {
        [result, readRes] = await Promise.all([axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getChatsConversation?userId1=${encodeURIComponent(user.userId)}&userId2=${encodeURIComponent(recipient["item"]["email"])}&productId=${encodeURIComponent(recipient["item"]["uuid"])}&lastEvaluatedKey=${encodeURIComponent(lastEvaluatedKey)}&limit=${encodeURIComponent(limit)}`,
          { headers: { Authorization: token } }
        ),axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getChatsRead?userId1=${
            encodeURIComponent(user.userId)
          }&userId2=${encodeURIComponent(recipient["item"]["email"])}&productId=${encodeURIComponent(recipient["item"]["uuid"])}&read=${encodeURIComponent(true)}`,
          { headers: { Authorization: token } }
        )])
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
        userIds.splice(1,1)
        let userId2;
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId;
            break;
          }
        }
        [result, readRes] = await Promise.all([axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getChatsConversation?userId1=${encodeURIComponent(user.userId)}&userId2=${encodeURIComponent(userId2)}&productId=${encodeURIComponent(productId)}&lastEvaluatedKey=${encodeURIComponent(lastEvaluatedKey)}&limit=${encodeURIComponent(limit)}`,
          { headers: { Authorization: token } }
        ),axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getChatsRead?userId1=${
            encodeURIComponent(user.userId)
          }&userId2=${encodeURIComponent(userId2)}&productId=${encodeURIComponent(productId)}&read=${encodeURIComponent(true)}`,
          { headers: { Authorization: token } }
        )])
        setChatData((chatData) => {
          return chatData.map((item) => {
            let conversationId = [user.userId, userId2].sort().join(`#${productId}#`);
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
      }
      else{
         setHasMore(false);
      }
      setLoading(false);
      setScrollPosition(scrollPosition);
      setIChatInitialLoad(false)
    } catch (err) {
      setLoading(false);
       if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
      console.log(err);
    }
  };

  useEffect(() => {
    if (chatData.length > 0) {
      setChatInitialLoad(false);
    } else {
      setChatInitialLoad(true);
    }
  }, []);

  useEffect(() => {
  if (user && user.userId && token && limit && iChatInitialLoad && ((recipient && recipient["item"]["email"]) || conversationId)) {
    try{
          setChatLoading(true);
    setLoading(true);

    const getChatCount = axios.get(
      `https://dwo94t377z7ed.cloudfront.net/prod/getChatsCount?userId1=${encodeURIComponent(user.userId)}&count=${encodeURIComponent(true)}`,
      { headers: { Authorization: token } }
    );

    const getChat = getChats()


    Promise.all([getChatCount, getChat])
      .then(([chatResult]) => {
        setUnreadChatCount(chatResult.data.count);
      })
      .catch((err) => {
           if(err?.status === 401){
                Modal.error(errorSessionConfig)
              }
              else{
                Modal.error(errorConfig)
              }
        console.error(err);
      })
      .finally(() => {
        setChatLoading(false);
        setLoading(false);
      });
    }
    catch(err){
       if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
    }
  }
}, [user, token, iChatInitialLoad,limit,conversationId,recipient]);

  useEffect(() => {
    if (
      token && user && limit &&
      user.userId &&
      ((recipient && recipient["item"]["email"]) || conversationId) && !iChatInitialLoad
    ) {
      getChats();
    }
  }, [user, recipient, conversationId,token,limit]);

  const handleNavigation = (event) => {
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
        navigate("/contact");
        break;
      case "6":
        navigate("/favourite");
        break;
      case "7":
        signOut();
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
      if(scrollableDivRef.current && !loading && !chatLoading)
      requestAnimationFrame(() => {
          scrollableDivRef.current.scrollTo(0, scrollPosition);
          setScrollLoadMoreData(false)
      });
    }, [scrollPosition,loading,scrollLoadMoreData,ichatData,chatLoading]);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const handleChange = (value) => {
    setMessageValue(value.target.value);
  };
  const handleSubmit = () => {
    if (messageValue) {
      if (recipient && recipient["item"]["email"]) {
        sendMessage(messageValue, recipient["item"]["email"], user.userId,recipient["item"]["uuid"]);
        setChatData((chatData) => {
          return chatData.map((item) => {
            let conversationId = [user.userId, recipient["item"]["email"]]
              .sort()
              .join(`#${recipient["item"]["uuid"]}#`);
            if (item.conversationId === conversationId) {
              return { ...item, message: messageValue };
            }
            return item;
          });
        });
      } else if (conversationId) {
        let userIds = conversationId.split("#");
        userIds.splice(1,1)
        let userId2;
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId;
            break;
          }
        }
        sendMessage(messageValue, userId2, user.userId, productId);
        setChatData((chatData) => {
          return chatData.map((item) => {
            if (item.conversationId === conversationId) {
              return { ...item, message: messageValue };
            }
            return item;
          });
        });
      }
      setIChatData((prevValue) => [
        { message: messageValue, timestamp: Date.now(), senderId: user.userId, productId: productId },
        ...prevValue,
      ]);
    }
    setMessageValue("");
  };

  const isMobile = useIsMobile()

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
    <Layout style={{ height: "100dvh", overflow: "hidden", background: "#F9FAFB", }}>
      
         {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px', height: '50px' }}>
                    <Menu
                      onClick={(event) => handleNavigation(event)}
                      theme="dark"
                      mode="horizontal"
                      defaultSelectedKeys={["0"]}
                      items={items}
                      style={{ minWidth: 0, justifyContent: 'space-around',
            flex: 1,background: "#6366F1" }}
                    />
                  </Header>}
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
              getChats()
              setScrollLoadMoreData(true);
            }}
            hasMore={hasMore}
            inverse
            scrollableTarget="scrollableDiv"
          >
            {!loading && !chatLoading && user && (
              <>
                <div ref={bottomRef} />
                {ichatData.map((item) => {
                  if (item.senderId === user.userId) {
                    return (
                      <div
                        key={item.timestamp}
                        style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}
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
                          <div style={{ display: "flex", justifyContent: "end" }}>
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
                        style={{ display: "flex", justifyContent: "flex-start", padding: "10px" }}
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
            {(loading || chatLoading) && 
             <Skeleton
                paragraph={{
                  rows: 4,
                }}
                active
              />
            }
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
          autoSize={{ minRows: 1, maxRows: 1 }}
          onChange={(value) => handleChange(value)}
          placeholder="Enter message"
          value={messageValue}
        />
        <Button style={{ background: '#10B981' }} type="primary" onClick={() => handleSubmit()}>
          send
        </Button>
      </Space.Compact>
      {isMobile && <Footer
        style={{
          position: "fixed",
          bottom: 0,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0px",
          width: "100vw",
          height: '50px'
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
            justifyContent: 'space-around',
            flex: 1,
            minWidth: 0,background: "#6366F1"
          }}
        />
      </Footer>}
    </Layout>
  );
};
export default Chat;
