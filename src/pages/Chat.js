import React, { useEffect, useState, useRef } from "react";
import { Col, message, Row } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Select } from "antd";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import { Button } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import { Divider, List, Typography } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Skeleton } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
const { TextArea } = Input;
const IconText = ["Home", "Upload", "Chats", "SignOut"];
const items = [HomeFilled, UploadOutlined, MessageFilled, LogoutOutlined].map(
  (icon, index) => ({
    key: String(index + 1),
    icon: React.createElement(icon),
    label: IconText[index],
  })
);
const { Header, Content, Footer } = Layout;
const Chat = () => {
  const [data, setData] = useState([]);
  const location = useLocation();
  const { recipient } = location.state || "";
  const { conversationId } = location.state;
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ws, setWs] = useState("");
  const [reconnect, setReconnect] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const bottomRef = useRef(null); // To reference the bottom of the chat container
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        const socket = new WebSocket(
          `wss://vcj0ne6oh5.execute-api.ap-south-1.amazonaws.com/production?userId=${currentUser.userId}`
        );
        setWs(socket);
        socket.onopen = () => {
          console.log("Connected to the WebSocket");
        };

        socket.onmessage = (event) => {
          console.log("Message from server:", event);
          const data = JSON.parse(event.data);
          setData((prevValue) => [
            {
              message: data.message,
              timestamp: data.timestamp,
              recipientId: data.recipientUserId,
              senderId: data.senderUserId,
            },
            ...prevValue,
          ]);
        };
        // To close the connection
        socket.onclose = () => {
          console.log("Disconnected from WebSocket");
        };
        return () => {
          socket.close();
        };
      } catch (error) {
        console.log("Error fetching user", error);
      }
    };

    fetchUser();
  }, [reconnect]);

  const getChats = async () => {
    try {
      setLoading(true);
      let result;
      if (recipient && recipient["item"]["_source"]["email"]) {
        result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${user.userId}&userId2=${recipient["item"]["_source"]["email"]}&lastEvaluatedKey=${lastEvaluatedKey}`,
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
      }
      setLoading(false);
      setData((prevValue) => [...result.data.items, ...prevValue]);
      setLastEvaluatedKey(result.data.lastEvaluatedKey);
      // If no more data to load, set hasMore to false
      if (!result.data.lastEvaluatedKey) {
        setHasMore(false);
      }
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  useEffect(() => {
    if (
      user &&
      user.userId &&
      ((recipient && recipient["item"]["_source"]["email"]) || conversationId)
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
        signOut();
        break;
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" }); // Smooth scrolling to the bottom
    }
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const handleChange = (value) => {
    setValue(value.target.value);
  };
  const handleSubmit = () => {
    if (value) {
      if (recipient && recipient["item"]["_source"]["email"]) {
        sendMessage(value, recipient["item"]["_source"]["email"], user.userId);
      } else if (conversationId) {
        let userIds = conversationId.split("#");
        let userId2;
        for (let userId of userIds) {
          if (user.userId !== userId) {
            userId2 = userId;
            break;
          }
        }
        sendMessage(value, userId2, user.userId);
      }
      setData((prevValue) => [
        { message: value, timestamp: Date.now(), senderId: user.userId },
        ...prevValue,
      ]);
    }
    setValue("");
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          width: "100%",
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
          defaultSelectedKeys={["0"]}
          items={items}
          style={{
            flex: 1,
            minWidth: 0,
          }}
        />
      </Header>
      <Content
        style={{
          padding: "0 15px",
        }}
      >
        <div
          id="scrollableDiv"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "scroll",
            display: "flex",
            flexDirection: "column-reverse",
            height: "calc(100vh - 120px)",
          }}
        >
          <InfiniteScroll
            style={{
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column-reverse",
              height: "100vh",
            }}
            dataLength={data.length}
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
            endMessage={<Divider plain>It is all, nothing more</Divider>}
            scrollableTarget="scrollableDiv"
          >
            {!loading && user && (
              <>
                <div ref={bottomRef} />
                {data.map((item) => {
                  if (item.senderId === user.userId) {
                    return (
                      <Row key={item.timestamp}>
                        <Col xs={12} offset={12}>
                          <div
                            style={{
                              display: "flex",
                              wordBreak: "break-word",
                              justifyContent: "end",
                            }}
                          >
                            {item.message}
                          </div>
                        </Col>
                      </Row>
                    );
                  } else {
                    return (
                      <Row key={item.timestamp}>
                        <Col xs={12}>
                          <div
                            style={{
                              display: "flex",
                              wordBreak: "break-wrod",
                              justifyContent: "start",
                            }}
                          >
                            {item.message}
                          </div>
                        </Col>
                      </Row>
                    );
                  }
                })}
              </>
            )}
            {loading && <Skeleton />}
          </InfiniteScroll>
          <Row
            style={{
              padding: 10,
              position: "fixed",
              bottom: "0px",
              height: "60px",
            }}
          >
            <Col xs={20} sm={5}>
              <Input
                onChange={(value) => handleChange(value)}
                placeholder="Enter message"
                value={value}
              />
            </Col>
            <Col offset={2} xs={2} sm={5}>
              <Button type="primary" onClick={() => handleSubmit()}>
                send
              </Button>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};
export default Chat;
