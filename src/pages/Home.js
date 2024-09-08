import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { HomeFilled, UploadOutlined } from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import axios from "axios";
const IconText = ["Home", "Upload"];
const items = [HomeFilled, UploadOutlined].map((icon, index) => ({
  key: String(index + 1),
  icon: React.createElement(icon),
  label: IconText[index],
}));
const { Header, Content, Footer } = Layout;
const App = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const getItems = async () => {
      const results = await axios.get(
        "https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress",
        { headers: { Authorization: "xxx" } }
      );
      console.log(results, "athil");
    };
    getItems();
  }, []);
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
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ height: "100vh" }}>
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
          defaultSelectedKeys={["1"]}
          items={items}
          style={{
            flex: 1,
            minWidth: 0,
          }}
        />
      </Header>
      <Content
        style={{
          padding: "0 48px",
        }}
      >
        <div
          style={{
            padding: 24,
            minHeight: 380,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            height: "100%",
            marginTop: "30px",
          }}
        >
          <InfiniteScroll
            dataLength={items.length} //This is important field to render the next data
            next={() => {}}
            hasMore={false}
            loader={<h4>Loading...</h4>}
            endMessage={
              <p style={{ textAlign: "center" }}>
                <b>Yay! You have seen it all</b>
              </p>
            }
          >
            {data}
          </InfiniteScroll>
        </div>
      </Content>
      <Footer
        style={{
          textAlign: "center",
        }}
      >
        Reusifi
      </Footer>
    </Layout>
  );
};
export default App;
