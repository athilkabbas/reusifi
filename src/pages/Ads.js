import React, {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, Layout, Menu, Spin, theme } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  MailOutlined,
  HeartOutlined,
  ProductFilled,
  LoadingOutlined
} from "@ant-design/icons";
import { Button, Input, Select, Space } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton, Empty } from "antd";
import { Card, Badge } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import debounce from "lodash/debounce";
import { states, districts, districtMap } from "../helpers/locations";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
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
const Ads = () => {
  const [loading, setLoading] = useState(false);
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
  const limit = 50;
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState(null);
  const timer = useRef(null);
  const [districts, setDistricts] = useState([]);
  const scrollableDivRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [location, setLocation] = useState({
    state: null,
    district: null,
  });
  const [lastEvaluatedKeys, setLastEvaluatedKeys] = useState({
    tLEK: null,
    tS1LEK: null,
    tS2LEK: null,
    tS3LEK: null,
    tS4LEK: null,
  });
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const {
    setInitialLoad,
    data,
    setAdScrollPosition,
    adScrollPosition,
    adInitialLoad,
    setAdInitialLoad,
    adData,
    setAdData,
    setHomeInitialLoad,
    setFavData,
    setFavInitialLoad,
    setChatData,
    setChatInitialLoad,
    adPageInitialLoad,
    setChatPageInitialLoad,
    setFavPageInitialLoad,
    adHasMore,
    setAdHasMore,
    adLastEvaluatedKey,
    setAdLastEvaluatedKey,
    setFavLastEvaluatedKey,
    setChatLastEvaluatedKey,
  } = useContext(Context);
  useEffect(() => {
    const getChatCount = async () => {
      setChatLoading(true);
      try {
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            user.userId
          }&count=${true}`,
          { headers: { Authorization: "xxx" } }
        );
        setUnreadChatCount(result.data.count);
        setChatLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (user && adPageInitialLoad) {
      getChatCount();
    }
  }, [user]);
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
    if (scrollableDivRef.current && (!adInitialLoad || scrollLoadMoreData)) {
      setTimeout(() => {
        scrollableDivRef.current.scrollTo(0, adScrollPosition);
        setScrollLoadMoreData(false);
      }, 150);
    }
  }, [adScrollPosition, adInitialLoad]);

  useEffect(() => {
    if (data.length > 0) {
      setInitialLoad(false);
    } else {
      setInitialLoad(true);
    }
  }, []);

  useEffect(() => {
    setHomeInitialLoad(false);
  }, []);

  const handleChange = (value, type) => {
    setAdData([]);
    setLastEvaluatedKeys({
      tLEK: null,
      tS1LEK: null,
      tS2LEK: null,
      tS3LEK: null,
      tS4LEK: null,
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
    if (!adInitialLoad) {
      setAdInitialLoad(true);
      setScrollLoadMoreData(true);
      return;
    }
    const scrollPosition = scrollableDivRef.current.scrollTop;
    try {
      setLoading(true);
      let results;
      results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?limit=${limit}&lastEvaluatedKey=${JSON.stringify(
          adLastEvaluatedKey
        )}&email=${currentUser.userId}`,
        { headers: { Authorization: "xxx" } }
      );
      setAdLastEvaluatedKey(results.data.lastEvaluatedKey);
      if (!results.data.lastEvaluatedKey) {
        setAdHasMore(false);
      } else {
        setAdHasMore(true);
      }

      setAdData([...adData, ...results.data.finalResult]);
      setLoading(false);
      setAdScrollPosition(scrollPosition);
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  useEffect(() => {
    loadMoreData();
  }, []);

  useEffect(() => {
    setFavData([]);
    setFavInitialLoad(true);
    setFavLastEvaluatedKey(null);
    setChatData([]);
    setChatInitialLoad(true);
    setChatLastEvaluatedKey(null);
    setFavPageInitialLoad(true);
    setChatPageInitialLoad(true);
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
  useEffect(() => {
    scrollableDivRef.current.scrollTo(0, scrollPosition);
  }, [scrollPosition]);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const isMobile = useIsMobile()
  return (
    <Layout style={{ height: "100vh", overflow: "hidden",  background: "#F9FAFB", }}>
         {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px', padding: '0px' }}>
                    <Menu
                      onClick={(event) => handleNavigation(event)}
                      theme="dark"
                      mode="horizontal"
                      defaultSelectedKeys={["4"]}
                      items={items}
                      style={{ minWidth: 0, flex: "auto",background: "#6366F1" }}
                    />
                  </Header>}
      <div
        style={{
          padding: "10px",
          background: "white",
          position: "sticky",
          top: "0px",
          zIndex: 1,
        }}
      ></div>
      <Content style={{ padding: "0 15px", marginTop: '30px' }}>
        <div
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            padding: 5,
            height: "100%",
            background: "#F9FAFB",
            borderRadius: "0px",
            overflowY: "scroll",
            overflowX: "hidden",
            paddingBottom: "60px",
          }}
        >
          <InfiniteScroll
            style={{ overflowX: "hidden",  background: "#F9FAFB", }}
            dataLength={adData.length}
            next={() => {
              setScrollLoadMoreData(true);
              loadMoreData();
            }}
            hasMore={adHasMore}
            loader={
              <Skeleton
                avatar
                paragraph={{
                  rows: 1,
                }}
                active
              />
            }
            endMessage={adData.length > 0 ? <Divider plain>It is all, nothing more</Divider> : ''}
            scrollableTarget="scrollableDiv"
          >
            {user && !loading && !chatLoading && (
              adData.length > 0 ? (<List
                grid={{  xs: 2,
                  gutter: 10,
                  sm: 3,
                  md: 3,
                  lg: 4,
                  xl: 6,
                  xxl: 6}}
                dataSource={adData}
                renderItem={(item) => {
                  return (
                    <>
                      <List.Item key={item["item"]["_id"]}>
                        <Card
                        style={{   boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", height: '30vh' }}
                          onClick={() => {
                            setAdScrollPosition(
                              scrollableDivRef.current.scrollTop
                            );
                            navigate("/details", { state: { item, ad: true } });
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
                            <b>{item["item"]["title"]}</b>
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
                        </Card>
                      </List.Item>
                    </>
                  );
                }}
              />) : (<div
                      style={{
                        height: "50vh",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Empty description="No items found" />
                    </div>)
            )}
            {(loading || chatLoading) && <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}  fullscreen/>}
          </InfiniteScroll>
        </div>
      </Content>
      {isMobile && <Footer
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
          defaultSelectedKeys={["4"]}
          items={items}
          style={{ minWidth: 0, flex: "auto",background: "#6366F1" }}
        />
      </Footer>}
    </Layout>
  );
};
export default Ads;
