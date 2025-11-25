import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Layout,
  Space,
  Skeleton,
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
  notification,
} from "antd";
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
import imageCompression from "browser-image-compression";
import { useIndexedDBImages } from "../hooks/indexedDB";
import axios from "axios";
import {
  UserOutlined,
  LoadingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Input } from "antd";
const { Content } = Layout;
const { TextArea } = Input;
const Account = () => {
  const isMobile = useIsMobile();
  const { deleteDB } = useIndexedDBImages();
  const isModalVisibleRef = useRef(false);
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

  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const uploadImages = async (fileList) => {
    const viewingOptions = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: "image/jpeg",
    };

    const compressedImage = await imageCompression(
      fileList[0].originFileObj,
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

    return s3Keys;
  };

  const handleChange = (value, type) => {
    setForm((prevValue) => {
      if (type === "name" || type === "description") {
        return { ...prevValue, [type]: value.target.value };
      }
      return { ...prevValue, [type]: value };
    });
  };

  const handleSubmit = async () => {
    try {
      if (
        fileList.length === 0 &&
        Object.keys(account).every((key) => account[key] === form[key])
      ) {
        message.info("No changes found");
        return;
      }

      setSubmitLoading(true);
      let data = { ...form };
      if (fileList.length > 0) {
        const s3Keys = await uploadImages(fileList);
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
      message.success("Account successfully updated");
      setSubmitLoading(false);
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
  }, [account]);

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
    if (accountInitialLoad) {
      getChatAndAccount();
    }
  }, [accountInitialLoad]);

  const [loadedImages, setLoadedImages] = useState([]);

  const handleImageLoad = (uuid) => {
    setLoadedImages((prev) => ({ ...prev, [uuid]: true }));
  };

  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

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

  const prevFilesRef = useRef([]);

  const timer = useRef(null);

  const openNotificationWithIcon = (type, message) => {
    api[type]({
      message: "Invalid Image",
      description: `${message}`,
      duration: 0,
    });
  };

  const getActualMimeType = async (file) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer).subarray(0, 4);

    // JPEG magic bytes: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return true;
    }

    // PNG magic bytes: 89 50 4E 47
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    prevFilesRef.current = [...fileList];
  }, [fileList]);

  const handleBeforeUpload = async (file) => {
    const value = await getActualMimeType(file);
    if (!value) {
      message.info("Invalid image format");
      return Upload.LIST_IGNORE;
    } else if (file.size / 1024 / 1024 > 30) {
      message.info("Max size 30MB per image");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleChangeImage = async ({ fileList }) => {
    setFileList(fileList);
    if (fileList.length > 0 && fileList.length >= prevFilesRef.current.length) {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(async () => {
        try {
          setSubmitLoading(true);
          const s3Keys = await uploadImages(fileList);
          let files = fileList.map((file, index) => {
            const { preview, originFileObj, ...fileRest } = file;
            return { ...fileRest, s3Key: s3Keys[index] };
          });
          await callApi(
            "https://api.reusifi.com/prod/verifyImage",
            "POST",
            false,
            {
              files,
              keywords: [],
            }
          );
          setSubmitLoading(false);
        } catch (err) {
          if (err && err.status === 400) {
            openNotificationWithIcon("error", err.response.data.message);
            setFileList((prevValue) => {
              return prevValue.filter(
                (image) => !err.response.data.invalidUids.includes(image.uid)
              );
            });
          }
          setSubmitLoading(false);
        }
      }, 500);
    }
  };

  const [deleteImage, setDeleteImage] = useState(false);

  const handleDeleteUser = async () => {
    try {
      setDeleteLoading(true);
      await callApi(
        "https://api.reusifi.com/prod/deleteAccount",
        "POST",
        false,
        {
          username: user.username,
          userId: user.userId,
        }
      );
      setDeleteLoading(false);
      await deleteDB();
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
        {contextHolder}
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
                          objectFit: "cover",
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
                      beforeUpload={handleBeforeUpload}
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
                      style={{ objectFit: "cover" }}
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
                  checked={form.showEmail}
                  onChange={(checked) => handleChange(checked, "showEmail")}
                />
              </Space.Compact>
              <Space.Compact size="large">
                <Input
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
                  checked={form.disableNotification}
                  onChange={(checked) =>
                    handleChange(checked, "disableNotification")
                  }
                />
              </Space.Compact>
              <br />
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
                      if (
                        fileList.length === 0 &&
                        Object.keys(account).every(
                          (key) => account[key] === form[key]
                        )
                      ) {
                        message.info("No changes found");
                        return;
                      }
                      setForm({
                        name: account?.name ?? "",
                        description: account?.description ?? "",
                        email: email,
                        image: account?.image ?? "",
                        showEmail: account?.showEmail ?? "",
                        disableNotification: account?.disableNotification ?? "",
                        s3Key: account?.s3Key ?? "",
                        userId: user.userId,
                      });
                      setFileList([]);
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

              <br />
              <br />
              <div
                ref={bottomRef}
                style={{ display: "block", height: 0 }}
              ></div>
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
