import React, {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Breadcrumb, Layout, Menu, theme } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  SearchOutlined,
  ProductFilled,
  MailOutlined,
  HeartOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { Button, Input, Select, Space } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton } from "antd";
import { Card } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import debounce from "lodash/debounce";
import { states, districts, districtMap } from "../helpers/locations";
import { Context } from "../context/provider";
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "Ads",
  "Contact",
  "Favourites",
  "SignOut",
];
const { Meta } = Card;
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const { Header, Content, Footer } = Layout;
const App = () => {
  const [loading, setLoading] = useState(false);
  const limit = 10;
  const [user, setUser] = useState(null);
  const timer = useRef(null);
  const [districts, setDistricts] = useState([]);
  const scrollableDivRef = useRef(null);
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [favData, setFavData] = useState([]);
  const { data, initialLoad, setInitialLoad, filterList, setFilterList } =
    useContext(Context);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    MailOutlined,
    HeartOutlined,
    LogoutOutlined,
  ].map((icon, index) => {
    if (index === 2) {
      return {
        key: String(index + 1),
        icon: (
          <Badge overflowCount={999} count={unreadChatCount}>
            {React.createElement(icon)}
          </Badge>
        ),
        label: IconText[index],
      };
    }
    return {
      key: String(index + 1),
      icon: React.createElement(icon),
      label: IconText[index],
    };
  });
  useEffect(() => {
    if (scrollableDivRef.current && (!initialLoad || scrollLoadMoreData)) {
      setTimeout(() => {
        scrollableDivRef.current.scrollTo(0, scrollPosition);
        setScrollLoadMoreData(false);
      }, 0);
    }
  }, [scrollPosition, initialLoad]);

  useEffect(() => {
    if (data.length > 0) {
      setInitialLoad(false);
    } else {
      setInitialLoad(true);
    }
  }, []);

  useEffect(() => {
    const getChatCount = async () => {
      try {
        setLoading(true);
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            user.userId
          }&count=${true}`,
          { headers: { Authorization: "xxx" } }
        );
        setUnreadChatCount(result.data.count);
        // If no more data to load, set hasMore to false
        setLoading(false);
        if (!result.data.lastEvaluatedKey) {
          setHasMore(false);
        }
      } catch (err) {
        setLoading(false);
        console.log(err);
      }
    };
    if (user) {
      getChatCount();
    }
  }, [user]);

  useEffect(() => {
    const getFavList = async () => {
      const results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getFavourites?email=${
          user.userId
        }&favList=${true}`,
        { headers: { Authorization: "xxx" } }
      );
      setFilterList([...results.data.finalResult]);
    };
    if (user) {
      getFavList();
    }
  }, [user]);

  const handleFav = async (id, favourite) => {
    const results = await axios.get(
      `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getFavourites?id=${id}&favourite=${favourite}&email=${user.userId}`,
      { headers: { Authorization: "xxx" } }
    );
    if (!favourite) {
      setFilterList((prevValue) => {
        return prevValue.filter((item) => {
          return item !== id;
        });
      });
    } else {
      setFilterList([...filterList, id]);
    }
  };

  const loadMoreData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let results;

      results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getFavourites?email=${
          currentUser.userId
        }&limit=${limit}&lastEvaluatedKey=${JSON.stringify(lastEvaluatedKey)}`,
        { headers: { Authorization: "xxx" } }
      );
      setLastEvaluatedKey(results.data.lastEvaluatedKey);
      if (!results.data.lastEvaluatedKey) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      setFavData([...favData, ...results.data.finalResult]);
      setLoading(false);
      setScrollPosition(scrollPosition);
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
        navigate("/addProduct");
        break;
      case "3":
        navigate("/chatPage");
        break;
      case "4":
        navigate("/ads");
        break;
      case "5":
        navigate("/contact");
        break;
      case "6":
        navigate("/favourite");
        break;
      case "7":
        signOut();
        break;
    }
  };
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Content style={{ padding: "0 15px" }}>
        <div
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            padding: 5,
            height: "100%",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflowY: "scroll",
            overflowX: "hidden",
            paddingBottom: "60px",
          }}
        >
          <InfiniteScroll
            style={{ overflowX: "hidden" }}
            dataLength={favData.length}
            next={() => {
              setScrollLoadMoreData(true);
              loadMoreData();
            }}
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
                grid={{ xs: 2, gutter: 10, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }}
                dataSource={favData}
                renderItem={(item) => {
                  return (
                    <>
                      <List.Item key={item["item"]["id"]}>
                        <Card
                          style={{ height: 265 }}
                          onClick={() => {
                            setScrollPosition(
                              scrollableDivRef.current.scrollTop
                            );
                            navigate("/details", {
                              state: {
                                item,
                                ad: user.userId === item["item"]["email"],
                              },
                            });
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
                            <b>₹{item["item"]["price"]}</b>
                          </div>
                          {item["item"]["email"] !== user.userId && (
                            <div
                              onClick={(event) => {
                                handleFav(
                                  item["item"]["uuid"],
                                  !filterList.includes(item["item"]["uuid"]),
                                  event
                                );
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              style={{ display: "flex", justifyContent: "end" }}
                            >
                              {filterList.includes(item["item"]["uuid"]) && (
                                <HeartFilled></HeartFilled>
                              )}
                              {!filterList.includes(item["item"]["uuid"]) && (
                                <HeartOutlined></HeartOutlined>
                              )}
                            </div>
                          )}
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
          position: "fixed",
          bottom: 0,
          zIndex: 1,
          width: "100vw",
          display: "flex",
          alignItems: "center",
          padding: "0px",
        }}
      >
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["6"]}
          items={items}
          style={{ minWidth: 0, flex: "auto" }}
        />
      </Footer>
    </Layout>
  );
};
export default App;
