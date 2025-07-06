import React, {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Breadcrumb, Layout, Menu, Spin, theme, Image } from "antd";
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
import { Button, Input, Select, Space, Empty } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton, Radio } from "antd";
import { Card, Typography } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import debounce from "lodash/debounce";
import { states, districts, districtMap } from "../helpers/locations";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { useSessionCheck } from "../hooks/sessionCheck";
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
const { Text, Link } = Typography;
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
    priceFilter,
    setPriceFilter,
    scrollPosition,
    setScrollPosition,
    initialLoad,
    setInitialLoad,
    lastEvaluatedKey,
    setLastEvaluatedKey,
    lastEvaluatedKeys,
    setLastEvaluatedKeys,
    setExhaustedShards,
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
    setFavLastEvaluatedKey,
    setChatLastEvaluatedKey,
    setAdLastEvaluatedKey,
    setContactInitialLoad,
    setIChatInitialLoad,
    setAddProductInitialLoad
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
  const [loadedImages, setLoadedImages] = useState({});

const handleImageLoad = (uuid) => {
  setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
};
const { token } = useSessionCheck()
useEffect(() => {
  if (scrollableDivRef.current && !chatLoading && !favLoading && !handleFavLoading && !loading) {
    const el = scrollableDivRef.current;
    if (el.scrollHeight <= el.clientHeight && hasMore) {
      loadMoreData();
    }
  }
}, [chatLoading,favLoading,handleFavLoading,loading,data]); 

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    getUser()
  },[])

  useEffect(() => {
  if (scrollableDivRef.current && !chatLoading && !favLoading && !handleFavLoading && !loading) {
    requestAnimationFrame(() => {
      scrollableDivRef.current.scrollTo(0, scrollPosition);
      setScrollLoadMoreData(false);
    });
  }
}, [scrollPosition,chatLoading,favLoading,handleFavLoading,loading,scrollLoadMoreData,data]);

  useEffect(() => {
    const getChatCount = async () => {
      try {
        setChatLoading(true);
        const result = await axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getChat?userId1=${
            encodeURIComponent(user.userId)
          }&count=${encodeURIComponent(true)}`,
          { headers: { Authorization: token } }
        );
        setUnreadChatCount(result.data.count);
        setChatLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (user && initialLoad && token) {
      getChatCount();
    }
  }, [user,token, initialLoad]);

  const handleChange = (value, type) => {
    setData([]);
    setLastEvaluatedKeys({});
    setExhaustedShards({})
    setInitialLoad(true);
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
        `https://dwo94t377z7ed.cloudfront.net/prod/getFavourites?email=${
          encodeURIComponent(user.userId)
        }&favList=${encodeURIComponent(true)}`,
        { headers: { Authorization: token } }
      );
      setFilterList([...results.data.finalResult]);
      setFavLoading(false);
    };
    if (user && initialLoad && token) {
      getFavList();
    }
  }, [user, token, initialLoad]);

  const handleFav = async (id, favourite) => {
    setScrollPosition(scrollableDivRef.current.scrollTop);
    setFavInitialLoad(true);
    setHandleFavLoading(true);
    const results = await axios.get(
      `https://dwo94t377z7ed.cloudfront.net/prod/getFavourites?id=${encodeURIComponent(id)}&favourite=${encodeURIComponent(favourite)}&email=${encodeURIComponent(user.userId)}`,
      { headers: { Authorization: token } }
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
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let results;
      if (search) {
        console.log(JSON.stringify(lastEvaluatedKeys))
        results = await axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getDress?limit=${encodeURIComponent(limit)}&lastEvaluatedKeys=${encodeURIComponent(JSON.stringify(
            lastEvaluatedKeys
          ))}&search=${encodeURIComponent(search.trim())}&location=${encodeURIComponent(JSON.stringify(
            location
          ))}&priceFilter=${encodeURIComponent(priceFilter)}`,
          { headers: { Authorization: token } }
        );
        setLastEvaluatedKeys(results.data.lastEvaluatedKeys);
        setExhaustedShards(results.data.exhaustedShards)
        // console.log(results.data)
        if (results.data.hasMore) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      } else {
        results = await axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getDress?limit=${encodeURIComponent(limit)}&lastEvaluatedKeys=${encodeURIComponent(JSON.stringify(
            lastEvaluatedKeys
          ))}&location=${encodeURIComponent(JSON.stringify(location))}&priceFilter=${encodeURIComponent(priceFilter)}`,
          { headers: { Authorization: token } }
        );
        setLastEvaluatedKeys(results.data.lastEvaluatedKeys);
        setExhaustedShards(results.data.exhaustedShards)
        if (results.data.hasMore) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      }
      setData([...data, ...results.data.finalResult]);
      setLoading(false);
      setScrollPosition(scrollPosition);
      setInitialLoad(false);
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
    if(token && initialLoad && (search || Object.values(location).some((value) => value) || priceFilter)){
      setLoading(true)
      timer.current = setTimeout(() => {
      loadMoreData();
      }, 1500);
    }
    else{
      if(initialLoad && token){
        loadMoreData()
      }
    }
    // Cleanup function to clear the timeout on component unmount or before next effect
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [search, location, priceFilter,token]);

  const navigate = useNavigate();
  const isMobile = useIsMobile()
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

  const onChangePriceFilter = (event) => {
    setLastEvaluatedKeys({});
    setExhaustedShards({})
    setData([]);
    setInitialLoad(true);
    setPriceFilter(event.target.value);
  };
  return (
    <Layout style={{ height: "100vh", overflow: "hidden", background:"#F9FAFB" }}>
         {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px'  }}>
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["1"]}
          items={items}
          style={{ minWidth: 0, flex: "auto", background: "#6366F1" }}
        />
      </Header>}
      <div
        style={{
          padding: "10px",
          background: "white",
          position: "sticky",
          top: "0px",
          zIndex: 1,
          background: "#F9FAFB",
        }}
      >
        <Space.Compact size="large" style={{ height: 'fit-content' }}>
          <Input
            addonBefore={<SearchOutlined />}
            value={search}
            onChange={(event) => {
              setLastEvaluatedKeys({});
              setExhaustedShards({})
              setData([]);
              setInitialLoad(true);
              setSearch(event.target.value);
            }}
            placeholder="Search"
            style={{ width: !isMobile ? "30vw" : "60vw" ,height: 'fit-content', boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", borderRadius: "7px"}}
          />
          <Space.Compact size="large" style={{ display: "flex", flexDirection: !isMobile ? 'row' : "column" }}>
                      <Select
            onChange={(value) => {
              handleChange(value, "state");
              let districts = districtMap();
              setDistricts(districts[value]);
            }}
            showSearch
            style={{
              width: !isMobile ? "20vw" : "35vw",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              borderRadius: "7px"
            }}
            disabled={!search}
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
                width: !isMobile ? "20vw" : "35vw",
              }}
              disabled={!search}
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
        </Space.Compact>
        <Space.Compact size="large" style={{ padding: "10px",display: "flex", alignItems: "center" }}>
          <Text strong>Price</Text>
          &nbsp; &nbsp;
          <Radio.Group  disabled={!search} style={{  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }} buttonStyle="solid" onChange={onChangePriceFilter} value={priceFilter}>
            <Radio.Button value={"true"}>Low to High</Radio.Button>
            <Radio.Button value={"false"}>High to Low</Radio.Button>
          </Radio.Group>
        </Space.Compact>
      </div>
      <Content style={{ padding: "0 15px" }}>
        <div
          className="hide-scrollbar overflow-auto"
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            padding: 5,
            height: "100%",
            background: "#F9FAFB",
            borderRadius: '0px',
            overflowY: "scroll",
            overflowX: "hidden",
            paddingBottom: "60px",
          }}
        >
          <InfiniteScroll
            style={{ overflowX: "hidden", background:"#F9FAFB" }}
            dataLength={data.length}
            next={() => {
              setScrollLoadMoreData(true);
              loadMoreData();
            }}
            hasMore={hasMore}
            loader={
              <Skeleton
                paragraph={{
                  rows: 4,
                }}
                active
              />
            }
            endMessage={data.length > 0 ? <Divider plain>It is all, nothing more</Divider> : ''}
            scrollableTarget="scrollableDiv"
          >
            {user && !loading && !chatLoading && !favLoading && (
              data.length > 0 ? (<List
                grid={{
                  xs: 2,
                  sm: 3,
                  md: 4,
                  lg: 5,
                  xl: 6,
                  xxl: 8,
                  gutter: 10,
                }}
                dataSource={data}
                renderItem={(item) => {
                  return (
                    <>
                      <List.Item key={item["item"]["uuid"]}>
                        <Card hoverable bodyStyle={{ padding: '15px 0px 0px 0px' }} style={{   boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", padding: '10px' }}
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
                              <div key={item["item"]["uuid"]} style={{ width: "100%", height: "100%" }}>
          {!loadedImages[item["item"]["uuid"]] && (
            <div
              style={{
                width: "100%",
                height: "200px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f0f0f0",
              }}
            >
              <Spin
                indicator={
                  <LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />
                }
              />
            </div>
          )}
          <img
            src={item["images"][0]}
            style={{
              display: loadedImages[item["item"]["uuid"]] ? "block" : "none",
              width: "100%",
              height: "200px",
              objectFit: "cover",
            }}
              onLoad={() => handleImageLoad(item.item.uuid)}
              onError={() => handleImageLoad(item.item.uuid)}
          />
        </div>
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
                              style={{
                                display: "flex",
                                justifyContent: "end",
                              }}
                            >
                              {filterList.includes(item["item"]["uuid"]) && (
                                <HeartFilled style={{ color: '#10B981' }} ></HeartFilled>
                              )}
                              {!filterList.includes(item["item"]["uuid"]) && (
                                <HeartOutlined></HeartOutlined>
                              )}
                            </div>
                          )}
                          {
                            item["item"]["email"] === user.userId && (
                              <div style={{ display: 'flex', visibility: 'hidden' }}>
                                <HeartFilled style={{ color: '#10B981' }} ></HeartFilled>
                              </div>
                            )
                          }
                        </Card>
                      </List.Item>
                    </>
                  );
                }}
              />
            ):  (<div
                style={{
                  height: "50vh",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Empty description="No items found" />
              </div>))}
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
          defaultSelectedKeys={["1"]}
          items={items}
          style={{ minWidth: 0, flex: "auto",background: "#6366F1" }}
        />
      </Footer>}
    </Layout>
  );
};
export default App;
