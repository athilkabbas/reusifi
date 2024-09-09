import React, { useEffect, useState } from "react";
import { Col, Row } from "antd";
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
  const location = useLocation();
  const { recipient } = location.state || "";
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ws, setWs] = useState("");

  const sendMessage = (message, recipientUserId, senderUserId) => {
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
  }, []);

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
    sendMessage(value, recipient["item"]["_id"], user.userId);
  };
  return (
    <Layout>
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
        }}
      >
        <div
          style={{
            padding: 0,
            minHeight: 380,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            marginTop: "30px",
            overflow: "scroll",
            height: "100%",
            paddingBottom: "20px",
          }}
        >
          <Row style={{ padding: 20 }}>
            <Col xs={24} sm={5}>
              <Input
                onChange={(value) => handleChange(value, "category")}
                placeholder="Category"
              />
            </Col>
          </Row>
          <Button onClick={() => handleSubmit()}>send</Button>
        </div>
      </Content>
    </Layout>
  );
};
export default Chat;
