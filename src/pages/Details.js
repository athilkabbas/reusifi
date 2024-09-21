import React, { useContext, useEffect, useState } from "react";
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
  ProductFilled,
} from "@ant-design/icons";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
const IconText = ["Home", "Upload", "Chats", "Ads", "SignOut"];
const items = [
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  ProductFilled,
  LogoutOutlined,
].map((icon, index) => ({
  key: String(index + 1),
  icon: React.createElement(icon),
  label: IconText[index],
}));
const { TextArea } = Input;
const { Header, Content, Footer } = Layout;
const Details = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { item, ad } = location.state || "";
  const [images, setImages] = useState([]);
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
        signOut();
        break;
    }
  };
  const { setInitialLoad } = useContext(Context);
  useEffect(() => {
    setInitialLoad(false);
  }, []);
  useEffect(() => {
    const getData = async () => {
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
      }
    };
    if (item) {
      getData();
    }
  }, []);
  const handleDelete = async () => {
    try {
      setLoading(true);
      let results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/deleteAd?id=${
          item["item"]["uuid"]
        }&s3Keys=${JSON.stringify(item["item"]["s3Keys"])}`,
        { headers: { Authorization: "xxx" } }
      );
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
          {!loading && images.length > 0 && (
            <>
              <Row style={{ padding: 20 }}>
                <Col>
                  <Carousel>
                    {images.map((image, index) => {
                      return <Image key={index} src={image} />;
                    })}
                  </Carousel>
                </Col>
              </Row>
              <Row style={{ padding: 20 }}>
                <Col xs={24} sm={5}>
                  <Input value={item["item"]["category"]} />
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
                    <Button
                      danger
                      onClick={async () => {
                        await handleDelete();
                        navigate(-1);
                      }}
                      type="primary"
                    >
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
