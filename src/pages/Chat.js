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
  LogoutOutlined,
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
const { Header, Content, Footer } = Layout;
const Chat = () => {
  const [ichatData, setIChatData] = useState([]);
  const location = useLocation();
  const { recipient } = location.state || "";
  const { conversationId } = location.state;
  const [messageValue, setMessageValue] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ws, setWs] = useState("");
  const [reconnect, setReconnect] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const bottomRef = useRef(null); // To reference the bottom of the chat container
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollableDivRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { Text, Link } = Typography;
  const sendMessage = (message, recipientUserId, senderUserId) => {
    try {
      if (ws) {
        ws.send(
          JSON.stringify({
            action: "sendMessage",
            recipientUserId: recipientUserId,
            senderUserId: senderUserId,
            message: message,
          })
        );
      }
    } catch (err) {
      setReconnect((reconnect) => !reconnect);
    }
  };
  const [unreadChatCount, setUnreadChatCount] = useState(0);
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
  } = useContext(Context);
  const [chatLoading, setChatLoading] = useState(false);
  useEffect(() => {
    const getChatCount = async () => {
      try {
        setChatLoading(true);
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
    if (user) {
      getChatCount();
    }
  }, [user, ichatData]);
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

  useEffect(() => {
    setFavData([]);
    setFavInitialLoad(true);
    setAdData([]);
    setAdInitialLoad(true);
    setFavPageInitialLoad(true);
    setAdPageInitialLoad(true);
    setChatPageInitialLoad(false);
  }, []);

  useEffect(() => {
    let socket;
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        socket = new WebSocket(
          `wss://vcj0ne6oh5.execute-api.ap-south-1.amazonaws.com/production?userId=${currentUser.userId}`
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
            },
            ...prevValue,
          ]);
          await axios.get(
            `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
              data.recipientUserId
            }&userId2=${data.senderUserId}&read=${true}`,
            { headers: { Authorization: "xxx" } }
          );
        };
        // To close the connection
        socket.onclose = () => {
          console.log("Disconnected from WebSocket");
        };
      } catch (error) {
        console.log("Error fetching user", error);
      }
    };

    fetchUser();
    return () => {
      socket.close();
    };
  }, [reconnect]);

  const getChats = async () => {
    try {
      setLoading(true);
      const scrollPosition = scrollableDivRef.current.scrollTop;
      let result;
      if (recipient && recipient["item"]["email"]) {
        result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${user.userId}&userId2=${recipient["item"]["email"]}&lastEvaluatedKey=${lastEvaluatedKey}`,
          { headers: { Authorization: "xxx" } }
        );
        await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            user.userId
          }&userId2=${recipient["item"]["email"]}&read=${true}`,
          { headers: { Authorization: "xxx" } }
        );
      } else if (conversationId) {
        let userIds = conversationId.split("#");
        let userId2;
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId;
            break;
          }
        }
        result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${user.userId}&userId2=${userId2}&lastEvaluatedKey=${lastEvaluatedKey}`,
          { headers: { Authorization: "xxx" } }
        );
        await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            user.userId
          }&userId2=${userId2}&read=${true}`,
          { headers: { Authorization: "xxx" } }
        );
      }
      setLoading(false);
      setIChatData((prevValue) => [...prevValue, ...result.data.items]);
      setLastEvaluatedKey(result.data.lastEvaluatedKey);
      // If no more data to load, set hasMore to false
      if (!result.data.lastEvaluatedKey) {
        setHasMore(false);
      }
      setScrollPosition(scrollPosition);
    } catch (err) {
      setLoading(false);
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
    setHomeInitialLoad(false);
  }, []);

  useEffect(() => {
    if (
      user &&
      user.userId &&
      ((recipient && recipient["item"]["email"]) || conversationId)
    ) {
      getChats();
    }
  }, [user, recipient, conversationId]);

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
  useEffect(() => {
    scrollableDivRef.current.scrollTo(0, scrollPosition);
  }, [scrollPosition]);
  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" }); // Smooth scrolling to the bottom
    }
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const handleChange = (value) => {
    setMessageValue(value.target.value);
  };
  const handleSubmit = () => {
    if (messageValue) {
      if (recipient && recipient["item"]["email"]) {
        sendMessage(messageValue, recipient["item"]["email"], user.userId);
      } else if (conversationId) {
        let userIds = conversationId.split("#");
        let userId2;
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId;
            break;
          }
        }
        sendMessage(messageValue, userId2, user.userId);
      }
      setIChatData((prevValue) => [
        { message: messageValue, timestamp: Date.now(), senderId: user.userId },
        ...prevValue,
      ]);
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

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Content>
        <div
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "scroll",
            display: "flex",
            flexDirection: "column-reverse",
            height: "100%",
            position: "fixed",
            bottom: "120px",
            width: "calc(100% - 10px)",
            paddingTop: "120px",
          }}
        >
          <InfiniteScroll
            style={{
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column-reverse",
            }}
            dataLength={ichatData.length}
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
            {!loading && !chatLoading && user && (
              <>
                <div ref={bottomRef} />
                {ichatData.map((item) => {
                  if (item.senderId === user.userId) {
                    return (
                      <Row key={item.timestamp} style={{ padding: "10px" }}>
                        <Col xs={12} offset={12}>
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                wordBreak: "break-word",
                                justifyContent: "end",
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
                                {formatTimeStamp(item.timestamp)}
                              </Text>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    );
                  } else {
                    return (
                      <Row key={item.timestamp} style={{ padding: "10px" }}>
                        <Col xs={12}>
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
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
                                {formatTimeStamp(item.timestamp)}
                              </Text>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    );
                  }
                })}
              </>
            )}
            {(loading || chatLoading) && <Spin fullscreen />}
          </InfiniteScroll>
        </div>
      </Content>
      <Space.Compact
        block={true}
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
          onChange={(value) => handleChange(value)}
          placeholder="Enter message"
          value={messageValue}
        />
        <Button type="primary" onClick={() => handleSubmit()}>
          send
        </Button>
      </Space.Compact>
      <Footer
        style={{
          position: "fixed",
          bottom: 0,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0px",
          width: "100vw",
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
            flex: 1,
            minWidth: 0,
          }}
        />
      </Footer>
    </Layout>
  );
};
export default Chat;
