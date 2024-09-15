import React, { Fragment, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Select, Space } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton } from "antd";
import { Card } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import debounce from "lodash/debounce";
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
  const [search, setSearch] = useState(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchChange, setSearchChange] = useState(false);
  const [lastEvaluatedKeys, setLastEvaluatedKeys] = useState({
    cLEK: null,
    tLEK: null,
    tS1LEK: null,
    tS2LEK: null,
    tS3LEK: null,
  });
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  // Debounced version of the search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value); // Replace 'search' with your actual search function
    }, 100), // 500ms delay for the debounce
    []
  );

  const loadMoreData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    try {
      setLoading(true);
      let results;
      if (search) {
        results = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?limit=${searchPage}&lastEvaluatedKeys=${JSON.stringify(
            lastEvaluatedKeys
          )}&search=${search}`,
          { headers: { Authorization: "xxx" } }
        );
      } else {
        results = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?limit=${page}&lastEvaluatedKey=${JSON.stringify(
            lastEvaluatedKey
          )}`,
          { headers: { Authorization: "xxx" } }
        );
      }
      if (results.data.finalResult.length < 6) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      if (search) {
        setLastEvaluatedKeys(results.data.lastEvaluatedKeys);
        setSearchPage((page) => {
          if (page === 2) {
            return page;
          }
          return page + 1;
        });
      } else {
        setLastEvaluatedKey(results.data.lastEvaluatedKey);
        setPage((page) => {
          if (page === 2) {
            return page;
          }
          return page + 1;
        });
      }
      if (searchChange) {
        setData([]);
        let newData = results.data.finalResult.filter(
          (item) => currentUser.userId !== item["item"]["email"]
        );
        setData([...data, ...newData]);
        setSearchChange(false);
      } else {
        let newData = results.data.finalResult.filter(
          (item) => currentUser.userId !== item["item"]["email"]
        );
        setData([...data, ...newData]);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };
  useEffect(() => {
    loadMoreData();
  }, [search]);
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
        signOut();
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
      <div
        style={{
          padding: "10px",
          background: "white",
          position: "sticky",
          top: "60px",
        }}
      >
        <Space.Compact size="large">
          <Input
            addonBefore={<SearchOutlined />}
            value={search}
            onChange={(event) => {
              setSearchChange(true);
              debouncedSearch(event.target.value);
            }}
            placeholder="Search"
          />
        </Space.Compact>
      </div>
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
                          style={{ height: 260 }}
                          onClick={() => {
                            navigate("/details", { state: { item } });
                          }}
                          cover={
                            <img
                              alt="example"
                              src={item["image"]}
                              style={{
                                height: "150px",
                                objectFit: "contain",
                              }}
                            />
                          }
                        >
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            <b>{capitalize(item["item"]["category"])}</b>
                          </div>
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            <b>{capitalize(item["item"]["title"])}</b>
                          </div>
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            <b>{item["item"]["price"]}</b>
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
