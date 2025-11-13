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
  Spin,
  Row,
  Col,
  Image,
  Upload,
  message,
  Popconfirm,
} from "antd";
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
import imageCompression from "browser-image-compression";
import axios from "axios";
import {
  UserOutlined,
  LoadingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
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
  const bottomRef = useRef(null);

  const {
    accountInitialLoad,
    setAccountInitialLoad,
    setUnreadChatCount,
    user,
    email,
    account,
    setAccount,
  } = useContext(Context);

  const [form, setForm] = useState({
    name: "",
    description: "",
    email: email,
    userId: user.userId,
    image: "",
    showEmail: false,
    disableNotification: false,
    s3Key: "",
  });

  const [images, setImages] = useState([]);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleChange = (value, type) => {
    setForm((prevValue) => {
      if (type === "name" || type === "description") {
        return { ...prevValue, [type]: value.target.value };
      }
      return { ...prevValue, [type]: value };
    });
  };

  const [edit, setEdit] = useState(false);

  const handleSubmit = async () => {
    try {
      const viewingOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.8,
        fileType: "image/jpeg",
      };
      setSubmitLoading(true);
      let data = { ...form };
      if (images.length > 0) {
        const compressedImage = await imageCompression(
          images[0],
          viewingOptions
        );

        const urlRes = await callApi(
          `https://api.reusifi.com/prod/getUrlNew?email=${encodeURIComponent(
            user.userId
          )}&contentType=${encodeURIComponent("image/jpeg")}&count=${1}`,
          "GET"
        );
        const uploadURLs = urlRes.data.uploadURLs;
        const s3Keys = urlRes.data.s3Keys;

        await axios.put(uploadURLs[0], compressedImage, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=2592000",
          },
        });
        data = {
          ...data,
          image: `https://digpfxl7t6jra.cloudfront.net/${s3Keys[0]}`,
          s3Key: s3Keys[0],
        };
      }

      await callApi(
        "https://api.reusifi.com/prod/addAccount",
        "POST",
        false,
        data
      );
      setAccount(data);
      message.info("Account successfully updated");
      setSubmitLoading(false);
      setEdit(false);
      setDeleteImage(false);
      setFileList([]);
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
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (bottomRef?.current) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    });
  };

  useEffect(() => {
    let prevHeight = window.innerHeight;
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      if (
        currentHeight < prevHeight &&
        (document.activeElement.id === "accountDescId" ||
          document.activeElement.id === "accountNameId")
      ) {
        scrollToBottom();
      }
      prevHeight = currentHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setForm({
      name: account?.name ?? "",
      description: account?.description ?? "",
      email: email,
      image: account?.image ?? "",
      userId: user.userId,
      showEmail: account?.showEmail ?? false,
      disableNotification: account?.disableNotification ?? false,
      s3Key: account?.s3Key ?? "",
    });
  }, [account, email, user]);

  useEffect(() => {
    const getChatAndAccount = async () => {
      try {
        setLoading(true);
        const currentUser = user;
        const chatCountPromise = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            currentUser.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );
        const accountPromise = callApi(
          `https://api.reusifi.com/prod/getAccount?userId=${encodeURIComponent(
            user.userId
          )}`,
          "GET"
        );
        const [chatCount, account] = await Promise.all([
          chatCountPromise,
          accountPromise,
        ]);
        setUnreadChatCount(chatCount.data.count);
        setAccount(account?.data?.items);
        setLoading(false);
        setAccountInitialLoad(false);
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
    if (accountInitialLoad && email && user) {
      getChatAndAccount();
    }
  }, [accountInitialLoad, email, user]);

  const [loadedImages, setLoadedImages] = useState([]);

  const handleImageLoad = (uuid) => {
    setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
  };

  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    setImages([...fileList.map((item) => item.originFileObj)]);
  }, [fileList]);

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };
  const handleChangeImage = (file) => {
    if (file.file.size / 1024 / 1024 > 30) {
      message.info("Max size 30MB per image");
      return;
    }
    let newFileList = file.fileList.filter(
      (file) => file.size / 1024 / 1024 <= 30
    );
    setFileList(newFileList);
    // if (file.status === "done" || file.status === undefined) {
    //   scrollToBottom();
    // }
  };

  const [deleteImage, setDeleteImage] = useState(false);

  const handleDeleteUser = async () => {
    try {
      setDeleteLoading(true);
      await callApi(
        `https://api.reusifi.com/prod/deleteAccount?username=${encodeURIComponent(
          user.username
        )}&userId=${encodeURIComponent(user.userId)}`,
        "GET"
      );
      setDeleteLoading(false);
      signOut();
    } catch (err) {
      setDeleteLoading(false);
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
              {account?.image &&
                account?.image !== "DELETE_IMAGE" &&
                !deleteImage && (
                  <Space.Compact
                    size="large"
                    style={{
                      display: "flex",
                    }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        height: "150px",
                        width: "100px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {!loadedImages[form.email] && (
                        <div
                          style={{
                            height: "150px",
                            width: "100px",
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
                      <Image
                        preview={true}
                        src={form.image}
                        alt={"No Longer Available"}
                        style={{
                          display: loadedImages[form.email] ? "block" : "none",
                          height: "150px",
                          width: "100px",
                          objectFit: "fill",
                          borderRadius: "5px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onLoad={() => handleImageLoad(form.email)}
                        onError={() => handleImageLoad(form.email)}
                      />
                    </div>
                  </Space.Compact>
                )}
              {(!account?.image ||
                account?.image === "DELETE_IMAGE" ||
                deleteImage) && <Avatar size={150} icon={<UserOutlined />} />}
              <Space.Compact size="large">
                <Space size="large" direction="vertical">
                  <div
                    className="account-upload"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <Upload
                      accept="image/png,image/jpeg"
                      listType="picture"
                      fileList={fileList}
                      onPreview={handlePreview}
                      beforeUpload={() => false}
                      onChange={handleChangeImage}
                      maxCount={1}
                      multiple
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "40px",
                      }}
                    >
                      <Button
                        disabled={!edit}
                        style={{
                          color: "black",
                          fontSize: "13px",
                          fontWeight: "300",
                          width: !isMobile ? "50dvw" : "70dvw",
                        }}
                        icon={<UploadOutlined />}
                      >
                        Upload
                      </Button>
                    </Upload>
                    {account?.image && account?.image !== "DELETE_IMAGE" && (
                      <Button
                        disabled={deleteImage || !edit}
                        style={{
                          fontSize: "13px",
                          fontWeight: "300",
                          marginLeft: "5px",
                          display: "flex",
                          alignSelf: "flex-start",
                        }}
                        type="primary"
                        danger
                        onClick={() => {
                          setForm((prevValue) => {
                            return {
                              ...prevValue,
                              image: "DELETE_IMAGE",
                              s3Key: "",
                            };
                          });
                          setDeleteImage(true);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  {previewImage && (
                    <Image
                      wrapperStyle={{
                        display: "none",
                      }}
                      style={{ objectFit: "fill" }}
                      preview={{
                        visible: previewOpen,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        afterOpenChange: (visible) =>
                          !visible && setPreviewImage(""),
                      }}
                      src={previewImage}
                    />
                  )}
                </Space>
              </Space.Compact>
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
                <Switch
                  disabled={!edit}
                  checked={form.showEmail}
                  onChange={(checked) => handleChange(checked, "showEmail")}
                />
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
                  id={"accountNameId"}
                  value={form.name}
                  maxLength={100}
                  onClick={() => {
                    scrollToBottom();
                  }}
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
                  id={"accountDescId"}
                  maxLength={300}
                  value={form.description}
                  onClick={() => {
                    scrollToBottom();
                  }}
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
                  disabled={!edit}
                  checked={form.disableNotification}
                  onChange={(checked) =>
                    handleChange(checked, "disableNotification")
                  }
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
                      onClick={() => {
                        handleSubmit();
                      }}
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
                      onClick={() => {
                        setEdit((prevValue) => !prevValue);
                        setForm({
                          name: account?.name ?? "",
                          description: account?.description ?? "",
                          email: email,
                          image: account?.image ?? "",
                          showEmail: account?.showEmail ?? "",
                          disableNotification:
                            account?.disableNotification ?? "",
                          s3Key: account?.s3Key ?? "",
                          userId: user.userId,
                        });
                        setDeleteImage(false);
                      }}
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
              <div ref={bottomRef}></div>
              <Space.Compact size="large">
                <Popconfirm
                  title="Do you want to delete the Account?"
                  onConfirm={handleDeleteUser}
                  onCancel={() => {}}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    style={{
                      fontSize: "13px",
                      fontWeight: "300",
                      marginTop: "70px",
                    }}
                    danger
                    type="primary"
                  >
                    Delete Account
                  </Button>
                </Popconfirm>
              </Space.Compact>
            </Space>
          )}
          {loading && (
            <Row gutter={[30, 30]}>
              {Array.from({ length: 8 }).map((_, index) => {
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
                      <Skeleton.Avatar size={150} active shape={"circle"} />
                    )}
                    {index !== 0 && index !== 6 && index !== 7 && (
                      <Skeleton.Node
                        style={{
                          width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                          height: index !== 4 ? "40px" : "214px",
                          borderRadius: "8px",
                        }}
                        active
                      />
                    )}
                    {index === 6 && <Skeleton.Button active />}
                    {index === 7 && (
                      <Skeleton.Node
                        active
                        style={{
                          width: "125px",
                          height: "40px",
                          borderRadius: "8px",
                        }}
                      />
                    )}
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
      {(submitLoading || deleteLoading) && (
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
export default Account;
