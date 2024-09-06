import React, { useState } from "react";
import { Col, Row } from "antd";
import { Input } from "antd";
import { Select } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { HomeFilled, UploadOutlined } from "@ant-design/icons";
import { Layout, Menu, theme } from "antd";
import { useNavigate } from "react-router-dom";
const { Header, Content, Footer, Sider } = Layout;
const { TextArea } = Input;
const IconText = ["Home", "Upload"];
const items = [HomeFilled, UploadOutlined].map((icon, index) => ({
  key: String(index + 1),
  icon: React.createElement(icon),
  label: IconText[index],
}));
const Home = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    dressType: "",
    description: "",
    state: "",
    district: "",
    images: [],
  });
  const [districts, setDistricts] = useState([]);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const handleChange = (value, type) => {
    setForm((prevValue) => {
      return { ...prevValue, [type]: value };
    });
  };

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
  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
          }}
        />
        <Content
          style={{
            margin: "24px 16px 0",
          }}
        >
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              height: "100%",
            }}
          >
            content
          </div>
        </Content>
        <Footer
          style={{
            textAlign: "center",
          }}
        >
          {/* Ant Design ©{new Date().getFullYear()} Created by Ant UED */}
        </Footer>
      </Layout>
    </Layout>
  );
};
export default Home;
