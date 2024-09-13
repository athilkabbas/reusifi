import React, { Fragment, useEffect, useState } from "react";
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
import { getCurrentUser, signOut } from "@aws-amplify/auth";
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
  const [user, setUser] = useState(null);
  const pageSize = 6;
  const loadMoreData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    try {
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
      let newData = results.data.filter(
        (item) => currentUser.userId !== item["item"]["_source"]["email"]
      );
      setData([...data, ...newData]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
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
      case "3":
        navigate("/chatPage");
        break;
      case "4":
        signOut();
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
            {user && !loading && (
              <List
                grid={{ xs: 2, gutter: 10 }}
                dataSource={data}
                renderItem={(item) => {
                  return (
                    <>
                      <List.Item key={item["item"]["_id"]}>
                        <Card
                          style={{ height: 250 }}
                          onClick={() => {
                            navigate("/details", { state: { item } });
                          }}
                          cover={<img alt="example" src={item["image"]} />}
                        >
                          <div>
                            <b>
                              {capitalize(item["item"]["_source"]["category"])}
                            </b>
                          </div>
                          <div>
                            <b>
                              {capitalize(item["item"]["_source"]["title"])}
                            </b>
                          </div>
                          <div>
                            <b>{item["item"]["_source"]["price"]}</b>
                          </div>
                        </Card>
                      </List.Item>
                    </>
                  );
                }}
              />
            )}
            {loading && <Skeleton />}
          </InfiniteScroll>
        </div>
      </Content>
    </Layout>
  );
};
export default App;
