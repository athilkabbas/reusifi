import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Layout,
  Space,
  Skeleton,
  Modal,
  Row,
  Col,
  Button,
  Spin,
  Card,
} from "antd";
import { signInWithRedirect } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
import { LoadingOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useIndexedDBImages } from "../hooks/indexedDB";
const { Content } = Layout;
const BoostAd = () => {
  const { deleteDB } = useIndexedDBImages();
  const isMobile = useIsMobile();
  const isModalVisibleRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { uuid } = location.state || "";
  if (!uuid) {
    navigate("/");
  }
  const [submitLoading, setSubmitLoading] = useState(false);
  const errorSessionConfig = {
    title: "Session has expired.",
    content: "Please login again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: async () => {
      isModalVisibleRef.current = false;
      await deleteDB();
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
  const [loading, setLoading] = useState(false);

  const {
    setUnreadChatCount,
    user,
    boostInitialLoad,
    setBoostInitialLoad,
    setBoostForm,
  } = useContext(Context);

  useEffect(() => {
    const getChat = async () => {
      try {
        setLoading(true);
        const currentUser = user;
        const chatCountPromise = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            currentUser.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );
        const [chatCount] = await Promise.all([chatCountPromise]);
        setUnreadChatCount(chatCount.data.count);
        setLoading(false);
        setBoostInitialLoad(false);
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
    };
    if (boostInitialLoad) {
      getChat();
    }
  }, []);

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
            height: "50px",
          }}
        >
          <MenuWrapper defaultSelectedKeys={["6-1"]} isMobile={isMobile} />
        </HeaderWrapper>
      )}
      <Content>
        <div
          style={{
            background: "#F9FAFB",
            borderRadius: "0px",
            overflowY: "scroll",
            height: "100%",
            overflowX: "hidden",
            padding: "15px 15px 70px 15px",
            scrollbarWidth: "none",
          }}
        >
          {!loading && (
            <Space
              size="middle"
              direction="vertical"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "20px",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Space size="large">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  Please check your ad’s expiry before applying a boost.
                </div>
              </Space>
              <Space
                size="middle"
                direction={isMobile ? "vertical" : "horizontal"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "20px",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Space.Compact size="large">
                  <Card title="3-Day Ad Boost" bordered style={{ width: 300 }}>
                    <p>Increase your ad’s visibility for 3 days for £1.</p>
                    <Button
                      onClick={() => {
                        setBoostForm((prevValue) => {
                          return { ...prevValue, uuid };
                        });
                        navigate("/checkout", {
                          state: { adType: "BOOSTAD3" },
                        });
                      }}
                      style={{ backgroundColor: "#52c41a" }}
                      type="primary"
                    >
                      Select
                    </Button>
                  </Card>
                </Space.Compact>
                <Space.Compact size="large">
                  <Card title="7-Day Ad Boost" bordered style={{ width: 300 }}>
                    <p>Increase your ad’s visibility for 7 days for £2.</p>
                    <Button
                      onClick={() => {
                        setBoostForm((prevValue) => {
                          return { ...prevValue, uuid };
                        });
                        navigate("/checkout", {
                          state: { adType: "BOOSTAD7" },
                        });
                      }}
                      style={{ backgroundColor: "#52c41a" }}
                      type="primary"
                    >
                      Select
                    </Button>
                  </Card>
                </Space.Compact>
              </Space>
            </Space>
          )}
          {loading && (
            <Row gutter={[30, 30]}>
              {Array.from({ length: 2 }).map((_, index) => {
                return (
                  <Col
                    key={index}
                    xs={24}
                    sm={24}
                    md={24}
                    lg={24}
                    xl={24}
                    xxl={24}
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    {index === 0 && (
                      <Skeleton.Node
                        style={{
                          width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                          height: "214px",
                          borderRadius: "8px",
                        }}
                        active
                      />
                    )}
                    {index === 1 && <Skeleton.Button active />}
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      </Content>
      {isMobile && (
        <FooterWrapper>
          <MenuWrapper defaultSelectedKeys={["6-1"]} isMobile={isMobile} />
        </FooterWrapper>
      )}
      {submitLoading && (
        <Spin
          fullscreen
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#52c41a" }} spin />
          }
        />
      )}
    </Layout>
  );
};
export default BoostAd;
