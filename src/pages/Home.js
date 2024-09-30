import React, {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Breadcrumb, Layout, Menu, Spin, theme } from "antd";
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
  const [chatLoading, setChatLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
  const {
    data,
    setData,
    search,
    setSearch,
    location,
    setLocation,
    scrollPosition,
    setScrollPosition,
    initialLoad,
    setInitialLoad,
    lastEvaluatedKey,
    setLastEvaluatedKey,
    lastEvaluatedKeys,
    setLastEvaluatedKeys,
    hasMore,
    setHasMore,
    filterList,
    setFilterList,
    homeInitialLoad,
    setAdInitialLoad,
    setChatData,
    setFavData,
    setAdData,
    setFavInitialLoad,
    setChatInitialLoad,
    setAdPageInitialLoad,
    setFavPageInitialLoad,
    setChatPageInitialLoad,
  } = useContext(Context);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [handleFavLoading, setHandleFavLoading] = useState(false);
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
    setFavData([]);
    setFavInitialLoad(true);
    setAdData([]);
    setAdInitialLoad(true);
    setChatData([]);
    setChatInitialLoad(true);
    setAdPageInitialLoad(true);
    setFavPageInitialLoad(true);
    setChatPageInitialLoad(true);
  }, []);
  useEffect(() => {
    if (scrollableDivRef.current && (!initialLoad || scrollLoadMoreData)) {
      setTimeout(() => {
        scrollableDivRef.current.scrollTo(0, scrollPosition);
        setScrollLoadMoreData(false);
      }, 0);
    }
  }, [scrollPosition, initialLoad]);

  useEffect(() => {
    const getChatCount = async () => {
      try {
        setChatLoading(true);
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            user.userId
          }&count=${true}`,
          { headers: { Authorization: "xxx" } }
        );
        setUnreadChatCount(result.data.count);
        if (!result.data.lastEvaluatedKey) {
          setHasMore(false);
        }
        setChatLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (user && homeInitialLoad) {
      getChatCount();
    }
  }, [user]);

  const handleChange = (value, type) => {
    setData([]);
    setLastEvaluatedKeys({
      cLEK: null,
      tLEK: null,
      tS1LEK: null,
      tS2LEK: null,
      tS3LEK: null,
      tS4LEK: null,
    });
    setLastEvaluatedKey(null);
    if (type === "state") {
      setLocation((prevValue) => {
        return { ...prevValue, [type]: value, district: null };
      });
    } else {
      setLocation((prevValue) => {
        return { ...prevValue, [type]: value };
      });
    }
  };

  useEffect(() => {
    const getFavList = async () => {
      setFavLoading(true);
      const results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getFavourites?email=${
          user.userId
        }&favList=${true}`,
        { headers: { Authorization: "xxx" } }
      );
      setFilterList([...results.data.finalResult]);
      setFavLoading(false);
    };
    if (user && homeInitialLoad) {
      getFavList();
    }
  }, [user]);

  const handleFav = async (id, favourite) => {
    setHandleFavLoading(true);
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
    setHandleFavLoading(false);
  };

  const loadMoreData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    if (!initialLoad) {
      setInitialLoad(true);
      setScrollLoadMoreData(true);
      return;
    }
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let results;
      if (search) {
        results = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?limit=${limit}&lastEvaluatedKeys=${JSON.stringify(
            lastEvaluatedKeys
          )}&search=${search}&location=${JSON.stringify(location)}`,
          { headers: { Authorization: "xxx" } }
        );
        setLastEvaluatedKeys(results.data.lastEvaluatedKeys);
        const lastEvaluatedKey = false;
        for (let lastEvaluatedKey in lastEvaluatedKeys) {
          if (lastEvaluatedKey) {
            lastEvaluatedKey = true;
          }
        }
        if (lastEvaluatedKey) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      } else {
        results = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?limit=${limit}&lastEvaluatedKey=${JSON.stringify(
            lastEvaluatedKey
          )}&location=${JSON.stringify(location)}`,
          { headers: { Authorization: "xxx" } }
        );
        setLastEvaluatedKey(results.data.lastEvaluatedKey);
        if (!results.data.lastEvaluatedKey) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
      setData([...data, ...results.data.finalResult]);
      setLoading(false);
      setScrollPosition(scrollPosition);
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

  const navigate = useNavigate();
  const handleNavigation = (event) => {
    setScrollPosition(scrollableDivRef.current.scrollTop);
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
                  tS4LEK: null,
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
            dataLength={data.length}
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
            {user && !loading && !chatLoading && !favLoading && (
              <List
                grid={{
                  xs: 2,
                  gutter: 10,
                  sm: 2,
                  md: 2,
                  lg: 2,
                  xl: 2,
                  xxl: 2,
                }}
                dataSource={data}
                renderItem={(item) => {
                  return (
                    <>
                      <List.Item key={item["item"]["id"]}>
                        <Card
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
                                height: "17vh",
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
                              style={{
                                display: "flex",
                                justifyContent: "end",
                              }}
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
            {(loading || chatLoading || favLoading || handleFavLoading) && (
              <Spin fullscreen />
            )}
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
          defaultSelectedKeys={["1"]}
          items={items}
          style={{ minWidth: 0, flex: "auto" }}
        />
      </Footer>
    </Layout>
  );
};
export default App;
