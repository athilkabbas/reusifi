import React, { useEffect, useState } from "react";
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
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ws, setWs] = useState("");
  const [refetch, setRefetch] = useState(false);
  const [reconnect, setReconnect] = useState(false);

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
          console.log("Message from server:", event.data);
          setRefetch((refetch) => !refetch);
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

  useEffect(() => {
    const getChats = async () => {
      const result = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${user.userId}&userId2=${recipient["item"]["_id"]}`,
        { headers: { Authorization: "xxx" } }
      );
      setData(result.data);
    };
    if (user && user.userId && recipient && recipient["item"]["_id"]) {
      getChats();
    }
  }, [user, recipient, refetch]);

  const handleNavigation = (event) => {
    switch (event.key) {
      case "1":
        navigate("/");
        break;
      case "2":
        navigate("/addDress");
        break;
      case "3":
        // navigate("/chat");
        break;
      case "4":
        signOut();
        break;
    }
  };
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const handleChange = (value) => {
    setValue(value.target.defaultValue);
  };
  const handleSubmit = () => {
    sendMessage("heyman", recipient["item"]["_id"], user.userId);
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
        }}
      >
        <div className="demo-logo" />
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["2"]}
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
          maxHeight: "85vh",
          overflow: "scroll",
        }}
      >
        <div
          style={{
            padding: 0,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            marginTop: "30px",
            paddingBottom: "20px",
          }}
        >
          <List
            footer={
              <Row style={{ padding: 10, position: "fixed", bottom: "0px" }}>
                <Col xs={20} sm={5}>
                  <Input
                    onChange={(value) => handleChange(value, "price")}
                    placeholder="Enter message"
                  />
                </Col>
                <Col offset={2} xs={2} sm={5}>
                  <Button type="primary" onClick={() => handleSubmit()}>
                    send
                  </Button>
                </Col>
              </Row>
            }
            size="large"
            bordered
            dataSource={data}
            renderItem={(item) => {
              if (
                item.recipientId === user.userId ||
                item.senderId === user.userId
              ) {
                return (
                  <Row>
                    <Col xs={12} offset={12}>
                      <List.Item style={{ wordBreak: "break-all" }}>
                        {item.message}
                      </List.Item>
                    </Col>
                  </Row>
                );
              } else {
                <Row>
                  <Col xs={12}>
                    <List.Item style={{ wordBreak: "break-all" }}>
                      {item.message}
                    </List.Item>
                  </Col>
                </Row>;
              }
            }}
          />
        </div>
      </Content>
    </Layout>
  );
};
export default Chat;
