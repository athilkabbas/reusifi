import React, { useEffect, useState, useRef, useContext } from "react";
import { Col, message, Row, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Select, Badge } from "antd";
import { Breadcrumb, Layout, Menu, theme, Modal } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import { Button } from "antd";
import axios from "axios";
import { getCurrentUser, signIn, signOut } from "@aws-amplify/auth";
import { Divider, List, Typography } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { hashString } from "react-hash-string";
import { Card, Skeleton } from "antd";
import { Dropdown, Space } from "antd";
import { DownOutlined, SmileOutlined } from "@ant-design/icons";
import { Context } from "../context/provider";
import { Empty } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  MenuOutlined,
  MailFilled,
  HeartFilled,
  HeartOutlined,
  MailOutlined,
  ProductFilled,
  LoadingOutlined
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "../hooks/windowSize";
import { useTokenRefresh } from "../hooks/refreshToken";
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
const { Header, Content, Footer } = Layout;
const ChatPage = () => {
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const scrollableDivRef = useRef(null);
  const handleNavigation = (event) => {
    setChatScrollPosition(scrollableDivRef.current.scrollTop);
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
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [chatLoading, setChatLoading] = useState(false);
  const {
    setInitialLoad,
    data,
    chatScrollPosition,
    setChatScrollPosition,
    chatInitialLoad,
    setChatInitialLoad,
    chatData,
    setChatData,
    setHomeInitialLoad,
    setAdInitialLoad,
    adData,
    setFavData,
    setAdData,
    setFavInitialLoad,
    setAdPageInitialLoad,
    setFavPageInitialLoad,
    chatPageInitialLoad,
    setChatHasMore,
    chatHasMore,
    chatLastEvaluatedKey,
    setFavLastEvaluatedKey,
    setChatLastEvaluatedKey,
    setAdLastEvaluatedKey,
    setContactInitialLoad,
    setIChatInitialLoad,
    setAddProductInitialLoad,
    unreadChatCount,
    setUnreadChatCount
  } = useContext(Context);

    const token = useTokenRefresh()

          const calculateLimit = () => {
                const viewportHeight = window.innerHeight;
                const itemHeight = 170; // adjust if needed
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
                    if (chatHasMore) {
                      setChatData([])
                      setChatLastEvaluatedKey(null)
                      setChatInitialLoad(true)
                      updateLimit();
                    }
                  };
                  window.addEventListener("resize",handleResize);
                  return () => window.removeEventListener("resize", handleResize);
                }, [chatHasMore]);
              
              

    //  useEffect(() => {
    //       if (scrollableDivRef.current  &&  !loading && !chatLoading) {
    //         const el = scrollableDivRef.current;
    //         if (el.scrollHeight <= el.clientHeight && chatHasMore && limit) {
    //           getChats();
    //         }
    //       }
    //     }, [loading,chatData,chatLoading,limit]); 

      useEffect(() => {
      if (scrollableDivRef.current &&  !loading && !chatLoading) {
        requestAnimationFrame(() => {
          scrollableDivRef.current.scrollTo(0, chatScrollPosition);
          setScrollLoadMoreData(false);
        });
      }
    }, [chatScrollPosition,loading,scrollLoadMoreData,chatData,chatLoading]);

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

    const errorSessionConfig = {
      title: 'Session has expired.',
      content: 'Please login again.',
      closable: false,
      maskClosable: false,
      okText: 'Login',
      onOk: () => {
        signIn()
      }
    }
      const errorConfig = {
  title: 'An error has occurred.',
  content: 'Please try again later.',
  closable: false,
  maskClosable: false,
  okText: 'Close',
  onOk: () => {
    navigate('/')
  }
}

  const handleMenuClick = async (e, index) => {
    try {
      setChatScrollPosition(scrollableDivRef.current.scrollTop);
      e.domEvent.preventDefault();
      e.domEvent.stopPropagation();
      // This will give you the key of the clicked item
      setLoading(true);
      const clickedItemKey = e.key;
      let userIds = chatData[index].conversationId.split("#");
      let userId2;
      for (let userId of userIds) {
        if (user.userId !== userId) {
          userId2 = userId;
          break;
        }
      }
      if (clickedItemKey === "1") {
        const result = await axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/blockUserNew?block=${true}&userId1=${
            encodeURIComponent(user.userId)
          }&userId2=${encodeURIComponent(userId2)}&productId=${encodeURIComponent(chatData[index].productId)}`,
          { headers: { Authorization: token } }
        );
        setChatData((prevValue) => {
          return prevValue.map((item) => {
              if(item.conversationId === chatData[index].conversationId){
                  return {...item, blocked: true}
              }
              return item
          })
        })
      } else {
        const result = await axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/deleteChat?deleteChat=${true}&userId1=${
            encodeURIComponent(user.userId)
          }&userId2=${encodeURIComponent(userId2)}&productId=${encodeURIComponent(chatData[index].productId)}`,
          { headers: { Authorization: token } }
        );
        setChatData((prevValue) => {
          return prevValue.map((item) => {
              if(item.conversationId === chatData[index].conversationId){
                  return {...item, deleted: true}
              }
              return item
          })
        })
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
       if(err?.status === 401){
              Modal.error(errorSessionConfig)
        }
        else{
          message.error("An Error has occurred")
        }
      console.log(err);
    }
  };

  const handleMenuClickUnblock = async (e, index) => {
    try {
      setChatScrollPosition(scrollableDivRef.current.scrollTop);
      setLoading(true);
      e.domEvent.preventDefault();
      e.domEvent.stopPropagation();
      const clickedItemKey = e.key;
      let userIds = chatData[index].conversationId.split("#");
      let userId2;
      for (let userId of userIds) {
        if (user.userId !== userId) {
          userId2 = userId;
          break;
        }
      }
      if (clickedItemKey === "1") {
        const result = await axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/unBlockUser?unBlock=${true}&userId1=${
            encodeURIComponent(user.userId)
          }&userId2=${encodeURIComponent(userId2)}&productId=${encodeURIComponent(chatData[index].productId)}`,
          { headers: { Authorization: token } }
        );
        setChatData((prevValue) => {
          return prevValue.map((item) => {
              if(item.conversationId === chatData[index].conversationId){
                  return {...item, blocked: false}
              }
              return item
          })
        })
      } else {
        const result = await axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/deleteChat?deleteChat=${true}&userId1=${
            encodeURIComponent(user.userId)
          }&userId2=${encodeURIComponent(userId2)}&productId=${encodeURIComponent(chatData[index].productId)}`,
          { headers: { Authorization: token } }
        );
        setChatData((prevValue) => {
          return prevValue.map((item) => {
              if(item.conversationId === chatData[index].conversationId){
                  return {...item, deleted: true}
              }
              return item
          })
        })
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
       if(err?.status === 401){
              Modal.error(errorSessionConfig)
        }
        else{
          message.error("An Error has occurred")
        }
      console.log(err);
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
      const result = await axios.get(
        `https://dwo94t377z7ed.cloudfront.net/prod/getChatsNew?userId1=${encodeURIComponent(user.userId)}&lastEvaluatedKey=${encodeURIComponent(chatLastEvaluatedKey)}&limit=${encodeURIComponent(limit)}`,
        { headers: { Authorization: token } }
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
      setChatInitialLoad(false)
    } catch (err) {
      setLoading(false);
      // message.error("An Error has occurred")
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
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

useEffect(() => {
  if (user && user.userId && chatInitialLoad && token && limit) {
    try{
    setChatLoading(true);
    setLoading(true);

    const getChatCount = axios.get(
      `https://dwo94t377z7ed.cloudfront.net/prod/getChatsCount?userId1=${encodeURIComponent(user.userId)}&count=${encodeURIComponent(true)}`,
      { headers: { Authorization: token } }
    );

    const getChatsPromise = getChats()


    Promise.all([getChatCount, getChatsPromise])
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
      // message.error("An Error has occurred")
       if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
    }
  }
}, [user, token, chatInitialLoad,limit]);

  const isMobile = useIsMobile()
  return (
    <Layout style={{ height: "100dvh", overflow: "hidden" }}>
      
       {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px', height: '50px' }}>
              <Menu
                onClick={(event) => handleNavigation(event)}
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={["3"]}
                items={items}
                style={{ minWidth: 0, justifyContent: 'space-around',
            flex: 1,background: "#6366F1" }}
              />
            </Header>}
      <Content style={{ padding: "0 15px" }}>
        <div
         className="hide-scrollbar overflow-auto"
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            background: "#F9FAFB",
            borderRadius: "0px",
            overflow: "scroll",
            height: "100%",
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
              setScrollLoadMoreData(true);
              getChats();
            }}
            hasMore={chatHasMore}
            scrollableTarget="scrollableDiv"
          >
            {!loading &&
              !chatLoading &&
              user &&
              chatData.map((item, index) => {
                if(item.deleted){
                  return null
                }
                return (
                  <Row key={item.timestamp} style={{ padding: "10px" }}>
                    <Col span={24}>
                      <Badge dot={item.read === "false" ? true : false}>
                        <Card
                          style={{
                            height: "150px",
                            width: !isMobile ? "50vw" : "calc(100vw - 50px)",
                          }}
                          onClick={() => {
                            if (item.blocked) {
                              message.info("You have blocked this user")
                            } else {
                              setChatScrollPosition(
                                scrollableDivRef.current.scrollTop
                              );
                              navigate("/chat", {
                                state: { conversationId: item.conversationId, productId: item.productId },
                              });
                            }
                          }}
                          key={hashString(item.conversationId)}
                          title={
                            <Row>
                              <Col span={22}>
                                {hashString(item.conversationId)
                                  .toString()
                                  .slice(1)}
                              </Col>
                              <Col>
                                {!item.blocked && (
                                  <Dropdown overlay={menu(index)} trigger={['click']}>
                                    <a
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Space>
                                        <MenuOutlined />
                                      </Space>
                                    </a>
                                  </Dropdown>
                                )}
                                {item.blocked && (
                                  <Dropdown overlay={menuBlocked(index)} trigger={['click']}>
                                    <a
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Space>
                                        <MenuOutlined />
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
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            {item.message}
                          </div>
                          <div style={{ fontSize: "10px" }}>
                            {formatChatTimestamp(item.timestamp)}{" "}
                          </div>
                        </Card>
                      </Badge>
                    </Col>
                  </Row>
                );
              })}
            {(loading || chatLoading) && 
            <Skeleton
              paragraph={{
                rows: 4,
              }}
              active
            />
            }
            {
              chatData.length === 0 && !loading && !chatLoading && 
              (<div
                  style={{
                    height: "50vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Empty description="No items found" />
                </div>)
            }
          </InfiniteScroll>
        </div>
      </Content>
      {isMobile && <Footer
        style={{
          position: "fixed",
          bottom: 0,
          zIndex: 1,
          width: "100vw",
          display: "flex",
          alignItems: "center",
          height: '50px',
          padding: "0px",
        }}
      >
        <div className="demo-logo" />
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["3"]}
          items={items}
          style={{
            minWidth: 0,background: "#6366F1",
            justifyContent: 'space-around',
            flex: 1
          }}
        />
      </Footer>}
    </Layout>
  );
};

export default ChatPage;
