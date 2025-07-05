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
  LoadingOutlined
} from "@ant-design/icons";
import { Button, Input, Select, Space } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton, Empty } from "antd";
import { Card } from "antd";
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
const App = () => {
  const [loading, setLoading] = useState(false);
  const limit = 20;
  const [user, setUser] = useState(null);
  const timer = useRef(null);
  const [districts, setDistricts] = useState([]);
  const scrollableDivRef = useRef(null);
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [handleFavLoading, setHandleFavLoading] = useState(false);
  const {
    data,
    initialLoad,
    setInitialLoad,
    filterList,
    setFilterList,
    favScrollPosition,
    setFavScrollPosition,
    favInitialLoad,
    setFavInitialLoad,
    favData,
    setFavData,
    setHomeInitialLoad,
    favPageInitialLoad,
    setAdInitialLoad,
    setAdData,
    setChatData,
    setChatInitialLoad,
    setAdPageInitialLoad,
    setChatPageInitialLoad,
    favHasMore,
    setFavHasMore,
    setFavLastEvaluatedKey,
    favLastEvaluatedKey,
    setChatLastEvaluatedKey,
    setAdLastEvaluatedKey,
    setContactInitialLoad,
    setIChatInitialLoad,
    setAddProductInitialLoad
  } = useContext(Context);
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
      const getUser = async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
      getUser()
    },[])

      useEffect(() => {
        if (scrollableDivRef.current  &&  !loading && !handleFavLoading && !chatLoading && !favLoading) {
          const el = scrollableDivRef.current;
          if (el.scrollHeight <= el.clientHeight && favHasMore) {
            loadMoreData();
          }
        }
      }, [loading,favData,handleFavLoading,chatLoading,favLoading]); 

    useEffect(() => {
    if (scrollableDivRef.current &&  !loading && !handleFavLoading) {
      requestAnimationFrame(() => {
        scrollableDivRef.current.scrollTo(0, favScrollPosition);
        setScrollLoadMoreData(false,scrollLoadMoreData);
      });
    }
  }, [favScrollPosition,loading,favData,handleFavLoading]);

    useEffect(() => {
    const getChatCount = async () => {
      try {
        setChatLoading(true);
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            encodeURIComponent(user.userId)
          }&count=${encodeURIComponent(true)}`,
          { headers: { Authorization: "xxx" } }
        );
        setUnreadChatCount(result.data.count);
        setChatLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (user && favInitialLoad) {
      getChatCount();
    }
  }, [user]);

    useEffect(() => {
    const getFavList = async () => {
      setFavLoading(true);
      const results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getFavourites?email=${
          encodeURIComponent(user.userId)
        }&favList=${encodeURIComponent(true)}`,
        { headers: { Authorization: "xxx" } }
      );
      setFilterList([...results.data.finalResult]);
      setFavLoading(false);
    };
    if (user && favInitialLoad) {
      getFavList();
    }
  }, [user]);



  const isMobile = useIsMobile()
  const handleFav = async (id, favourite) => {
    setFavScrollPosition(scrollableDivRef.current.scrollTop);
    setHandleFavLoading(true);
    const results = await axios.get(
      `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getFavourites?id=${encodeURIComponent(id)}&favourite=${encodeURIComponent(favourite)}&email=${encodeURIComponent(user.userId)}`,
      { headers: { Authorization: "xxx" } }
    );
    if (!favourite) {
      setFilterList((prevValue) => {
        return prevValue.filter((item) => {
          return item !== id;
        });
      });
        setFavData((prevValue) => {
        return prevValue.filter((item) => {
          return item['item']['uuid'] !== id;
        });
      });
    } else {
      setFilterList([...filterList, id]);
    }
    setHandleFavLoading(false);
  };

  const loadMoreData = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let results;

      results = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getFavourites?email=${
          encodeURIComponent(user.userId)
        }&limit=${encodeURIComponent(limit)}&lastEvaluatedKey=${encodeURIComponent(JSON.stringify(
          favLastEvaluatedKey
        ))}`,
        { headers: { Authorization: "xxx" } }
      );
      setFavLastEvaluatedKey(results.data.lastEvaluatedKey);
      if (!results.data.lastEvaluatedKey) {
        setFavHasMore(false);
      } else {
        setFavHasMore(true);
      }
      setFavData([...favData, ...results.data.finalResult]);
      setLoading(false);
      setFavScrollPosition(scrollPosition);
      setFavInitialLoad(false)
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };
  useEffect(() => {
    if(favInitialLoad){
      loadMoreData();
    }
  }, [user]);

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
       {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px' }}>
              <Menu
                onClick={(event) => handleNavigation(event)}
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={["6"]}
                items={items}
                style={{ minWidth: 0, flex: "auto",background: "#6366F1" }}
              />
            </Header>}
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
            style={{ overflowX: "hidden",background: "#F9FAFB", }}
            dataLength={favData.length}
            next={() => {
              setScrollLoadMoreData(true);
              loadMoreData();
            }}
            hasMore={favHasMore}
            loader={
              <Skeleton
                paragraph={{
                  rows: 4,
                }}
                active
              />
            }
            endMessage={favData.length > 0 ? <Divider plain>It is all, nothing more</Divider> : ''}
            scrollableTarget="scrollableDiv"
          >
            {user && !loading && !chatLoading && !favLoading && (
              favData.length > 0 ? (<List
                grid={{  xs: 2,
                  gutter: 10,
                  sm: 3,
                  md: 3,
                  lg: 4,
                  xl: 6,
                  xxl: 6 }}
                dataSource={favData}
                renderItem={(item) => {
                  return (
                    <>
                      <List.Item key={item["item"]["id"]}>
                        <Card
                        hoverable
                        bodyStyle={{ padding: '15px 0px 0px 0px' }}
                        style={{   boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", padding: '10px'}}
                          onClick={() => {
                            setFavScrollPosition(
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
                                height: "20vh",
                                objectFit: "cover",
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
                                <HeartFilled style={{ color: '#10B981' }}></HeartFilled>
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
            {(loading || chatLoading || favLoading) && (
              <Skeleton
                paragraph={{
                  rows: 8,
                }}
                active
              />
            )}
              {
                handleFavLoading && (
                  <Spin fullscreen indicator={<LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />} />
                )
              }
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
          defaultSelectedKeys={["6"]}
          items={items}
          style={{ minWidth: 0, flex: "auto",background: "#6366F1" }}
        />
      </Footer>}
    </Layout>
  );
};
export default App;
