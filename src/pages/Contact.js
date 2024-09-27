import React, { useContext, useEffect, useState } from "react";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Badge } from "antd";
import { Layout, Menu, theme, Space, Skeleton, Typography } from "antd";
import axios from "axios";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  MailOutlined,
  HeartOutlined,
  ProductFilled,
} from "@ant-design/icons";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "Ads",
  "Contact",
  "Favourites",
  "SignOut",
];
const { Content, Footer } = Layout;
const { Text, Link } = Typography;
const Contact = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const {
    setHomeInitialLoad,
    setAdInitialLoad,
    data,
    setInitialLoad,
    adData,
    setAdData,
    setFavData,
    setChatData,
    setFavInitialLoad,
    setChatInitialLoad,
    setChatPageInitialLoad,
    setFavPageInitialLoad,
    setAdPageInitialLoad,
  } = useContext(Context);

  useEffect(() => {
    setFavData([]);
    setFavInitialLoad(true);
    setAdData([]);
    setAdInitialLoad(true);
    setChatData([]);
    setChatInitialLoad(true);
    setAdPageInitialLoad(true);
    setFavPageInitialLoad(true);
    setChatPageInitialLoad(true);
  }, []);

  useEffect(() => {
    const getChatCount = async () => {
      try {
        const currentUser = await getCurrentUser();
        setLoading(true);
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            currentUser.userId
          }&count=${true}`,
          { headers: { Authorization: "xxx" } }
        );
        setUnreadChatCount(result.data.count);
        // If no more data to load, set hasMore to false
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.log(err);
      }
    };
    getChatCount();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      setInitialLoad(false);
    } else {
      setInitialLoad(true);
    }
  }, []);

  useEffect(() => {
    setHomeInitialLoad(false);
  }, []);
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
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Content style={{ padding: "0 15px" }}>
        <div
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflowY: "scroll",
            height: "100%",
            overflowX: "hidden",
            paddingBottom: "60px",
          }}
        >
          {!loading && (
            <Space.Compact
              block={true}
              size="large"
              style={{ padding: "30px" }}
            >
              <Text>
                For any queries please email us at <br></br>reusifi@gmail.com
              </Text>
            </Space.Compact>
          )}
          {loading && <Skeleton />}
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
          defaultSelectedKeys={["5"]}
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
export default Contact;
