import React, { useContext, useEffect, useRef, useState } from "react";
import { Layout, Space, Skeleton, Typography, Modal } from "antd";
import { getCurrentUser, signInWithRedirect } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
const { Content } = Layout;
const { Text } = Typography;
const Contact = () => {
  const isMobile = useIsMobile();
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
  const [loading, setLoading] = useState(false);

  const { contactInitialLoad, setContactInitialLoad, setUnreadChatCount } =
    useContext(Context);

  useEffect(() => {
    const getChatCount = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        const result = await callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            currentUser.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );
        setUnreadChatCount(result.data.count);
        setLoading(false);
        setContactInitialLoad(false);
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
    if (contactInitialLoad) {
      getChatCount();
    }
  }, [contactInitialLoad]);

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
          }}
        >
          {!loading && (
            <Space.Compact size="large" style={{ padding: "30px" }}>
              <Text>
                For any queries please email us at <br></br>reusifi@gmail.com
              </Text>
            </Space.Compact>
          )}
          {loading && (
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
        <FooterWrapper>
          <MenuWrapper defaultSelectedKeys={["6-1"]} isMobile={isMobile} />
        </FooterWrapper>
      )}
    </Layout>
  );
};
export default Contact;
