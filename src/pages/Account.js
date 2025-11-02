import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Layout,
  Space,
  Skeleton,
  Typography,
  Modal,
  Avatar,
  Button,
  Switch,
} from "antd";
import { signInWithRedirect } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
import { UserOutlined } from "@ant-design/icons";
import { Input } from "antd";
const { Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;
const Account = () => {
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

  const {
    contactInitialLoad,
    setContactInitialLoad,
    setUnreadChatCount,
    user,
    email,
  } = useContext(Context);

  const [form, setForm] = useState({
    name: "",
    description: "",
    email: email,
    image: "",
  });

  const handleChange = (value, type) => {
    setForm((prevValue) => {
      if (type === "name" || type === "description") {
        return { ...prevValue, [type]: value.target.value };
      }
      return { ...prevValue, [type]: value };
    });
  };

  const [edit, setEdit] = useState(false);
  const [checkedShow, setCheckedShow] = useState(false);
  const [checkedDisable, setCheckedDisable] = useState(true);

  const onChangeDisableSwitch = (checked) => {
    setCheckedDisable(checked);
  };

  const onChangeShowSwitch = (checked) => {
    setCheckedShow(checked);
  };
  console.log(email);
  useEffect(() => {
    const getChatCount = async () => {
      try {
        setLoading(true);
        const currentUser = user;
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
            <Space
              size="middle"
              direction="vertical"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "20px",
              }}
            >
              <Avatar size={64} icon={<UserOutlined />} />
              <Space.Compact size="large">
                <Input
                  readOnly
                  allowClear
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                    marginTop: "30px",
                  }}
                  onChange={(value) => handleChange(value, "title")}
                  placeholder="Email"
                  value={form.email}
                  maxLength={100}
                />
              </Space.Compact>
              <Space.Compact
                size="large"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "20px",
                }}
              >
                <Button style={{ color: "#000000E0" }} type="link">
                  Show email to users
                </Button>
                <Switch checked={checkedShow} onChange={onChangeShowSwitch} />
              </Space.Compact>
              <Space.Compact size="large">
                <Input
                  readOnly={!edit}
                  allowClear
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                    marginTop: "30px",
                  }}
                  onChange={(value) => handleChange(value, "name")}
                  placeholder="Name"
                  value={form.name}
                  maxLength={100}
                />
              </Space.Compact>
              <Space.Compact size="large">
                <TextArea
                  readOnly={!edit}
                  allowClear
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                  }}
                  onChange={(value) => handleChange(value, "description")}
                  autoSize={{ minRows: 8, maxRows: 8 }}
                  placeholder="Description"
                  maxLength={300}
                  value={form.description}
                />
              </Space.Compact>
              <Space.Compact
                size="large"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "20px",
                }}
              >
                <Button style={{ color: "#000000E0" }} type="link">
                  Disable email notification
                </Button>
                <Switch
                  checked={checkedDisable}
                  onChange={onChangeDisableSwitch}
                />
              </Space.Compact>
              {!edit && (
                <Space.Compact size="large">
                  <Button
                    onClick={() => setEdit((prevValue) => !prevValue)}
                    style={{
                      background: "#52c41a",
                      fontSize: "13px",
                      fontWeight: "300",
                    }}
                    type="primary"
                  >
                    Edit
                  </Button>
                </Space.Compact>
              )}
              {edit && (
                <Space>
                  <Space.Compact size="large">
                    <Button
                      style={{
                        background: "#52c41a",
                        fontSize: "13px",
                        fontWeight: "300",
                      }}
                      type="primary"
                    >
                      Submit
                    </Button>
                  </Space.Compact>
                  <Space.Compact size="large">
                    <Button
                      onClick={() => setEdit((prevValue) => !prevValue)}
                      style={{
                        background: "#52c41a",
                        fontSize: "13px",
                        fontWeight: "300",
                      }}
                      type="primary"
                    >
                      Cancel
                    </Button>
                  </Space.Compact>
                </Space>
              )}
              <Space.Compact size="large">
                <Button
                  style={{
                    fontSize: "13px",
                    fontWeight: "300",
                    marginTop: "40px",
                  }}
                  type="primary"
                  danger
                >
                  Delete Account
                </Button>
              </Space.Compact>
            </Space>
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
export default Account;
