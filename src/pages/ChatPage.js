import React, { useEffect, useState, useRef, useContext } from "react";
import { Col, message, Row, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Select, Badge } from "antd";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import { Button } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
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
  MailOutlined,
  HeartOutlined,
  ProductFilled,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
const { TextArea } = Input;
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "Ads",
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
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const scrollableDivRef = useRef(null);
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
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
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
  } = useContext(Context);
  useEffect(() => {
    if (scrollableDivRef.current && (!chatInitialLoad || scrollLoadMoreData)) {
      setTimeout(() => {
        scrollableDivRef.current.scrollTo(0, chatScrollPosition);
        setScrollLoadMoreData(false);
      }, 0);
    }
  }, [chatScrollPosition, chatInitialLoad]);

  useEffect(() => {
    setHomeInitialLoad(false);
  }, []);

  useEffect(() => {
    const getChatCount = async () => {
      setChatLoading(true);
      try {
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            user.userId
          }&count=${true}`,
          { headers: { Authorization: "xxx" } }
        );
        setUnreadChatCount(result.data.count);
        if (!result.data.lastEvaluatedKey) {
          setHasMore(false);
        }
        setChatLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (user && chatPageInitialLoad) {
      getChatCount();
    }
  }, [user]);
  const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    MailOutlined,
    HeartOutlined,
    LogoutOutlined,
  ].map((icon, index) => {
    if (index === 2) {
      return {
        key: String(index + 1),
        icon: (
          <Badge overflowCount={999} count={unreadChatCount}>
            {React.createElement(icon)}
          </Badge>
        ),
        label: IconText[index],
      };
    }
    return {
      key: String(index + 1),
      icon: React.createElement(icon),
      label: IconText[index],
    };
  });
  useEffect(() => {
    if (data.length > 0) {
      setInitialLoad(false);
    } else {
      setInitialLoad(true);
    }
  }, []);

  const info = () => {
    messageApi.info("You have blocked this user");
  };

  const handleMenuClick = async (e, index) => {
    try {
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
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/blockUser?block=${true}&userId1=${
            user.userId
          }&userId2=${userId2}`,
          { headers: { Authorization: "xxx" } }
        );
      } else {
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/blockUser?deleteChat=${true}&userId1=${
            user.userId
          }&userId2=${userId2}`,
          { headers: { Authorization: "xxx" } }
        );
      }
      setLoading(false);
      window.location.reload();
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  const handleMenuClickUnblock = async (e, index) => {
    try {
      setLoading(true);
      e.domEvent.preventDefault();
      e.domEvent.stopPropagation();
      // This will give you the key of the clicked item
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
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/blockUser?unBlock=${true}&userId1=${
            user.userId
          }&userId2=${userId2}`,
          { headers: { Authorization: "xxx" } }
        );
      } else {
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/blockUser?deleteChat=${true}&userId1=${
            user.userId
          }&userId2=${userId2}`,
          { headers: { Authorization: "xxx" } }
        );
      }
      setLoading(false);
      window.location.reload();
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };
  // Create a Menu component from menuItems
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
      if (!chatInitialLoad) {
        setChatInitialLoad(true);
        setScrollLoadMoreData(true);
        return;
      }
      setLoading(true);
      const result = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${user.userId}&lastEvaluatedKey=${lastEvaluatedKey}`,
        { headers: { Authorization: "xxx" } }
      );
      setChatData((prevValue) => [...result.data.items, ...prevValue]);
      setLastEvaluatedKey(result.data.lastEvaluatedKey);
      // If no more data to load, set hasMore to false
      setLoading(false);
      if (!result.data.lastEvaluatedKey) {
        setHasMore(false);
      }
      setChatScrollPosition(scrollPosition);
    } catch (err) {
      setLoading(false);
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
    setFavData([]);
    setFavInitialLoad(true);
    setAdData([]);
    setAdInitialLoad(true);
    setAdPageInitialLoad(true);
    setFavPageInitialLoad(true);
  }, []);

  useEffect(() => {
    if (user && user.userId) {
      getChats();
    }
  }, [user]);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Content style={{ padding: "0 15px" }}>
        {contextHolder}
        <div
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "scroll",
            height: "100%",
            paddingBottom: "60px",
          }}
        >
          <InfiniteScroll
            style={{
              overflowX: "hidden",
            }}
            dataLength={chatData.length}
            next={getChats}
            hasMore={hasMore}
            inverse={true}
            loader={
              <Skeleton
                avatar
                paragraph={{
                  rows: 1,
                }}
                active
              />
            }
            endMessage={
              <>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>
                <Divider plain>It is all, nothing more</Divider>
              </>
            }
            scrollableTarget="scrollableDiv"
          >
            {!loading &&
              !chatLoading &&
              user &&
              chatData.map((item, index) => {
                return (
                  <Row style={{ padding: "10px" }}>
                    <Col span={24}>
                      <Badge dot={item.read === "false" ? true : false}>
                        <Card
                          style={{
                            height: "13vh",
                            width: "calc(100vw - 50px)",
                          }}
                          onClick={() => {
                            if (item.blocked) {
                              info();
                            } else {
                              setChatScrollPosition(
                                scrollableDivRef.current.scrollTop
                              );
                              navigate("/chat", {
                                state: { conversationId: item.conversationId },
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
                                  <Dropdown overlay={menu(index)}>
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
                                  <Dropdown overlay={menuBlocked(index)}>
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
                          bordered={true}
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
                        </Card>
                      </Badge>
                    </Col>
                  </Row>
                );
              })}
            {(loading || chatLoading) && <Spin fullscreen />}
          </InfiniteScroll>
        </div>
      </Content>
      <Footer
        style={{
          position: "fixed",
          bottom: 0,
          zIndex: 1,
          width: "100vw",
          display: "flex",
          alignItems: "center",
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
            flex: 1,
            minWidth: 0,
          }}
        />
      </Footer>
    </Layout>
  );
};

export default ChatPage;
