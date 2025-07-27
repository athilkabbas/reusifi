import React, { useContext, useEffect, useState } from "react";
import { Skeleton, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Badge } from "antd";
import { Layout, Menu, message, Modal, Popconfirm } from "antd";
import { Image, Space } from "antd";
import { Button, Typography } from "antd";
import { Carousel } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  MailFilled,
  HeartFilled,
  ProductFilled,
  LoadingOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { getCurrentUser, signInWithRedirect, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
const IconText = ["Home", "Sell", "Chats", "My Ads", "Favourites", ""];
const { TextArea } = Input;
const { Header, Content, Footer } = Layout;
const Details = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const { item, ad } = location.state || "";
  const [user, setUser] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatProductLoading, setChatProductLoading] = useState(false);
  const [chatProduct, setChatProduct] = useState(false);
  const [unblockLoading, setUnblockLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
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
  const {
    setChatData,
    setChatInitialLoad,
    setChatLastEvaluatedKey,
    setAdData,
    setCount,
    detailData,
    setDetailData,
    unreadChatCount,
    setUnreadChatCount,
  } = useContext(Context);
  const errorSessionConfig = {
    title: "Session has expired.",
    content: "Please login again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: async () => {
      await signInWithRedirect();
    },
  };
  const errorConfig = {
    title: "An error has occurred.",
    content: "Please try again later.",
    closable: false,
    maskClosable: false,
    okText: "Close",
    onOk: () => {
      navigate("/");
    },
  };

  const { Text } = Typography;

  const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    HeartFilled,
    MenuOutlined,
  ].map((icon, index) => {
    let divHtml;
    if (isMobile) {
      divHtml = (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 10,
          }}
        >
          <span style={{ fontSize: "16px", marginTop: "0px" }}>
            {React.createElement(icon)}
          </span>
          <span style={{ fontSize: "10px", marginTop: "5px" }}>
            {IconText[index]}
          </span>
        </div>
      );
    } else {
      divHtml = (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            fontSize: 10,
          }}
        >
          <span style={{ fontSize: "20px", marginTop: "0px" }}>
            {React.createElement(icon)}
          </span>
          <span
            style={{ fontSize: "15px", marginTop: "5px", marginLeft: "5px" }}
          >
            {IconText[index]}
          </span>
        </div>
      );
    }
    if (index === 2) {
      return {
        key: String(index + 1),
        icon: <Badge dot={unreadChatCount}>{divHtml}</Badge>,
      };
    } else if (index === 5) {
      return {
        key: String(index + 1),
        icon: divHtml,
        children: [
          {
            key: "6-1",
            label: "Contact",
            icon: React.createElement(MailFilled),
          },
          {
            key: "6-2",
            label: "Sign out",
            icon: React.createElement(LogoutOutlined),
          },
        ],
      };
    }
    return {
      key: String(index + 1),
      icon: divHtml,
    };
  });
  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user && item) {
      try {
        setChatLoading(true);
        setLoading(true);
        setChatProductLoading(true);
        const getChatCount = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );

        const getData = callApi(
          `https://api.reusifi.com/prod/getProductsId?id=${encodeURIComponent(
            item["item"]["uuid"]
          )}`,
          "GET"
        );
        const getChatProduct = callApi(
          `https://api.reusifi.com/prod/getChatProduct?userId1=${encodeURIComponent(
            user.userId
          )}&productId=${encodeURIComponent(item["item"]["uuid"])}`,
          "GET"
        );
        Promise.all([getChatCount, getData, getChatProduct])
          .then(([chatResult, result, chatProductResult]) => {
            setUnreadChatCount(chatResult.data.count);
            setDetailData(result.data);
            setChatProduct(chatProductResult.data);
          })
          .catch((err) => {
            if (err?.status === 401) {
              Modal.error(errorSessionConfig);
            } else {
              Modal.error(errorConfig);
            }
          })
          .finally(() => {
            setChatLoading(false);
            setChatProductLoading(false);
            setLoading(false);
          });
      } catch (err) {
        setChatLoading(false);
        setChatProductLoading(false);
        setLoading(false);
        if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
      }
    }
  }, [user, item]);

  // useEffect(() => {
  //   const getData = async () => {
  //     try {
  //       setLoading(true);
  //       const result = await callApi(`https://api.reusifi.com/prod/getProductsId?id=${encodeURIComponent(item["item"]["uuid"])}`,'GET')
  //       setLoading(false);
  //       setDetailData(result.data)
  //       if(result.data.length === 0){
  //         Modal.info(infoConfig)
  //       }
  //     } catch (err) {
  //       setLoading(false);
  //        if(err?.status === 401){
  //         Modal.error(errorSessionConfig)
  //       }
  //       else{
  //         Modal.error(errorConfig)
  //       }
  //       console.log(err);
  //     }
  //   };
  //   if (item) {
  //     getData();
  //   }
  // }, [item]);

  const handleChat = async () => {
    try {
      setUnblockLoading(true);
      await callApi(
        `https://api.reusifi.com/prod/unBlockUser?unBlock=${true}&userId1=${encodeURIComponent(
          user.userId
        )}&userId2=${encodeURIComponent(
          chatProduct.userId2
        )}&productId=${encodeURIComponent(item["item"]["uuid"])}`,
        "GET"
      );
      setChatData([]);
      setChatLastEvaluatedKey(null);
      setChatInitialLoad(true);
      setUnblockLoading(false);
      message.success("User unblocked");
      navigate("/chat", { state: { recipient: item } });
    } catch (err) {
      setUnblockLoading(false);
      if (err?.status === 401) {
        Modal.error(errorSessionConfig);
      } else {
        message.error("An Error has occurred");
      }
      console.log(err);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      let result = await callApi(
        `https://api.reusifi.com/prod/deleteAdNew?id=${encodeURIComponent(
          item["item"]["uuid"]
        )}&thumbnailS3Keys=${encodeURIComponent(
          JSON.stringify(detailData[0]["item"]["thumbnailS3Keys"])
        )}&viewingS3Keys=${encodeURIComponent(
          JSON.stringify(detailData[0]["item"]["viewingS3Keys"])
        )}`,
        "GET"
      );
      setCount((prevCount) => prevCount - 1);
      setAdData((prevValue) => {
        return prevValue.filter((value) => {
          return value["item"]["uuid"] !== item["item"]["uuid"];
        });
      });
      setDeleteLoading(false);
      message.success("Ad deleted");
      navigate("/ads");
    } catch (err) {
      setDeleteLoading(false);
      if (err?.status === 401) {
        Modal.error(errorSessionConfig);
      } else {
        message.error("An Error has occurred");
      }
      console.log(err);
    }
  };
  const [loadedImages, setLoadedImages] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handleLoad = (index) => {
    setLoadedImages((prev) => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
  };
  return (
    <Layout
      style={{ height: "100dvh", overflow: "hidden", background: "#F9FAFB" }}
    >
      {!isMobile && (
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0px",
            height: "50px",
          }}
        >
          <Menu
            onClick={(event) => handleNavigation(event)}
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["0"]}
            items={items}
            style={{
              minWidth: 0,
              justifyContent: "space-around",
              flex: 1,
              background: "#6366F1",
            }}
          />
        </Header>
      )}
      <Content style={{ padding: "0 15px" }}>
        <div
          className="hide-scrollbar overflow-auto"
          style={{
            background: "#F9FAFB",
            borderRadius: "0px",
            overflowY: "scroll",
            height: "100%",
            overflowX: "hidden",
            paddingBottom: "60px",
          }}
        >
          {!loading &&
            !chatLoading &&
            !chatProductLoading &&
            detailData.length > 0 && (
              <>
                <Space
                  size="large"
                  direction="vertical"
                  style={{
                    padding: "20px",
                    display: "flex",
                    alignItems: "center",
                    marginTop: "30px",
                  }}
                >
                  <Space.Compact
                    size="large"
                    style={{
                      display: "flex",
                    }}
                  >
                    <Image.PreviewGroup
                      preview={{
                        visible: previewVisible,
                        current: previewIndex,
                        onVisibleChange: (visible) =>
                          setPreviewVisible(visible),
                        onChange: (current) => setPreviewIndex(current),
                      }}
                    >
                      {/* Hidden images for preview */}
                      {detailData[0].hiResImg.map((img, i) => (
                        <Image
                          alt={detailData[0]["item"]["title"]}
                          key={`hidden-${i}`}
                          src={img}
                          style={{ display: "none" }}
                        />
                      ))}
                      {detailData[0].hiResImg.length === 1 ? (
                        detailData[0].hiResImg.map((img, i) => (
                          <div
                            key={i}
                            style={{
                              width: "100%",
                              height: "100%",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setPreviewIndex(i);
                              setPreviewVisible(true);
                            }}
                          >
                            {!loadedImages[i] && (
                              <div
                                style={{
                                  width: "300px",
                                  height: "400px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  backgroundColor: "#f0f0f0",
                                }}
                              >
                                <Spin
                                  indicator={
                                    <LoadingOutlined
                                      style={{ fontSize: 48, color: "#6366F1" }}
                                      spin
                                    />
                                  }
                                />
                              </div>
                            )}
                            <Image
                              preview={false} // Disable built-in preview to avoid duplicates
                              src={img}
                              alt={detailData[0]["item"]["title"]}
                              style={{
                                borderRadius: "12px",
                                display: loadedImages[i] ? "block" : "none",
                                width: "100%",
                                height: "400px",
                                objectFit: "contain",
                              }}
                              onLoad={() => handleLoad(i)}
                              onError={() => handleLoad(i)}
                            />
                          </div>
                        ))
                      ) : (
                        <Carousel
                          arrows
                          style={{
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            width: 300,
                            height: 400,
                          }}
                        >
                          {detailData[0].hiResImg.map((img, i) => (
                            <div
                              key={i}
                              style={{
                                width: "100%",
                                height: "100%",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                setPreviewIndex(i);
                                setPreviewVisible(true);
                              }}
                            >
                              {!loadedImages[i] && (
                                <div
                                  style={{
                                    width: "300px",
                                    height: "400px",
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
                                          color: "#6366F1",
                                        }}
                                        spin
                                      />
                                    }
                                  />
                                </div>
                              )}
                              <Image
                                preview={false} // Disable built-in preview to avoid duplicates
                                src={img}
                                alt={detailData[0]["item"]["title"]}
                                style={{
                                  borderRadius: "12px",
                                  display: loadedImages[i] ? "block" : "none",
                                  width: "100%",
                                  height: "400px",
                                  objectFit: "contain",
                                }}
                                onLoad={() => handleLoad(i)}
                                onError={() => handleLoad(i)}
                              />
                            </div>
                          ))}
                        </Carousel>
                      )}
                    </Image.PreviewGroup>
                  </Space.Compact>
                  {Object.values(loadedImages).some((item) => item) && (
                    <Space
                      size="large"
                      direction="vertical"
                      style={{
                        marginTop: "30px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Space.Compact
                        size="large"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <Text
                          strong
                          style={{ width: !isMobile ? "10vw" : "25vw" }}
                        >
                          Title
                        </Text>
                        <Input
                          readOnly
                          style={{
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            width: !isMobile ? "35vw" : "60vw",
                          }}
                          value={capitalize(detailData[0]["item"]["title"])}
                        />
                      </Space.Compact>
                      <Space.Compact
                        size="large"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <Text
                          strong
                          style={{ width: !isMobile ? "10vw" : "25vw" }}
                        >
                          Description
                        </Text>
                        <TextArea
                          readOnly
                          autoSize={{ minRows: 2, maxRows: 5 }}
                          style={{
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            width: !isMobile ? "35vw" : "60vw",
                          }}
                          value={capitalize(
                            detailData[0]["item"]["description"]
                          )}
                        />
                      </Space.Compact>
                      <Space.Compact
                        size="large"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <Text
                          strong
                          style={{ width: !isMobile ? "10vw" : "25vw" }}
                        >
                          State
                        </Text>
                        <Input
                          readOnly
                          style={{
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            width: !isMobile ? "35vw" : "60vw",
                          }}
                          value={detailData[0]["item"]["state"]}
                        />
                      </Space.Compact>
                      <Space.Compact
                        size="large"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <Text
                          strong
                          style={{ width: !isMobile ? "10vw" : "25vw" }}
                        >
                          District
                        </Text>
                        <Input
                          readOnly
                          style={{
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            width: !isMobile ? "35vw" : "60vw",
                          }}
                          value={detailData[0]["item"]["district"]}
                        />
                      </Space.Compact>
                      <Space.Compact
                        size="large"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <Text
                          strong
                          style={{ width: !isMobile ? "10vw" : "25vw" }}
                        >
                          Price
                        </Text>
                        <Input
                          readOnly
                          style={{
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            width: !isMobile ? "35vw" : "60vw",
                          }}
                          prefix="₹"
                          value={detailData[0]["item"]["price"]}
                        />
                      </Space.Compact>
                    </Space>
                  )}
                  {Object.values(loadedImages).some((item) => item) && (
                    <>
                      {ad && (
                        <Space.Compact
                          size="large"
                          style={{
                            display: "flex",
                            marginTop: "30px",
                          }}
                        >
                          <Popconfirm
                            title="Do you want to delete this Ad?"
                            onConfirm={handleDelete}
                            onCancel={() => {}}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button danger type="primary">
                              Delete
                            </Button>
                          </Popconfirm>
                        </Space.Compact>
                      )}
                      {!ad && (
                        <Space.Compact
                          size="large"
                          style={{
                            display: "flex",
                            marginTop: "30px",
                          }}
                        >
                          {chatProduct.blocked ? (
                            <Popconfirm
                              title="You have blocked this user, do you want to unblock?"
                              onConfirm={handleChat}
                              onCancel={() => {}}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                style={{ background: "#10B981" }}
                                type="primary"
                              >
                                Chat
                              </Button>
                            </Popconfirm>
                          ) : (
                            <Button
                              style={{ background: "#10B981" }}
                              onClick={() => {
                                navigate("/chat", {
                                  state: { recipient: item },
                                });
                              }}
                              type="primary"
                            >
                              Chat
                            </Button>
                          )}
                        </Space.Compact>
                      )}
                    </>
                  )}
                </Space>
              </>
            )}
          {(loading || chatLoading || chatProductLoading) && (
            <Skeleton
              paragraph={{
                rows: 8,
              }}
              active
            />
          )}
        </div>
      </Content>
      {isMobile && (
        <Footer
          style={{
            position: "fixed",
            bottom: 0,
            zIndex: 1,
            width: "100vw",
            display: "flex",
            alignItems: "center",
            padding: "0px",
            height: "50px",
          }}
        >
          <div className="demo-logo" />
          <Menu
            onClick={(event) => handleNavigation(event)}
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["0"]}
            items={items}
            style={{
              justifyContent: "space-around",
              flex: 1,
              minWidth: 0,
              background: "#6366F1",
            }}
          />
        </Footer>
      )}
      {(unblockLoading || deleteLoading) && (
        <Spin
          fullscreen
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />
          }
        />
      )}
    </Layout>
  );
};
export default Details;
