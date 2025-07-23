import React, {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Breadcrumb, Layout, Menu, Spin, theme, Image,message, Modal } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  SearchOutlined,
  ProductFilled,
  MailOutlined,
  MailFilled,
  HeartOutlined,
  HeartFilled,
  LoadingOutlined
} from "@ant-design/icons";
import { Button, Input, Select, Space, Empty } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton, Radio } from "antd";
import { Card, Typography } from "antd";
import axios from "axios";
import { getCurrentUser, signInWithRedirect, signOut } from "@aws-amplify/auth";
import debounce from "lodash/debounce";
import { states, districts, districtMap } from "../helpers/locations";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "My Ads",
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
const Home = () => {
  const [loading, setLoading] = useState(false);
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
    setAddProductInitialLoad,
    unreadChatCount,
    setUnreadChatCount,
    exhaustedShards,
    token
  } = useContext(Context);
  const [handleFavLoading, setHandleFavLoading] = useState(false);

    const isMobile = useIsMobile()

    const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    MailFilled,
    HeartFilled,
    LogoutOutlined,
  ].map((icon, index) => {
    let divHtml
    if(isMobile){
      divHtml =  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
              <span style={{ fontSize: '16px', marginTop: '0px' }}>{React.createElement(icon)}</span>
              <span style={{ fontSize: '10px', marginTop: '5px' }}>{IconText[index]}</span>
            </div>
    }
    else{
      divHtml = <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize: 10 }}>
        <span style={{ fontSize: '20px', marginTop: '0px' }}>{React.createElement(icon)}</span>
        <span style={{ fontSize: '15px', marginTop: '5px', marginLeft: '5px' }}>{IconText[index]}</span>
      </div>
    }
    if (index === 2) {
      return {
        key: String(index + 1),
        icon: (
          <Badge dot={unreadChatCount}>
            {divHtml}
          </Badge>
        )
      };
    }
      return {
      key: String(index + 1),
      icon: divHtml
    };
  });
  const [loadedImages, setLoadedImages] = useState({});

  const calculateLimit = () => {
  const viewportHeight = window.innerHeight;
  const itemHeight = 300; // adjust if needed
  const rowsVisible = Math.ceil(viewportHeight / itemHeight);
  const columns = getColumnCount(); // depending on screen size (see below)
  return rowsVisible * columns * 8;
};

const getColumnCount = () => {
  const width = window.innerWidth;
  if (width < 576) return 2; // xs
  if (width < 768) return 3; // sm
  if (width < 992) return 4; // md
  if (width < 1200) return 5; // lg
  if (width < 1600) return 6; // xl
  return 8; // xxl
};

const errorSessionConfig = {
  title: 'Session has expired.',
  content: 'Please login again.',
  closable: false,
  maskClosable: false,
  okText: 'Login',
  onOk: async () => {
    await signInWithRedirect()
  }
}
const errorConfig = {
  title: 'An error has occurred.',
  content: 'Please try again later.',
  closable: false,
  maskClosable: false,
  okText: 'Close',
  onOk: () => {
    navigate('/')
  }
}
const [limit, setLimit] = useState(0); // default

  useEffect(() => {
    const updateLimit = () => {
      const newLimit = calculateLimit();
      setLimit(newLimit);
    };
    updateLimit(); // on mount
    const handleResize = () => {
      if (hasMore) {
         setData([]);
        setLastEvaluatedKeys({});
        setExhaustedShards({})
        setInitialLoad(true)
        updateLimit();
      }
    };
    window.addEventListener("resize",handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasMore]);

const handleImageLoad = (uuid) => {
  setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
};

// useEffect(() => {
//   if (scrollableDivRef.current && !chatLoading && !favLoading && !handleFavLoading && !loading) {
//     const el = scrollableDivRef.current;
//     if (el.scrollHeight <= el.clientHeight && hasMore && limit) {
//       loadMoreData();
//     }
//   }
// }, [chatLoading,favLoading,handleFavLoading,loading,data,limit]); 

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


  const handleFav = async (selectedItem, favourite) => {
    try{
    setScrollPosition(scrollableDivRef.current.scrollTop);
    // setFavInitialLoad(true);
    setHandleFavLoading(true);
    if(favourite){
      const results = await callApi( `https://api.reusifi.com/prod/getFavouritesAdd?id=${encodeURIComponent(selectedItem["item"]["uuid"])}&favourite=${encodeURIComponent(favourite)}&email=${encodeURIComponent(user.userId)}`,'GET')
    }
    else{
      const results = await callApi( `https://api.reusifi.com/prod/getFavouritesRemove?id=${encodeURIComponent(selectedItem["item"]["uuid"])}&favourite=${encodeURIComponent(favourite)}&email=${encodeURIComponent(user.userId)}`,'GET')
    }
    if (!favourite) {
      setFilterList((prevValue) => {
        return prevValue.filter((item) => {
          return item !== selectedItem["item"]["uuid"];
        });
      });
       setFavData((prevValue) => {
        return prevValue.filter((item) => {
          return item['item']['uuid'] !== selectedItem["item"]["uuid"];
        });
      });
    } else {
      setFilterList([...filterList, selectedItem["item"]["uuid"]]);
      setFavData((prevValue) => [...prevValue,selectedItem])
    }
    setHandleFavLoading(false);
    }
    catch(err){
      if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        message.error("An Error has occurred")
      }
    }
  };

  const loadMoreData = async () => {
    try {
      const scrollPosition = scrollableDivRef.current.scrollTop;
      setLoading(true);
      let results;
      if (search) {
        results = await callApi(`https://api.reusifi.com/prod/getProductsSearch?limit=${encodeURIComponent(limit)}&lastEvaluatedKeys=${encodeURIComponent(JSON.stringify(
            lastEvaluatedKeys
          ))}&exhaustedShards=${encodeURIComponent(JSON.stringify(exhaustedShards))}&search=${encodeURIComponent(search.trim())}&location=${encodeURIComponent(JSON.stringify(
            location
          ))}&priceFilter=${encodeURIComponent(priceFilter)}`,'GET')
        setLastEvaluatedKeys(results.data.lastEvaluatedKeys);
        setExhaustedShards(results.data.exhaustedShards)
        if (results.data.hasMore) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      } else {
        results = await callApi(`https://api.reusifi.com/prod/getProducts?limit=${encodeURIComponent(limit)}&lastEvaluatedKeys=${encodeURIComponent(JSON.stringify(
            lastEvaluatedKeys
          ))}&location=${encodeURIComponent(JSON.stringify(location))}&exhaustedShards=${encodeURIComponent(JSON.stringify(exhaustedShards))}&priceFilter=${encodeURIComponent(priceFilter)}`,'GET')
        setLastEvaluatedKeys(results.data.lastEvaluatedKeys);
        setExhaustedShards(results.data.exhaustedShards)
        if (results.data.hasMore) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      }
      const notUserData = results.data.finalResult.filter((item) => user.userId !== item["item"]["email"])
      setData([...data, ...notUserData]);
      const favList = notUserData.map((item) => item["item"]["uuid"])
      const favResult = await callApi(`https://api.reusifi.com/prod/getFavouritesList?email=${encodeURIComponent(user.userId)}&favList=${encodeURIComponent(JSON.stringify(favList))}`, 'GET',true)
      setFilterList([...filterList, ...favResult.data.finalResult]);
      setLoading(false);
      setScrollPosition(scrollPosition);
      setInitialLoad(false);
    } catch (err) {
      setLoading(false);
       if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
    }
  };

    useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    if(limit && initialLoad && ((search &&  !/^\s*$/.test(search)) || Object.values(location).some((value) => value) || priceFilter)){
      setLoading(true)
      timer.current = setTimeout(() => {
      loadMoreData();
      }, 300);
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [search, location, priceFilter,limit]);

  useEffect(() => {
  if (user && initialLoad && limit && !search) {
    try{
    setChatLoading(true);
    setFavLoading(true);
    setLoading(true);
      const getChatCount = callApi(`https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(user.userId)}&count=${encodeURIComponent(true)}`,'GET')
    const loadMoreDataPromise =  loadMoreData();

    Promise.all([getChatCount, loadMoreDataPromise])
      .then(([chatResult]) => {
        setUnreadChatCount(chatResult.data.count);
      })
      .catch((err) => {
         if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
        console.log(err);
      })
      .finally(() => {
        setChatLoading(false);
        setFavLoading(false);
        setLoading(false);
      });
    }
    catch(err){
       if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
    }
  }
}, [user, initialLoad, limit, search]);


  const navigate = useNavigate();
  const handleNavigation = async (event) => {
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
        await signOut();
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
    <Layout style={{ height: "100dvh", overflow: "hidden", background:"#F9FAFB" }}>
      
         {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px' , height: '50px' }}>
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["1"]}
          items={items}
          style={{ minWidth: 0, justifyContent: 'space-around',
            flex: 1, background: "#6366F1" }}
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
              setSearch(event.target.value);
              if(!event.target.value){
                setLocation({ state: null, district: null})
                setPriceFilter(null)
                setDistricts([])
                setLastEvaluatedKeys({});
                setExhaustedShards({})
                setData([]);
                setInitialLoad(true);
              }
              else if(!/^\s*$/.test(event.target.value)){
                setLastEvaluatedKeys({});
                setExhaustedShards({})
                setData([]);
                setInitialLoad(true);
              }
            }}
            placeholder="Search"
            style={{ width: (search && ! /^\s*$/.test(search)) ? "60vw": "90vw" , height: 'fit-content', boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", borderRadius: "7px"}}
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
              borderRadius: "7px",
              visibility: (!search ||  /^\s*$/.test(search)) ? 'hidden' : 'visible'
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
                width: !isMobile ? "20vw" : "35vw",
                visibility: (!search ||  /^\s*$/.test(search)) ? 'hidden' : 'visible'
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
        </Space.Compact>
        <Space.Compact size="large" style={{ padding: "10px",display: "flex", alignItems: "center", visibility: (!search ||  /^\s*$/.test(search)) ? 'hidden' : 'visible' }}>
          <Text strong>Price</Text>
          &nbsp; &nbsp;
          <Radio.Group  style={{  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }} buttonStyle="solid" onChange={onChangePriceFilter} value={priceFilter}>
            <Radio.Button value={"LOWTOHIGH"}>Low to High</Radio.Button>
            <Radio.Button value={"HIGHTOLOW"}>High to Low</Radio.Button>
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
                        <Card hoverable bodyStyle={{ padding: '15px 0px 0px 0px' }} style={{  borderRadius: '12px',  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", padding: '10px' }}
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
                              <div key={item["item"]["uuid"]} style={{ width: "100%", height: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                                alt={item["item"]["title"]}
                                style={{
                                  display: loadedImages[item["item"]["uuid"]] ? "block" : "none",
                                  height: "200px",
                                  objectFit: "contain",
                                  borderRadius: '5px'
                                }}
                                  onLoad={() => handleImageLoad(item["item"]["uuid"])}
                                  onError={() => handleImageLoad(item["item"]["uuid"])}
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
                            <b style={{ fontSize: "16px", color: "#111827" }}>{item["item"]["title"]}</b>
                          </div>
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            <b style={{ fontSize: "15px", color: "#4B5563" }}>₹{item["item"]["price"]}</b>
                          </div>
                          {item["item"]["email"] !== user.userId && (
                            <div
                              onClick={(event) => {
                                handleFav(
                                  item,
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
                                <HeartFilled style={{ color: '#9CA3AF' }}></HeartFilled>
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
                  rows: 4,
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
          height: '50px',
          padding: "0px",
        }}
      >
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["1"]}
          items={items}
          style={{ minWidth: 0, justifyContent: 'space-around',
            flex: 1,background: "#6366F1" }}
        />
      </Footer>}
    </Layout>
  );
};
export default Home;
