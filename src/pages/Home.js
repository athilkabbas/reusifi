import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton } from "antd";
import { Card } from "antd";
import axios from "axios";
const IconText = ["Home", "Upload", "Chats", "SignOut"];
const { Meta } = Card;
const items = [HomeFilled, UploadOutlined, MessageFilled, LogoutOutlined].map(
  (icon, index) => ({
    key: String(index + 1),
    icon: React.createElement(icon),
    label: IconText[index],
  })
);
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const { Header, Content, Footer } = Layout;
const App = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const loadMoreData = async () => {
    try {
      if (loading) {
        return;
      }
      setLoading(true);
      const results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?page=${page}&pageSize=${pageSize}`,
        { headers: { Authorization: "xxx" } }
      );
      if (results.data.length < 6) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      setPage((page) => {
        if (page === 2) {
          return page;
        }
        return page + 1;
      });
      setData([...data, ...results.data]);
      setLoading(false);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    loadMoreData();
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
          defaultSelectedKeys={["1"]}
          items={items}
          style={{ minWidth: 0, flex: "auto" }}
        />
      </Header>
      <Content
        style={{
          padding: "0 15px",
        }}
      >
        <div
          id="scrollableDiv"
          style={{
            padding: 5,
            height: "100vh",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            marginTop: "30px",
            overflowY: "scroll",
            overflowX: "hidden",
          }}
        >
          <InfiniteScroll
            style={{ overflowX: "hidden" }}
            dataLength={data.length}
            next={loadMoreData}
            hasMore={hasMore}
            loader={
              <Skeleton
                avatar
                paragraph={{
                  rows: 1,
                }}
                active
              />
            }
            endMessage={<Divider plain>It is all, nothing more</Divider>}
            scrollableTarget="scrollableDiv"
          >
            <List
              grid={{ xs: 2, gutter: 10 }}
              dataSource={data}
              renderItem={(item) => (
                <List.Item key={item["item"]["_id"]}>
                  <Card
                    onClick={() => {
                      navigate("/details", { state: { item } });
                    }}
                    style={{
                      xs: {
                        width: 130,
                      },
                      sm: {
                        width: 300,
                      },
                    }}
                    cover={<img alt="example" src={item["image"]} />}
                  >
                    <div>
                      <b>{capitalize(item["item"]["_source"]["category"])}</b>
                    </div>
                    <div>
                      <b>{capitalize(item["item"]["_source"]["title"])}</b>
                    </div>
                    <div>
                      <b>{item["item"]["_source"]["price"]}</b>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </InfiniteScroll>
        </div>
      </Content>
    </Layout>
  );
};
export default App;
