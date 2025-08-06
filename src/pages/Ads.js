import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Spin, Modal } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import { List, Skeleton, Empty } from "antd";
import { Card, Badge, Space, Row, Col } from "antd";
import { signInWithRedirect } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const { Content } = Layout;
const Ads = () => {
  const [loading, setLoading] = useState(false);
  const scrollableDivRef = useRef(null);
  const [chatLoading, setChatLoading] = useState(false);
  const {
    setAdScrollPosition,
    adScrollPosition,
    adInitialLoad,
    setAdInitialLoad,
    adData,
    setAdData,
    adHasMore,
    setAdHasMore,
    adLastEvaluatedKey,
    setAdLastEvaluatedKey,
    setUnreadChatCount,
    user,
  } = useContext(Context);
  const isModalVisibleRef = useRef(false);
  const errorSessionConfig = {
    title: "Session has expired.",
    content: "Please login again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: () => {
      isModalVisibleRef.current = false;
      signInWithRedirect();
    },
  };
  const errorConfig = {
    title: "An error has occurred.",
    content: "Please reload.",
    closable: false,
    maskClosable: false,
    okText: "Reload",
    onOk: () => {
      isModalVisibleRef.current = false;
      window.location.reload();
    },
  };
  const isMobile = useIsMobile();
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
    if (width < 992) return 3; // md
    if (width < 1200) return 4; // lg
    if (width < 1600) return 4; // xl
    return 6; // xxl
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
      if (adHasMore && currentWidth > prevWidth) {
        setAdData([]);
        setAdLastEvaluatedKey(null);
        setAdInitialLoad(true);
        updateLimit();
      }
      prevWidth = currentWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adHasMore]);

  const handleImageLoad = (uuid) => {
    setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
  };

  useEffect(() => {
    if (scrollableDivRef.current && !loading && !chatLoading) {
      requestAnimationFrame(() => {
        if (scrollableDivRef.current) {
          scrollableDivRef.current.scrollTo(0, adScrollPosition);
        }
      });
    }
  }, [adScrollPosition, loading, adData, chatLoading]);

  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);

  const loadMoreData = async () => {
    const scrollPosition = scrollableDivRef.current.scrollTop;
    try {
      setLoading(true);
      let results;
      results = await callApi(
        `https://api.reusifi.com/prod/getProductsEmail?limit=${encodeURIComponent(
          limit
        )}&lastEvaluatedKey=${encodeURIComponent(
          JSON.stringify(adLastEvaluatedKey)
        )}&email=${encodeURIComponent(user.userId)}`,
        "GET"
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
      setAdInitialLoad(false);
    } catch (err) {
      setLoading(false);
      // message.error("An Error has occurred")
      if (isModalVisibleRef.current) {
        return;
      }
      isModalVisibleRef.current = true;
      if (err?.status === 401) {
        Modal.error(errorSessionConfig);
      } else {
        Modal.error(errorConfig);
      }
      return;
    }
  };

  useEffect(() => {
    if (user && adInitialLoad && limit) {
      try {
        setChatLoading(true);
        setLoading(true);
        const getChatCount = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );

        const loadMoreDataPromise = loadMoreData();

        Promise.all([getChatCount, loadMoreDataPromise])
          .then(([chatResult]) => {
            setUnreadChatCount(chatResult.data.count);
          })
          .catch((err) => {
            if (isModalVisibleRef.current) {
              return;
            }
            isModalVisibleRef.current = true;
            if (err?.status === 401) {
              Modal.error(errorSessionConfig);
            } else {
              Modal.error(errorConfig);
            }
          })
          .finally(() => {
            setChatLoading(false);
            setLoading(false);
          });
      } catch (err) {
        // message.error("An Error has occurred")
        if (isModalVisibleRef.current) {
          return;
        }
        isModalVisibleRef.current = true;
        if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
        return;
      }
    }
  }, [user, adInitialLoad, limit]);

  const navigate = useNavigate();
  return (
    <Layout
      style={{
        height: "100dvh",
        overflow: "hidden",
        background: "#F9FAFB",
      }}
    >
      {!isMobile && (
        <HeaderWrapper
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0px",
            padding: "0px",
            height: "50px",
          }}
        >
          <MenuWrapper
            setScrollPosition={setAdScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={["4"]}
            isMobile={isMobile}
          />
        </HeaderWrapper>
      )}
      <Content>
        <div
          className="hide-scrollbar overflow-auto"
          id="scrollableDiv"
          ref={scrollableDivRef}
          style={{
            height: "100%",
            background: "#F9FAFB",
            borderRadius: "0px",
            overflowY: "scroll",
            overflowX: "hidden",
            padding: "15px 15px 70px 15px",
          }}
        >
          <InfiniteScroll
            style={{ overflowX: "hidden", background: "#F9FAFB" }}
            dataLength={adData.length}
            next={() => {
              loadMoreData();
            }}
            hasMore={adHasMore}
            scrollableTarget="scrollableDiv"
          >
            {user &&
              !loading &&
              !chatLoading &&
              (adData.length > 0 ? (
                <List
                  grid={{
                    xs: 2,
                    sm: 3,
                    md: 4,
                    lg: 5,
                    xl: 6,
                    xxl: 7,
                    gutter: 10,
                  }}
                  dataSource={adData}
                  renderItem={(item) => {
                    return (
                      <>
                        <List.Item
                          key={item["item"]["uuid"]}
                          style={{ display: "flex", justifyContent: "center" }}
                        >
                          <Card
                            style={{ height: "325px", width: "186px" }}
                            hoverable
                            bodyStyle={{ padding: "10px 10px 10px 10px" }}
                            onClick={() => {
                              setAdScrollPosition(
                                scrollableDivRef.current.scrollTop
                              );
                              navigate("/details", {
                                state: { item, ad: true },
                              });
                            }}
                            cover={
                              <>
                                {!loadedImages[item["item"]["uuid"]] && (
                                  <div
                                    style={{
                                      height: "250px",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      backgroundColor: "#f0f0f0",
                                    }}
                                  >
                                    <Spin
                                      indicator={
                                        <LoadingOutlined
                                          style={{
                                            fontSize: 48,
                                            color: "#52c41a",
                                          }}
                                          spin
                                        />
                                      }
                                    />
                                  </div>
                                )}
                                <img
                                  src={item["images"][0]}
                                  alt={item["item"]["title"]}
                                  style={{
                                    maxHeight: "260px",
                                    objectFit: "contain",
                                    display: loadedImages[item["item"]["uuid"]]
                                      ? "block"
                                      : "none",
                                  }}
                                  onLoad={() =>
                                    handleImageLoad(item["item"]["uuid"])
                                  }
                                  onError={() =>
                                    handleImageLoad(item["item"]["uuid"])
                                  }
                                />
                              </>
                            }
                          >
                            <Card.Meta
                              description={
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "5px",
                                  }}
                                >
                                  <div>
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        color: "#111827",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        fontWeight: "300",
                                      }}
                                    >
                                      {capitalize(item["item"]["title"])}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex" }}>
                                    <span
                                      style={{
                                        fontSize: "15px",
                                        color: "#237804",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                      }}
                                    >
                                      ₹{item["item"]["price"]}
                                    </span>
                                  </div>
                                </div>
                              }
                            />
                          </Card>
                        </List.Item>
                      </>
                    );
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "50vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Empty description="No items found" />
                </div>
              ))}
            {(loading || chatLoading) && (
              <Row gutter={[10, 10]}>
                {Array.from({ length: limit }).map((_, index) => {
                  return (
                    <Col
                      key={index}
                      xs={12}
                      sm={8}
                      md={6}
                      lg={5}
                      xl={4}
                      xxl={4}
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <Skeleton.Node
                        style={{ height: "300px", width: "186px" }}
                        active
                      />
                    </Col>
                  );
                })}
              </Row>
            )}
          </InfiniteScroll>
        </div>
      </Content>
      {isMobile && (
        <FooterWrapper>
          <MenuWrapper
            setScrollPosition={setAdScrollPosition}
            scrollableDivRef={scrollableDivRef}
            defaultSelectedKeys={["4"]}
            isMobile={isMobile}
          />
        </FooterWrapper>
      )}
    </Layout>
  );
};
export default Ads;
