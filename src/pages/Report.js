import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Layout,
  Space,
  Skeleton,
  Typography,
  Modal,
  Row,
  Col,
  Button,
  Spin,
  message as messageAnt,
} from "antd";
import { signInWithRedirect } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
import { useLocation, useNavigate } from "react-router-dom";
import { UserOutlined, LoadingOutlined } from "@ant-design/icons";
import { useClearForm } from "../hooks/clearForm";
import { Input } from "antd";
const { Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;
const ReportAd = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { productId } = location.state || "";
  if (!productId) {
    navigate("/");
  }
  const isModalVisibleRef = useRef(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { clearForm } = useClearForm();
  const errorSessionConfig = {
    title: "Session has expired.",
    content: "Please login again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: async () => {
      isModalVisibleRef.current = false;
      await clearForm();
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

  const [message, setMessage] = useState("");

  const { setUnreadChatCount, user, reportInitialLoad, setReportInitialLoad } =
    useContext(Context);

  const [report, setReport] = useState({
    productId,
    userId: user.userId,
    message: "",
  });

  const handleSubmit = async () => {
    try {
      let submitData = { ...report };
      if (!message) {
        messageAnt.info("Message cannot be empty");
        return;
      } else {
        submitData = { ...submitData, message };
      }
      setSubmitLoading(true);
      await callApi(
        "https://api.reusifi.com/prod/addReport",
        "POST",
        false,
        submitData
      );
      setReport(submitData);
      setSubmitLoading(false);
      messageAnt.success("Ad reported");
    } catch (err) {
      setSubmitLoading(false);
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
    const getChatAndReport = async () => {
      try {
        setLoading(true);
        const currentUser = user;
        const chatCountPromise = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            currentUser.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );
        const reportPromise = callApi(
          `https://api.reusifi.com/prod/getReport?userId=${encodeURIComponent(
            currentUser.userId
          )}&productId=${encodeURIComponent(productId)}`,
          "GET"
        );
        const [chatCount, report] = await Promise.all([
          chatCountPromise,
          reportPromise,
        ]);
        setReport((prevValue) => {
          return { ...prevValue, message: report?.data?.items?.message };
        });
        setUnreadChatCount(chatCount.data.count);
        setReportInitialLoad(false);
        setLoading(false);
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
    if (productId && reportInitialLoad) {
      getChatAndReport();
    }
  }, [productId]);

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
              }}
            >
              <Space.Compact size="large">
                <TextArea
                  readOnly={report?.message}
                  allowClear
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                  }}
                  autoSize={{ minRows: 8, maxRows: 8 }}
                  placeholder="Message"
                  maxLength={300}
                  value={message || report?.message}
                />
              </Space.Compact>
              <Space.Compact size="large">
                {report?.message && (
                  <span style={{ fontSize: "13px", fontWeight: "300" }}>
                    You have already reported this ad
                  </span>
                )}
              </Space.Compact>
              <Space.Compact size="large">
                <Button
                  onClick={() => {
                    handleSubmit();
                  }}
                  style={{
                    background: "#52c41a",
                    fontSize: "13px",
                    fontWeight: "300",
                  }}
                  type="primary"
                  disabled={report?.message}
                >
                  Submit
                </Button>
              </Space.Compact>
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
export default ReportAd;
