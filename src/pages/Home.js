import React, { useState } from "react";
import { Col, Row } from "antd";
import { Input } from "antd";
import { Select } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import {
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Layout, Menu, theme } from "antd";
const { Header, Content, Footer, Sider } = Layout;
const { TextArea } = Input;
const items = [
  UserOutlined,
  VideoCameraOutlined,
  UploadOutlined,
  UserOutlined,
].map((icon, index) => ({
  key: String(index + 1),
  icon: React.createElement(icon),
  label: `nav ${index + 1}`,
}));
const Home = () => {
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
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["4"]}
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
            <Row style={{ padding: 20 }}>
              <Col span={10}>
                <Input
                  onChange={(value) => handleChange(value, "dressType")}
                  placeholder="Dress Type"
                />
              </Col>
            </Row>
            <Row style={{ padding: 20 }}>
              <Col span={20}>
                <TextArea
                  onChange={(value) => handleChange(value, "description")}
                  rows={4}
                  placeholder="Description"
                  maxLength={6}
                />
              </Col>
            </Row>
            <Row style={{ padding: 20 }}>
              <Col span={20}>
                <Select
                  onChange={(value) => {
                    handleChange(value, "state");
                    let districts = districtMap();
                    setDistricts(districts[value]);
                  }}
                  showSearch
                  style={{
                    width: 200,
                  }}
                  placeholder="Select State"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                  options={states}
                />
              </Col>
            </Row>
            {districts && (
              <Row style={{ padding: 20 }}>
                <Col span={20}>
                  <Select
                    onChange={(value) => {
                      handleChange(value, "district");
                    }}
                    showSearch
                    style={{
                      width: 200,
                    }}
                    placeholder="Select District"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? "")
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? "").toLowerCase())
                    }
                    options={districts}
                  />
                </Col>
              </Row>
            )}
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
