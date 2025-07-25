import React, {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, Layout, Menu, Spin, theme, message, Modal } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  MailOutlined,
  HeartOutlined,
  ProductFilled,
  LoadingOutlined,
  MailFilled,
  HeartFilled,
  MenuOutlined
} from "@ant-design/icons";
import { Button, Input, Select, Space } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton, Empty } from "antd";
import { Card, Badge } from "antd";
import axios from "axios";
import { getCurrentUser, signInWithRedirect, signOut } from "@aws-amplify/auth";
import debounce from "lodash/debounce";
import { states, districts, districtMap } from "../helpers/locations";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
const IconText = [
  "Home",
  "Sell",
  "Chats",
  "My Ads",
  "Favourites",
  "",
];
const { Meta } = Card;
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const { Header, Content, Footer } = Layout;
const Ads = () => {
  const [loading, setLoading] = useState(false);
  const [scrollLoadMoreData, setScrollLoadMoreData] = useState(false);
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
    setContactInitialLoad,
    setIChatInitialLoad,
    setAddProductInitialLoad,
    setUnreadChatCount,
    unreadChatCount,
    token
  } = useContext(Context);
    
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
  const isMobile = useIsMobile()
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
          
          const [limit, setLimit] = useState(0); // default
          
          useEffect(() => {
             let prevWidth = window.innerWidth;
            const updateLimit = () => {
              const newLimit = calculateLimit();
              setLimit(newLimit);
            };
            updateLimit(); // on mount
            const handleResize = () => {
               const currentWidth = window.innerWidth;
              if (adHasMore && currentWidth !== prevWidth) {
                 prevWidth = currentWidth;
                setAdData([])
                setAdLastEvaluatedKey(null)
                setAdInitialLoad(true)
                updateLimit();
              }
            };
            window.addEventListener("resize",handleResize);
            return () => window.removeEventListener("resize", handleResize);
          }, [adHasMore]);
                      
        
    
    const handleImageLoad = (uuid) => {
      setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
    };

    const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    HeartFilled,
    MenuOutlined,
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
    else if(index === 5){
      return{
        key: String(index + 1),
        icon: divHtml,
            children: [
      {
        key: '6-1',
        label: 'Contact',
        icon: React.createElement(MailFilled)
      },
      {
        key: '6-2',
        label: 'Sign out',
        icon: React.createElement(LogoutOutlined)
      },
    ],
      }
    }
      return {
      key: String(index + 1),
      icon: divHtml
    };
  });
  
  useEffect(() => {
      const getUser = async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
      getUser()
    },[])

      // useEffect(() => {
      //   if (scrollableDivRef.current && !loading && !chatLoading) {
      //     const el = scrollableDivRef.current;
      //     if (el.scrollHeight <= el.clientHeight && adHasMore && limit) {
      //       loadMoreData();
      //     }
      //   }
      // }, [loading,adData,chatLoading,limit]); 

        useEffect(() => {
        if (scrollableDivRef.current &&  !loading && !chatLoading) {
          requestAnimationFrame(() => {
            scrollableDivRef.current.scrollTo(0, adScrollPosition);
            setScrollLoadMoreData(false);
          });
        }
      }, [adScrollPosition,loading,scrollLoadMoreData,adData,chatLoading]);

  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);

  const loadMoreData = async () => {
    const scrollPosition = scrollableDivRef.current.scrollTop;
    try {
      setLoading(true);
      let results;
      results = await callApi(`https://api.reusifi.com/prod/getProductsEmail?limit=${encodeURIComponent(limit)}&lastEvaluatedKey=${encodeURIComponent(JSON.stringify(
          adLastEvaluatedKey
        ))}&email=${encodeURIComponent(user.userId)}`,'GET')
      setAdLastEvaluatedKey(results.data.lastEvaluatedKey);
      if (!results.data.lastEvaluatedKey) {
        setAdHasMore(false);
      } else {
        setAdHasMore(true);
      }

      setAdData([...adData, ...results.data.finalResult]);
      setLoading(false);
      setAdScrollPosition(scrollPosition);
      setAdInitialLoad(false)
    } catch (err) {
      setLoading(false);
      // message.error("An Error has occurred")
       if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
      console.log(err);
    }
  };

  useEffect(() => {
  if (user && adInitialLoad && limit) {
    try{
          setChatLoading(true);
    setLoading(true);
      const getChatCount = callApi(`https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(user.userId)}&count=${encodeURIComponent(true)}`,'GET')

    const loadMoreDataPromise = loadMoreData()


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
        console.error(err);
      })
      .finally(() => {
        setChatLoading(false);
        setLoading(false);
      });
    }
    catch(err){
      // message.error("An Error has occurred")
       if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
    }
  }
}, [user, adInitialLoad,limit]);

  const navigate = useNavigate();
  const handleNavigation = async (event) => {
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
        navigate("/favourite");
        break;
      case "6-1":
        navigate("/contact");
        break;
      case "6-2":
        await signOut();
        break;
    }
  };
  useEffect(() => {
    scrollableDivRef.current.scrollTo(0, scrollPosition);
  }, [scrollPosition]);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ height: "100dvh", overflow: "hidden",  background: "#F9FAFB", }}>
      
         {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px', padding: '0px', height: '50px' }}>
                    <Menu
                      onClick={(event) => handleNavigation(event)}
                      theme="dark"
                      mode="horizontal"
                      defaultSelectedKeys={["4"]}
                      items={items}
                      style={{ minWidth: 0,justifyContent: 'space-around',
            flex: 1,background: "#6366F1" }}
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
         className="hide-scrollbar overflow-auto"
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
            scrollableTarget="scrollableDiv"
          >
            {user && !loading && !chatLoading && (
              adData.length > 0 ? (<List
                  grid={{
                  xs: 2,
                  sm: 3,
                  md: 4,
                  lg: 5,
                  xl: 6,
                  xxl: 8,
                  gutter: 10,
                }}
                dataSource={adData}
                renderItem={(item) => {
                  return (
                    <>
                      <List.Item key={item["item"]["uuid"]}>
                        <Card
                        hoverable
                        bodyStyle={{ padding: '15px 0px 0px 0px' }}
                        style={{  borderRadius: '12px', boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", padding: '10px' }}
                          onClick={() => {
                            setAdScrollPosition(
                              scrollableDivRef.current.scrollTop
                            );
                            navigate("/details", { state: { item, ad: true } });
                          }}
                          cover={
                              <div key={item["item"]["uuid"]} style={{ width: "100%", height: "100%",display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                            <span style={{ fontSize: "16px", color: "#111827" }}>{capitalize(item["item"]["title"])}</span>
                          </div>
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            <span style={{ fontSize: "15px", color: "#4B5563" }}>₹{item["item"]["price"]}</span>
                          </div>
                            <div style={{ display: 'flex', visibility: 'hidden' }}>
                              <HeartFilled style={{ color: '#10B981' }} ></HeartFilled>
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
            {(loading || chatLoading) &&
             <Skeleton
                paragraph={{
                  rows: 4,
                }}
                active
              />
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
          height: '50px'
        }}
      >
        <Menu
          onClick={(event) => handleNavigation(event)}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["4"]}
          items={items}
          style={{ minWidth: 0, justifyContent: 'space-around',
            flex: 1,background: "#6366F1" }}
        />
      </Footer>}
    </Layout>
  );
};
export default Ads;
