import React, { useEffect, useState } from "react";
import { Col, Row, Skeleton } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Select } from "antd";
import { Breadcrumb, Layout, Menu, theme } from "antd";
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
} from "@ant-design/icons";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
const IconText = ["Home", "Upload", "Chats", "SignOut"];
const items = [HomeFilled, UploadOutlined, MessageFilled, LogoutOutlined].map(
  (icon, index) => ({
    key: String(index + 1),
    icon: React.createElement(icon),
    label: IconText[index],
  })
);
const { TextArea } = Input;
const { Header, Content, Footer } = Layout;
const Details = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { item } = location.state || "";
  const [images, setImages] = useState([]);
  const navigate = useNavigate();
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
  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?id=${item["item"]["_id"]}`,
          { headers: { Authorization: "xxx" } }
        );
        setLoading(false);
        setImages(result.data.images);
      } catch (err) {
        setLoading(false);
        console.log(err);
      }
    };
    if (item) {
      getData();
    }
  }, []);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
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
          style={{
            padding: 0,
            minHeight: 380,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            marginTop: "30px",
            overflowY: "scroll",
            height: "100%",
            paddingBottom: "20px",
            overflowX: "hidden",
          }}
        >
          {!loading && (
            <>
              {images.length > 0 && (
                <Row style={{ padding: 20 }}>
                  <Col>
                    <Carousel>
                      {images.map((image, index) => {
                        return <Image key={index} src={image} />;
                      })}
                    </Carousel>
                  </Col>
                </Row>
              )}
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["_source"]["category"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["_source"]["title"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={10}>
                  <TextArea value={item["item"]["_source"]["description"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["_source"]["state"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["_source"]["district"]} />
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["_source"]["price"]} />
                </Col>
              </Row>
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
            </>
          )}
          {loading && <Skeleton />}
        </div>
      </Content>
    </Layout>
  );
};
export default Details;
