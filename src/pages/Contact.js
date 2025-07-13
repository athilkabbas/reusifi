import React, { useContext, useEffect, useState } from "react";
import { Input, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Badge } from "antd";
import { Layout, Menu, theme, Space, Skeleton, Typography,message, Modal } from "antd";
import axios from "axios";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  MailOutlined,
  HeartOutlined,
  ProductFilled,
  MailFilled,
  HeartFilled,
  LoadingOutlined
} from "@ant-design/icons";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { useSessionCheck } from "../hooks/sessionCheck";
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "My Ads",
  "Contact",
  "Favourites",
  "SignOut",
];
const { Content, Footer, Header } = Layout;
const { Text, Link } = Typography;
const Contact = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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
    setFavLastEvaluatedKey,
    setChatLastEvaluatedKey,
    setAdLastEvaluatedKey,
    contactInita,
    contactInitialLoad,
    setIChatInitialLoad,
    setAddProductInitialLoad,
    setContactInitialLoad,
    unreadChatCount,
    setUnreadChatCount
  } = useContext(Context);

  const { token } = useSessionCheck()
  useEffect(() => {
    const getChatCount = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        const result = await axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getChatsCount?userId1=${
            encodeURIComponent(currentUser.userId)
          }&count=${encodeURIComponent(true)}`,
          { headers: { Authorization: token } }
        );
        setUnreadChatCount(result.data.count);
        setLoading(false);
        setContactInitialLoad(false)
      } catch (err) {
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
    if(contactInitialLoad && token){
        getChatCount();
    }
  }, [contactInitialLoad, token]);

  const isMobile = useIsMobile()
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
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      
       {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px', height: '50px' }}>
              <Menu
                onClick={(event) => handleNavigation(event)}
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={["5"]}
                items={items}
                style={{ minWidth: 0,justifyContent: 'space-around',
            flex: 1,background: "#6366F1" }}
              />
            </Header>}
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
            <Space.Compact
              size="large"
              style={{ padding: "30px" }}
            >
              <Text>
                For any queries please email us at <br></br>reusifi@gmail.com
              </Text>
            </Space.Compact>
          )}
          {loading && 
          <Skeleton
            paragraph={{
              rows: 8,
            }}
            active
          />
          }
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
          padding: "0px",
          height: '50px'
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
            justifyContent: 'space-around',
            flex: 1,
            minWidth: 0,background: "#6366F1"
          }}
        />
      </Footer>}
    </Layout>
  );
};
export default Contact;
