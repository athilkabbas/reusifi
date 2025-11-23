import React, { useContext, useEffect, useRef, useState } from "react";
import { Col, Popover, Skeleton, Space, Spin, TreeSelect } from "antd";
import { Input, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { Layout, Modal } from "antd";
import { InfoCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { LocateFixed } from "lucide-react";
import { Image, Upload, message } from "antd";
import { Button, Row } from "antd";
import axios from "axios";
import { signInWithRedirect } from "@aws-amplify/auth";
import imageCompression from "browser-image-compression";
import { LoadingOutlined } from "@ant-design/icons";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
import MenuWrapper from "../component/Menu";
import FooterWrapper from "../component/Footer";
import HeaderWrapper from "../component/Header";
import { leafOptions, options } from "../helpers/categories";
import useLocationComponent from "../hooks/location";
import { useIndexedDBImages } from "../hooks/indexedDB";
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
    form,
    setForm,
  } = useContext(Context);

  const [api, contextHolder] = notification.useNotification();

  useLocationComponent();

  const [isSubmitted, setIsSubmitted] = useState(false);
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
    if (addProductInitialLoad) {
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
  }, [addProductInitialLoad]);
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
      }
      return { ...prevValue, [type]: value };
    });
  };

  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
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

  const prevFilesRef = useRef([]);

  useEffect(() => {
    prevFilesRef.current = [...form.images];
  }, [form.images]);

  const handleBeforeUpload = async (file) => {
    if (form.keywords.length === 0) {
      message.info("Please select Category");
      return Upload.LIST_IGNORE;
    }
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

  const timer = useRef(null);

  const openNotificationWithIcon = (type, message) => {
    api[type]({
      message: "Invalid Image",
      description: `${message}`,
      duration: 0,
    });
  };

  const handleChangeImage = async ({ fileList }) => {
    setForm((prevValue) => {
      return { ...prevValue, images: [...fileList] };
    });
    if (fileList.length > 0 && fileList.length > prevFilesRef.current.length) {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(async () => {
        try {
          setSubmitLoading(true);
          const { viewingS3Keys } = await uploadImages(fileList);
          let files = fileList.map((file, index) => {
            const { preview, originFileObj, ...fileRest } = file;
            return { ...fileRest, s3Key: viewingS3Keys[index] };
          });
          await callApi(
            "https://api.reusifi.com/prod/verifyImage",
            "POST",
            false,
            {
              files,
              keywords: form.keywords,
            }
          );
          setSubmitLoading(false);
        } catch (err) {
          if (err && err.status === 400) {
            openNotificationWithIcon("error", err.response.data.message);
            setForm((prevValue) => {
              return {
                ...prevValue,
                images: [
                  ...prevValue.images.filter(
                    (image) =>
                      !err.response.data.invalidUids.includes(image.uid)
                  ),
                ],
              };
            });
          }
          setSubmitLoading(false);
        }
      }, 500);
    }
  };

  useEffect(() => {
    setForm((prevValue) => {
      return { ...prevValue, email: user.userId };
    });
  }, [user]);

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

  const isValid = () => {
    if (!form.images || form.images.length === 0) return false;
    for (let key in form) {
      if (key !== "images" && (form[key] === "" || form[key] === null)) {
        return false;
      }
    }
    return true;
  };

  const uploadImages = async (fileList) => {
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

    const compressedThumbnails = [
      await imageCompression(fileList[0].originFileObj, thumbnailOptions),
    ];
    const compressedViewings = await Promise.all(
      fileList.map((image) =>
        imageCompression(image.originFileObj, viewingOptions)
      )
    );

    const allCompressed = [...compressedThumbnails, ...compressedViewings];
    const urlRes = await callApi(
      `https://api.reusifi.com/prod/getUrlNew?email=${encodeURIComponent(
        user.userId
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
    return {
      thumbnailS3Keys,
      viewingS3Keys,
    };
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);

    try {
      const { thumbnailS3Keys, viewingS3Keys } = await uploadImages(
        form.images
      );
      // Prepare form data with separate keys for thumbnails and viewings
      const data = {
        title: form.title.trim().toLowerCase(),
        description: form.description.trim().toLowerCase(),
        email: user.userId.toLowerCase(),
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
      setCurrLocRemoved(true);
      setCurrentLocationLabel("");
      setCurrentLocation("");
      await deleteDB();
      message.success(
        "Your ad is now live on Reusifi. It may take up to 5 minutes to appear."
      );
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
        Modal.error(errorConfig);
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
      handleChange("", "location");
      handleChange("", "locationLabel");
    }
  };
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);
  const bottomRefPincode = useRef(null);

  const bottomRefPrice = useRef(null);

  const scrollToBottomPincode = () => {
    requestAnimationFrame(() => {
      if (bottomRefPincode?.current) {
        bottomRefPincode.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    });
  };

  const scrollToBottomPrice = () => {
    requestAnimationFrame(() => {
      if (bottomRefPrice?.current) {
        bottomRefPrice.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    });
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
        document.activeElement.id === "sellPriceId"
      ) {
        scrollToBottom();
      } else if (
        currentHeight < prevHeight &&
        (document.activeElement.id === "cascaderId" ||
          document.activeElement.id === "pincodeId")
      ) {
        scrollToBottomPrice();
      } else if (
        currentHeight < prevHeight &&
        document.activeElement.id === "descId"
      ) {
        scrollToBottomPincode();
      }
      prevHeight = currentHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const findRootOfLeaf = (value, nodes) => {
    for (const node of nodes) {
      if (node.children) {
        // Check if leaf exists in children
        const found = node.children.find((child) => child.value === value);
        if (found) {
          return node.value; // return root value
        } else {
          // recursively check deeper levels
          const deeper = findRootOfLeaf(value, node.children);
          if (deeper) return deeper;
        }
      }
    }
    return null;
  };

  const [popOpen, setPopOpen] = useState(false);

  const handleOpenChange = (newOpen) => {
    setPopOpen(newOpen);
  };

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
        {contextHolder}
        <div
          id={"addProductContainer"}
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
                    className={
                      isSubmitted ? (form.title ? "" : "my-red-border") : ""
                    }
                    status="error"
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
                  <div style={{ position: "relative" }}>
                    <TextArea
                      className={
                        isSubmitted
                          ? form.description
                            ? ""
                            : "my-red-border"
                          : ""
                      }
                      id={"descId"}
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
                      onClick={() => {
                        scrollToBottomPincode();
                      }}
                    />
                    <Popover
                      content={
                        "Please provide all the details about your item (e.g., for a phone: color, memory, condition) to help buyers make informed decisions."
                      }
                      title=""
                      trigger="click"
                      open={popOpen}
                      placement="topLeft"
                      styles={{ root: { width: "250px" } }}
                      onOpenChange={handleOpenChange}
                    >
                      <InfoCircleOutlined
                        style={{
                          position: "absolute",
                          right: "10px",
                          bottom: "10px",
                          zIndex: 10,
                          color: "#52c41a",
                        }}
                      />
                    </Popover>
                  </div>
                </Space.Compact>
                <Space.Compact
                  id={"tree-select-container-id"}
                  size="large"
                  style={{
                    position: "relative",
                  }}
                >
                  <TreeSelect
                    getPopupContainer={() =>
                      document.getElementById("tree-select-container-id")
                    }
                    className={
                      isSubmitted
                        ? form.subCategory
                          ? "my-custom-cascader"
                          : "my-red-border my-custom-cascader"
                        : "my-custom-cascader"
                    }
                    style={{
                      width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                    }}
                    styles={{
                      popup: {
                        root: { maxHeight: "400px", overflow: "auto" },
                      },
                    }}
                    value={form.subCategory || null}
                    placeholder="Category"
                    onChange={(value, node) => {
                      const root = findRootOfLeaf(value, options);
                      handleChange(root, "category");
                      handleChange(value, "subCategory");
                    }}
                    onSelect={(val, node) => {
                      handleChange(node.keywords, "keywords");
                    }}
                    onClear={() => {
                      handleChange([], "keywords");
                    }}
                    treeData={leafOptions}
                    onClick={() => {
                      scrollToBottomPrice();
                    }}
                    allowClear
                  />
                </Space.Compact>
                {/* <Space.Compact size="large" style={{ position: "relative" }}>
                  <Cascader
                    className={
                      isSubmitted
                        ? form.category
                          ? "my-custom-cascader"
                          : "my-red-border my-custom-cascader"
                        : "my-custom-cascader"
                    }
                    id={"cascaderId"}
                    popupMenuColumnStyle={{ width: "calc(50dvw - 25px)" }}
                    allowClear={false}
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                    }}
                    placeholder={"Category"}
                    onChange={(value) => {
                      handleChange(value, "category");
                    }}
                    onClick={(e) => {
                      const isClearButton =
                        e.target.closest(".ant-select-clear");
                      if (isClearButton) return;
                      scrollToBottomPrice();
                    }}
                    options={options}
                    value={
                      form.category
                        ? form.category + "/" + form.subCategory
                        : null
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
                </Space.Compact> */}
                <Space.Compact
                  size="large"
                  style={{
                    // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                  }}
                >
                  <Input
                    className={
                      isSubmitted
                        ? address || currentLocationLabel
                          ? ""
                          : "my-red-border"
                        : ""
                    }
                    id={"pincodeId"}
                    value={pincode}
                    onChange={handlePincode}
                    placeholder="Pincode"
                    // allowClear
                    onClick={() => {
                      scrollToBottomPrice();
                    }}
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
                <div
                  ref={bottomRefPincode}
                  style={{ display: "block", height: 0 }}
                ></div>
                <Space.Compact size="large">
                  <Button
                    className={
                      isSubmitted
                        ? address || currentLocationLabel
                          ? ""
                          : "my-red-border"
                        : ""
                    }
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
                {form.locationLabel && (
                  <Space.Compact size="large">
                    <Input
                      onChange={(e) => {
                        setForm((prevValue) => {
                          return {
                            ...prevValue,
                            location: "",
                            locationLabel: "",
                          };
                        });
                        setCurrentLocationLabel("");
                        setCurrentLocation("");
                        setCurrLocRemoved(true);
                        handlePincode(e);
                      }}
                      allowClear
                      style={{
                        width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                      }}
                      value={form.locationLabel}
                    />
                  </Space.Compact>
                )}
                {/* {currentLocationLabel && !address && (
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
                      onChange={handlePincode}
                      allowClear
                      style={{
                        width: !isMobile ? "50dvw" : "calc(100dvw - 30px)",
                      }}
                      value={address}
                      placeholder="Address"
                    />
                  </Space.Compact>
                )} */}
                <Space.Compact size="large">
                  <Input
                    className={
                      isSubmitted ? (form.price ? "" : "my-red-border") : ""
                    }
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
                    onClick={() => {
                      scrollToBottom();
                    }}
                  />
                </Space.Compact>
                <div
                  ref={bottomRefPrice}
                  style={{ display: "block", height: 0 }}
                ></div>
                <Space.Compact size="large">
                  <Space size="large" direction="vertical">
                    <Upload
                      accept="image/png,image/jpeg"
                      listType="picture"
                      fileList={form.images}
                      onPreview={handlePreview}
                      beforeUpload={handleBeforeUpload}
                      onChange={handleChangeImage}
                      maxCount={6}
                      multiple
                    >
                      <Button
                        className={
                          isSubmitted
                            ? form.images.length > 0
                              ? ""
                              : "my-red-border"
                            : ""
                        }
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
                {/* <Space.Compact size="large">
                  <span style={{ fontSize: "13px", fontWeight: "300" }}>
                    Max 6 images
                  </span>
                </Space.Compact> */}
                <Space.Compact size="large">
                  <span style={{ fontSize: "13px", fontWeight: "300" }}>
                    The ad will be deactivated automatically after 30 days
                  </span>
                </Space.Compact>
                <Space.Compact
                  size="large"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    style={{
                      background: "#52c41a",
                      fontSize: "13px",
                      fontWeight: "300",
                    }}
                    onClick={() => {
                      if (!isValid()) {
                        setIsSubmitted(true);
                        message.info("All fields are mandatory");
                        return;
                      }
                      if (count < 5) {
                        handleSubmit();
                      } else {
                        navigate("/checkout", { state: { adType: "POSTAD" } });
                      }
                    }}
                    type="primary"
                  >
                    Submit
                  </Button>
                </Space.Compact>
                <br />
                <div
                  ref={bottomRef}
                  style={{ display: "block", height: 0 }}
                ></div>
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
