import React, { useContext, useEffect, useState } from "react";
import { Col, Row, Skeleton, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Select, Badge } from "antd";
import { Breadcrumb, Layout, Menu, theme, message } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload, Space } from "antd";
import { Button ,Typography} from "antd";
import axios from "axios";
import { Carousel } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  MailOutlined,
  HeartOutlined,
  ProductFilled,
  LoadingOutlined
} from "@ant-design/icons";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "Ads",
  "Contact",
  "Favourites",
  "SignOut",
];
const { TextArea } = Input;
const { Header, Content, Footer } = Layout;
const Details = () => {
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const { item, ad } = location.state || "";
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const navigate = useNavigate();
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
    setInitialLoad,
    setData,
    data,
    favData,
    setFavInitialLoad,
    adData,
    setAdInitialLoad,
    setHomeInitialLoad,
    setFavPageInitialLoad,
    setChatData,
    setChatInitialLoad,
    setAdPageInitialLoad,
    setChatPageInitialLoad,
    setLastEvaluatedKey,
    setLastEvaluatedKeys,
    setChatLastEvaluatedKey,
  } = useContext(Context);
  const info = () => {
    messageApi.info("No longer available");
  };
const { Text, Link } = Typography;
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
        setChatLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (user) {
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

  useEffect(() => {
    if (favData.length > 0) {
      setFavInitialLoad(false);
    } else {
      setFavInitialLoad(true);
    }
  }, []);

  useEffect(() => {
    if (adData.length > 0) {
      setAdInitialLoad(false);
    } else {
      setAdInitialLoad(true);
    }
  }, []);

  useEffect(() => {
    setHomeInitialLoad(false);
    setFavPageInitialLoad(false);
    setAdPageInitialLoad(false);
    setChatPageInitialLoad(true);
  }, []);

  useEffect(() => {
    setChatData([]);
    setChatInitialLoad(true);
    setChatLastEvaluatedKey(null);
  }, []);
  useEffect(() => {
    const getData = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      try {
        setLoading(true);
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?id=${item["item"]["uuid"]}`,
          { headers: { Authorization: "xxx" } }
        );
        setLoading(false);
        setImages(result.data.images);
      } catch (err) {
        setLoading(false);
        console.log(err);
        info();
      }
    };
    if (item) {
      getData();
    }
  }, []);
  const handleDelete = async () => {
    try {
      setData([]);
      setInitialLoad(true);
      setLastEvaluatedKey(null);
      setLastEvaluatedKeys({});
      setLoading(true);
      let results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/deleteAd?id=${
          item["item"]["uuid"]
        }&s3Keys=${JSON.stringify(item["item"]["s3Keys"])}`,
        { headers: { Authorization: "xxx" } }
      );
      setLoading(false);
      navigate("/");
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };
  const isMobile = useIsMobile()
  return (
    <Layout style={{ height: "100vh", overflow: "hidden",background:"#F9FAFB" }}>
       {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px' }}>
              <Menu
                onClick={(event) => handleNavigation(event)}
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={["0"]}
                items={items}
                style={{ minWidth: 0, flex: "auto",background: "#6366F1" }}
              />
            </Header>}
      <Content style={{ padding: "0 15px" }}>
        <div
          style={{
            background: "#F9FAFB",
            borderRadius: '0px',
            overflowY: "scroll",
            height: "100%",
            overflowX: "hidden",
            paddingBottom: "60px",
          }}
        >
          {contextHolder}
          {!loading && !chatLoading && images.length > 0 && (
            <>
            <Space   block={true}
                size="large"  
                direction="vertical"
                style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Space.Compact
              block={true}
              size="large"
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
                <Carousel
                  autoplay
                  style={{
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {images.map((image, index) => (
                      <Image
                      width={300}
                        src={image}
                        key={index}
                      />

                  ))}
                </Carousel>
            </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ display: "flex", alignItems: "center" }}
              >
              <Text style={{  width: !isMobile ? '10vw' : '25vw'}}>Title</Text>
              <Input style={{  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" , width: !isMobile ? '50vw' : '60vw' }} value={item["item"]["title"]} />
              </Space.Compact>
                <Space.Compact
                block={true}
                size="large"
                style={{ display: "flex", alignItems: "center" }}
              >
              <Text style={{  width: !isMobile ? '10vw' : '25vw'}}>Description</Text>
              <TextArea style={{  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",width: !isMobile ? '50vw' : '60vw' }} value={item["item"]["description"]} />
              </Space.Compact>
                <Space.Compact
                block={true}
                size="large"
                style={{ display: "flex", alignItems: "center" }}
              >
              <Text style={{  width: !isMobile ? '10vw' : '25vw'}}>State</Text>
              <Input style={{  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",width: !isMobile ? '50vw' : '60vw' }} value={item["item"]["state"]} />
              </Space.Compact>
                 <Space.Compact
                block={true}
                size="large"
                style={{display: "flex", alignItems: "center" }}
              >
              <Text style={{  width: !isMobile ? '10vw' : '25vw'}}>District</Text>
              <Input style={{  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",width: !isMobile ? '50vw' : '60vw' }} value={item["item"]["district"]} />
              </Space.Compact>
                <Space.Compact
                block={true}
                size="large"
                style={{ display: "flex", alignItems: "center" }}
              >
              <Text style={{  width: !isMobile ? '10vw' : '25vw'}}>Price</Text>
              <Input style={{  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",width: !isMobile ? '50vw' : '60vw' }}  prefix="₹" value={item["item"]["price"]} />
              </Space.Compact>
              {ad && (
                     <Space.Compact
              block={true}
              size="large"
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
                  <Button style={{  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }} danger onClick={handleDelete} type="primary">
                      Delete
                    </Button>
            </Space.Compact>
              )}
              {!ad && (
                  <Space.Compact
              block={true}
              size="large"
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
                    <Button style={{ background: '#10B981' }}
                      onClick={() => {
                        navigate("/chat", { state: { recipient: item } });
                      }}
                      type="primary"
                    >
                      Chat
                    </Button>
            </Space.Compact>
              )}
            </Space>
            </>
          )}
          {(loading || chatLoading) && <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}  fullscreen/>}
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
            flex: "auto",
            minWidth: 0,background: "#6366F1"
          }}
        />
      </Footer>}
    </Layout>
  );
};
export default Details;
