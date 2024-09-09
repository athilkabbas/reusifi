import React, { useEffect, useState } from "react";
import { Col, Row } from "antd";
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
    }
  };
  useEffect(() => {
    const getData = async () => {
      const result = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?id=${item["item"]["_id"]}`,
        { headers: { Authorization: "xxx" } }
      );
      setImages(result.data.images);
    };
    if (item) {
      getData();
    }
  });
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
          {images.length > 0 && (
            <Row style={{ padding: 20 }}>
              <Col offset={4} xs={24} sm={5}>
                <Carousel>
                  {images.map((image) => {
                    return <Image width={200} src={image} />;
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
              <Button onClick={() => {}} type="primary">
                Chat
              </Button>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};
export default Details;
