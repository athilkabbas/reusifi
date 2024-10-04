import React, { useContext, useEffect, useState } from "react";
import { Col, Row, Skeleton, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Select, Badge } from "antd";
import { Breadcrumb, Layout, Menu, theme, message } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import { Button } from "antd";
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
  } = useContext(Context);
  const info = () => {
    messageApi.info("No longer available");
  };

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
          {contextHolder}
          {!loading && !chatLoading && images.length > 0 && (
            <>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Carousel>
                    {images.map((image, index) => {
                      return <Image key={index} src={image} />;
                    })}
                  </Carousel>
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["title"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={10}>
                  <TextArea value={item["item"]["description"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["state"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["district"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input prefix="₹" value={item["item"]["price"]} />
                </Col>
              </Row>
              {ad && (
                <Row style={{ padding: 20 }}>
                  <Col xs={24} sm={10}>
                    <Button danger onClick={handleDelete} type="primary">
                      Delete
                    </Button>
                  </Col>
                </Row>
              )}
              {!ad && (
                <Row style={{ padding: 20 }}>
                  <Col xs={24} sm={10}>
                    <Button
                      onClick={() => {
                        navigate("/chat", { state: { recipient: item } });
                      }}
                      type="primary"
                    >
                      Chat
                    </Button>
                  </Col>
                </Row>
              )}
            </>
          )}
          {(loading || chatLoading) && <Spin fullscreen />}
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
export default Details;
