import React, { useContext, useEffect, useRef, useState } from "react";
import { Col, Skeleton, Space, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Cascader } from "antd";
import { Layout, Modal } from "antd";
import { CloseCircleFilled, UploadOutlined } from "@ant-design/icons";
import { LocateFixed } from "lucide-react";
import { Image, Upload, Typography, message } from "antd";
import { Button, Row } from "antd";
import axios from "axios";
import { signInWithRedirect } from "@aws-amplify/auth";
import imageCompression from "browser-image-compression";
import { LoadingOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
import { options } from "../helpers/categories";
import useLocationComponent from "../hooks/location";
import { Platform } from "../helpers/config";
const { Text } = Typography;
const { TextArea } = Input;
const { Content } = Layout;
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const AddDress = () => {
  const {
    count,
    setCount,
    setAdInitialLoad,
    setAdData,
    setAdLastEvaluatedKey,
    addProductInitialLoad,
    setAddProductInitialLoad,
    setUnreadChatCount,
    user,
    locationAccessLoading,
    currentLocationLabel,
    setTriggerLocation,
    currentLocation,
    setCurrentLocationLabel,
    setCurrentLocation,
    setCurrLocRemoved,
  } = useContext(Context);

  useLocationComponent();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    email: user.userId,
    images: [],
    price: null,
    location: "",
    locationLabel: "",
  });
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

  const locationInfoConfig = {
    title: "Enable location access",
    content:
      "To enable location access, please click the location icon at the end of the browser’s address bar and allow location permission for this site.",
    closable: false,
    maskClosable: false,
    okText: "Close",
    onOk: () => {},
  };

  useEffect(() => {
    if (user && addProductInitialLoad) {
      try {
        setChatLoading(true);
        setLoading(true);
        const getChatCount = callApi(
          `https://api.reusifi.com/prod/getChatsCount?userId1=${encodeURIComponent(
            user.userId
          )}&count=${encodeURIComponent(true)}`,
          "GET"
        );

        const getAdCount = callApi(
          `https://api.reusifi.com/prod/getProductsCount?count=${true}&email=${encodeURIComponent(
            user.userId
          )}`,
          "GET"
        );

        Promise.all([getChatCount, getAdCount])
          .then(([chatResult, adResult]) => {
            setUnreadChatCount(chatResult.data.count);
            setCount(adResult.data.count);
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
            setAddProductInitialLoad(false);
          });
      } catch (err) {
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
  }, [user, addProductInitialLoad]);
  const handleChange = (value, type) => {
    if (
      type === "price" &&
      !/^(|0|[1-9]\d*)(\.\d{0,2})?$/.test(value.target.value)
    ) {
      return;
    }
    setForm((prevValue) => {
      if (type === "title" || type === "description" || type === "price") {
        return { ...prevValue, [type]: value.target.value };
      } else if (type === "category") {
        return {
          ...prevValue,
          category: value?.[0] || "",
          subCategory: value?.[1] || "",
        };
      }
      return { ...prevValue, [type]: value };
    });
  };

  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
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
    if (file.status === "done" || file.status === undefined) {
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (currentLocation && currentLocationLabel) {
      setForm((prevValue) => {
        return {
          ...prevValue,
          location: currentLocation,
          locationLabel: currentLocationLabel,
        };
      });
    }
  }, [currentLocation, currentLocationLabel]);

  useEffect(() => {
    setForm((prevValue) => {
      return {
        ...prevValue,
        images: fileList.map((item) => item.originFileObj),
      };
    });
  }, [fileList]);

  const handleSubmit = async () => {
    const isValid = () => {
      if (!form.images || form.images.length === 0) return false;
      for (let key in form) {
        if (key !== "images" && (form[key] === "" || form[key] === null)) {
          return false;
        }
      }
      return true;
    };

    if (!isValid()) {
      message.info("All fields are mandatory");
      return;
    }

    setSubmitLoading(true);

    const thumbnailOptions = {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 500,
      useWebWorker: true,
      initialQuality: 0.7,
      fileType: "image/jpeg",
    };

    const viewingOptions = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: "image/jpeg",
    };

    try {
      // Compress thumbnails and viewings in parallel
      const compressedThumbnails = [
        await imageCompression(form.images[0], thumbnailOptions),
      ];
      const compressedViewings = await Promise.all(
        form.images.map((image) => imageCompression(image, viewingOptions))
      );

      const allCompressed = [...compressedThumbnails, ...compressedViewings];
      const urlRes = await callApi(
        `https://api.reusifi.com/prod/getUrlNew?email=${encodeURIComponent(
          form.email
        )}&contentType=${encodeURIComponent("image/jpeg")}&count=${
          allCompressed.length
        }`,
        "GET"
      );
      const uploadURLs = urlRes.data.uploadURLs;
      const s3Keys = urlRes.data.s3Keys;

      await Promise.all(
        allCompressed.map((img, idx) =>
          axios.put(uploadURLs[idx], img, {
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "public, max-age=2592000",
            },
          })
        )
      );

      const thumbnailS3Keys = [s3Keys[0]];
      const viewingS3Keys = s3Keys.slice(1);

      // Prepare form data with separate keys for thumbnails and viewings
      const data = {
        title: form.title.trim().toLowerCase(),
        description: form.description.trim().toLowerCase(),
        email: form.email.toLowerCase(),
        location: form.location.split(",").map(parseFloat),
        locationLabel: form.locationLabel,
        price: parseFloat(form.price).toFixed(2),
        category: form.category.toLowerCase(),
        subCategory: form.subCategory.toLowerCase(),
        thumbnailS3Keys,
        viewingS3Keys,
      };
      await callApi(
        "https://api.reusifi.com/prod/addProduct",
        "POST",
        false,
        data
      );
      setCount((prevValue) => prevValue + 1);
      setAdData([]);
      setAdLastEvaluatedKey(null);
      setAdInitialLoad(true);
      setSubmitLoading(false);
      message.success("Ad submitted");
      navigate("/ads");
    } catch (err) {
      setSubmitLoading(false);
      if (isModalVisibleRef.current) {
        return;
      }
      isModalVisibleRef.current = true;
      if (err?.status === 401) {
        Modal.error(errorSessionConfig);
      } else {
        if (err?.response?.data?.message === "Invalid Image") {
          Modal.error({
            ...errorConfig,
            content: "Invalid image",
          });
        } else {
          Modal.error(errorConfig);
        }
      }
      return;
    }
  };

  const filter = (inputValue, path) =>
    path.some(
      (option) =>
        option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
    );

  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [postCodeLoading, setPostCodeLoading] = useState(false);

  const fetchPincodeDetails = async () => {
    setPostCodeLoading(true);
    try {
      const data = await callApi(
        `https://api.reusifi.com/prod/getLocation?pincode=${encodeURIComponent(
          pincode
        )}`,
        "GET"
      );
      setPostCodeLoading(false);
      setAddress(
        data.data.Address.Street ||
          data.data.Address.District ||
          data.data.Address.Locality
      );
      handleChange(data.data.Position.reverse().join(","), "location");
      handleChange(
        data.data.Address.Street ||
          data.data.Address.District ||
          data.data.Address.Locality,
        "locationLabel"
      );
      setCurrLocRemoved(true);
      setCurrentLocationLabel("");
      setCurrentLocation("");
    } catch (err) {
      message.info("Pincode not found");
    }
  };
  const handlePincode = (e) => {
    const value = e.target.value;
    setPincode(value);
    if (!value) {
      setAddress("");
    }
  };
  const [open, setOpen] = useState(false);
  const submitRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (bottomRef?.current) {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    });
  };

  useEffect(() => {
    let prevHeight = window.innerHeight;
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      if (
        currentHeight < prevHeight &&
        document.activeElement.id === "sellPriceId"
      ) {
        scrollToBottom();
      }
      prevHeight = currentHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <Layout
      style={{
        height: "100dvh",
        overflowX: "hidden",
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
          <MenuWrapper defaultSelectedKeys={["3"]} isMobile={isMobile} />
        </HeaderWrapper>
      )}
      <Content>
        <div
          style={{
            background: "#F9FAFB",
            borderRadius: "0px",
            overflow: "scroll",
            padding: "15px 15px 70px 15px",
            height: "100%",
            scrollbarWidth: "none",
          }}
        >
          {!loading && !chatLoading && user && (
            <>
              <Space
                size="large"
                direction="vertical"
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Space.Compact size="large">
                  <Input
                    allowClear
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                      marginTop: "30px",
                    }}
                    onChange={(value) => handleChange(value, "title")}
                    placeholder="Title"
                    value={form.title}
                    maxLength={100}
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
                    maxLength={300}
                    value={form.description}
                  />
                </Space.Compact>
                <Space.Compact size="large" style={{ position: "relative" }}>
                  <Cascader
                    allowClear={false}
                    placement="topLeft"
                    popupRender={(menu) => (
                      <div
                        style={{
                          maxHeight: 400,
                          overflow: "hidden",
                          overscrollBehavior: "contain",
                          touchAction: "none",
                        }}
                        onTouchStart={(e) => {
                          const popup = e.currentTarget;
                          popup.style.overflow = "hidden";
                          popup.style.touchAction = "none";
                        }}
                        onTouchMove={(e) => {
                          if (
                            (isMobile || window.innerWidth < 1200) &&
                            document.activeElement instanceof HTMLElement
                          ) {
                            const popup = e.currentTarget;
                            const scrollTop = popup.scrollTop;
                            popup.style.overflow = "hidden";
                            popup.style.touchAction = "none";
                            const initialHeight = window.innerHeight;
                            try {
                              document.activeElement.blur({
                                preventScroll: true,
                              });
                            } catch {
                              document.activeElement.blur();
                            }
                            const waitForKeyboardClose = () => {
                              if (window.innerHeight >= initialHeight) {
                                popup.style.overflow = "auto";
                                popup.style.touchAction = "pan-y";
                                popup.scrollTop = scrollTop;
                              } else {
                                requestAnimationFrame(waitForKeyboardClose);
                              }
                            };
                            requestAnimationFrame(waitForKeyboardClose);
                          }
                        }}
                      >
                        {menu}
                      </div>
                    )}
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                      borderRadius: "9px",
                    }}
                    showSearch={{ filter }}
                    placeholder={"Category"}
                    onChange={(value) => {
                      handleChange(value, "category");
                      requestAnimationFrame(() => {
                        setOpen(false);
                      });
                    }}
                    onClick={(e) => {
                      const isClearButton =
                        e.target.closest(".ant-select-clear");
                      if (isClearButton) return;
                      setOpen(true);
                      document.body.style.overscrollBehaviorY = "none";
                    }}
                    open={open}
                    options={options}
                    value={
                      form.category
                        ? form.category + "/" + form.subCategory
                        : null
                    }
                    suffixIcon={
                      !form.category ? (
                        open ? (
                          <UpOutlined
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpen(false);
                              document.body.style.overscrollBehaviorY = "";
                            }}
                          />
                        ) : (
                          <DownOutlined
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpen(true);
                              document.body.style.overscrollBehaviorY = "none";
                            }}
                          />
                        )
                      ) : null
                    }
                  ></Cascader>
                  {form.category && (
                    <CloseCircleFilled
                      onClick={() => {
                        handleChange("", "category");
                      }}
                      style={{
                        position: "absolute",
                        right: 9,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(0, 0, 0, 0.25)",
                        zIndex: 10,
                        scale: "0.9",
                      }}
                    ></CloseCircleFilled>
                  )}
                </Space.Compact>
                {/* <Space.Compact size="large">
                  <Cascader
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                      borderRadius: "9px",
                    }}
                    showSearch={{ filter }}
                    onSearch={(value) => {
                      handleChange(value, "location");
                    }}
                    placeholder={"Location"}
                    onChange={(value) => {
                      handleChange(value, "location");
                    }}
                    options={locationsCascader}
                  ></Cascader>
                </Space.Compact> */}
                <Space.Compact
                  size="large"
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                  }}
                >
                  <Input
                    value={pincode}
                    onChange={handlePincode}
                    placeholder="Pincode"
                    allowClear
                  ></Input>
                  <Button
                    loading={postCodeLoading}
                    disabled={!pincode}
                    type="primary"
                    style={{
                      background: "#52c41a",
                      fontSize: "13px",
                      fontWeight: "300",
                    }}
                    onClick={fetchPincodeDetails}
                  >
                    Check Pincode
                  </Button>
                </Space.Compact>
                &nbsp;&nbsp;or
                <Space.Compact size="large">
                  <Button
                    disabled={currentLocationLabel}
                    loading={locationAccessLoading}
                    style={{
                      fontSize: "13px",
                      fontWeight: "300",
                      color: "#52c41a",
                      width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                    }}
                    onClick={() => {
                      navigator.permissions
                        .query({ name: "geolocation" })
                        .then(function (result) {
                          if (result.state === "denied") {
                            Modal.info(locationInfoConfig);
                          }
                        });
                      setAddress("");
                      setPincode("");
                      setCurrLocRemoved(false);
                      setTriggerLocation((value) => !value);
                    }}
                  >
                    <LocateFixed />
                    Use your current location
                  </Button>
                </Space.Compact>
                {currentLocationLabel && !address && (
                  <Space.Compact size="large">
                    <Input
                      onChange={(e) => {
                        if (!e.target.value) {
                          setCurrentLocationLabel("");
                          setCurrentLocation("");
                          setCurrLocRemoved(true);
                        }
                      }}
                      allowClear
                      style={{
                        width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                      }}
                      value={currentLocationLabel}
                    />
                  </Space.Compact>
                )}
                {pincode && address && (
                  <Space.Compact size="large">
                    <Input
                      allowClear
                      style={{
                        width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                      }}
                      value={address}
                      placeholder="Address"
                      readOnly
                    />
                  </Space.Compact>
                )}
                <Space.Compact size="large">
                  <Input
                    id="sellPriceId"
                    allowClear
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                    }}
                    prefix="₹"
                    onChange={(value) => handleChange(value, "price")}
                    placeholder="Price"
                    value={form.price}
                    maxLength={15}
                  />
                </Space.Compact>
                <Space.Compact size="large">
                  <Space size="large" direction="vertical">
                    <Upload
                      accept="image/png,image/jpeg"
                      listType="picture"
                      fileList={fileList}
                      onPreview={handlePreview}
                      beforeUpload={() => false}
                      onChange={handleChangeImage}
                      maxCount={6}
                      multiple
                    >
                      <Button
                        style={{
                          color: "black",
                          fontSize: "13px",
                          fontWeight: "300",
                          width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                        }}
                        icon={<UploadOutlined />}
                      >
                        Upload (Max: 6)
                      </Button>
                    </Upload>
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
                {/* <Space.Compact size="large">
                  <span style={{ fontSize: "13px", fontWeight: "300" }}>
                    Max 6 images
                  </span>
                </Space.Compact> */}
                <Space.Compact size="large">
                  {count < 5 && (
                    <span style={{ fontSize: "13px", fontWeight: "300" }}>
                      The ad will be deactivated automatically after 30 days
                    </span>
                  )}
                </Space.Compact>
                <Space.Compact size="large">
                  {count >= 5 && <Text>Max 5 ads</Text>}
                </Space.Compact>
                <Space.Compact
                  size="large"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    ref={submitRef}
                    style={{
                      background: "#52c41a",
                      fontSize: "13px",
                      fontWeight: "300",
                    }}
                    onClick={handleSubmit}
                    type="primary"
                    disabled={count >= 20 ? true : false}
                  >
                    Submit
                  </Button>
                </Space.Compact>
                <div ref={bottomRef}></div>
              </Space>
            </>
          )}
          {(loading || chatLoading) && (
            <Row gutter={[30, 30]}>
              {Array.from({ length: 9 }).map((_, index) => {
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
                    {index !== 8 && (
                      <Skeleton.Node
                        style={{
                          width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                          height: index !== 2 ? "40px" : "214px",
                          borderRadius: "8px",
                        }}
                        active
                      />
                    )}
                    {index === 8 && (
                      <Skeleton.Node
                        style={{
                          width: "75px",
                          height: "40px",
                          borderRadius: "8px",
                        }}
                        active
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
          <MenuWrapper defaultSelectedKeys={["3"]} isMobile={isMobile} />
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
export default AddDress;
