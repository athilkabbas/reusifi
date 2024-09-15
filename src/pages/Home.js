import React, {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
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
import { states, districts, districtMap } from "../helpers/locations";
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
  const limit = 6;
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState(null);
  const timer = useRef(null);
  const [districts, setDistricts] = useState([]);
  const [location, setLocation] = useState({
    state: null,
    district: null,
  });
  const [lastEvaluatedKeys, setLastEvaluatedKeys] = useState({
    cLEK: null,
    tLEK: null,
    tS1LEK: null,
    tS2LEK: null,
    tS3LEK: null,
  });
  const handleChange = (value, type) => {
    setData([]);
    setLastEvaluatedKeys({
      cLEK: null,
      tLEK: null,
      tS1LEK: null,
      tS2LEK: null,
      tS3LEK: null,
    });
    setLastEvaluatedKey(null);
    setLocation((prevValue) => {
      return { ...prevValue, [type]: value };
    });
  };
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);

  const loadMoreData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    try {
      setLoading(true);
      let results;
      if (search) {
        results = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?limit=${limit}&lastEvaluatedKeys=${JSON.stringify(
            lastEvaluatedKeys
          )}&search=${search}&location=${JSON.stringify(location)}`,
          { headers: { Authorization: "xxx" } }
        );
      } else {
        results = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?limit=${limit}&lastEvaluatedKey=${JSON.stringify(
            lastEvaluatedKey
          )}&location=${JSON.stringify(location)}`,
          { headers: { Authorization: "xxx" } }
        );
      }
      if (results.data.finalResult.length < 6) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      let newData = results.data.finalResult.filter(
        (item) => currentUser.userId !== item["item"]["email"]
      );
      setData([...data, ...newData]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };
  useEffect(() => {
    // Clear the previous timeout if search changes
    if (timer.current) {
      clearTimeout(timer.current);
    }

    // Set a new timeout
    timer.current = setTimeout(() => {
      loadMoreData();
    }, 500);

    // Cleanup function to clear the timeout on component unmount or before next effect
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [search, location]);

  console.log(data);
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
      <div
        style={{
          padding: "10px",
          background: "white",
          position: "sticky",
          top: "0px",
          zIndex: 1,
        }}
      >
        <Space.Compact block={true} size="large">
          <Input
            addonBefore={<SearchOutlined />}
            value={search}
            onChange={(event) => {
              if (event.target.value) {
                setLastEvaluatedKeys({
                  cLEK: null,
                  tLEK: null,
                  tS1LEK: null,
                  tS2LEK: null,
                  tS3LEK: null,
                });
              } else {
                setLastEvaluatedKey(null);
              }
              setData([]);
              setSearch(event.target.value);
            }}
            placeholder="Search"
          />
          <Select
            onChange={(value) => {
              handleChange(value, "state");
              let districts = districtMap();
              setDistricts(districts[value]);
            }}
            showSearch
            style={{
              width: 120,
            }}
            value={location.state}
            placeholder="State"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
            options={states}
          />
          {districts.length > 0 && (
            <Select
              onChange={(value) => {
                handleChange(value, "district");
              }}
              showSearch
              style={{
                width: 120,
              }}
              value={location.district}
              placeholder="District"
              optionFilterProp="label"
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? "")
                  .toLowerCase()
                  .localeCompare((optionB?.label ?? "").toLowerCase())
              }
              options={districts}
            />
          )}
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
      <Footer
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0px",
        }}
      >
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["1"]}
          items={items}
          style={{ minWidth: 0, flex: "auto" }}
        />
      </Footer>
    </Layout>
  );
};
export default App;
