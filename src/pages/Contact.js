import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Badge } from "antd";
import { Layout, Menu, theme, Space, Skeleton, Typography, Modal } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  ProductFilled,
  MailFilled,
  HeartFilled,
  MenuOutlined,
} from "@ant-design/icons";
import { getCurrentUser, signInWithRedirect, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
const IconText = ["Home", "Sell", "Chats", "My Ads", "Favourites", ""];
const { Content, Footer, Header } = Layout;
const { Text } = Typography;
const Contact = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [loading, setLoading] = useState(false);
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
        signOut();
        break;
    }
  };

  const {
    contactInitialLoad,
    setContactInitialLoad,
    unreadChatCount,
    setUnreadChatCount,
  } = useContext(Context);

  useEffect(() => {
    const getChatCount = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        const result = await callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            currentUser.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );
        setUnreadChatCount(result.data.count);
        setLoading(false);
        setContactInitialLoad(false);
      } catch (err) {
        // message.error("An Error has occurred")
        if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
        console.log(err);
      }
    };
    if (contactInitialLoad) {
      getChatCount();
    }
  }, [contactInitialLoad]);

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

  return (
    <Layout
      style={{
        height: "var(--vh, 100dvh)",
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
            defaultSelectedKeys={["6-1"]}
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
          style={{
            background: "#F9FAFB",
            borderRadius: "0px",
            overflowY: "scroll",
            height: "100%",
            overflowX: "hidden",
            paddingBottom: "60px",
          }}
        >
          {!loading && (
            <Space.Compact size="large" style={{ padding: "30px" }}>
              <Text>
                For any queries please email us at <br></br>reusifi@gmail.com
              </Text>
            </Space.Compact>
          )}
          {loading && (
            <Skeleton
              paragraph={{
                rows: 8,
              }}
              active
            />
          )}
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
          <div className="demo-logo" />
          <Menu
            onClick={(event) => handleNavigation(event)}
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["6-1"]}
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
    </Layout>
  );
};
export default Contact;
