import React, { useContext, useEffect, useRef, useState } from "react";
import { Skeleton, Space, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Select, Cascader } from "antd";
import { Layout, Menu, theme, Modal } from "antd";
import { states, districtMap } from "../helpers/locations";
import { locationsCascader } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload, Typography, message } from "antd";
import { Button, Badge } from "antd";
import axios from "axios";
import { getCurrentUser, signInWithRedirect, signOut } from "@aws-amplify/auth";
import imageCompression from "browser-image-compression";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  ProductFilled,
  MailFilled,
  HeartFilled,
  LoadingOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { callApi } from "../helpers/api";
const { Text } = Typography;
const { TextArea } = Input;
const IconText = ["Home", "Sell", "Chats", "My Ads", "Favourites", ""];
const { Header, Content, Footer } = Layout;
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export const options = [
  {
    value: "electronics",
    label: "Electronics",
    children: [
      { value: "mobile-phones", label: "Mobile Phones" },
      { value: "laptops-computers", label: "Laptops & Computers" },
      { value: "tablets", label: "Tablets" },
      { value: "tvs-monitors", label: "TVs & Monitors" },
      { value: "cameras", label: "Cameras" },
      { value: "audio-headphones", label: "Audio & Headphones" },
      { value: "gaming-consoles", label: "Gaming Consoles" },
      { value: "wearables", label: "Wearables" },
      { value: "accessories-cables", label: "Accessories & Cables" },
    ],
  },
  {
    value: "home-furniture",
    label: "Home & Furniture",
    children: [
      { value: "sofas-chairs", label: "Sofas & Chairs" },
      { value: "tables-desks", label: "Tables & Desks" },
      { value: "beds-mattresses", label: "Beds & Mattresses" },
      { value: "storage", label: "Storage (Wardrobes, Shelves)" },
      { value: "home-decor", label: "Home Decor" },
      { value: "kitchen-appliances", label: "Kitchen Appliances" },
      { value: "lighting", label: "Lighting" },
    ],
  },
  {
    value: "vehicles",
    label: "Vehicles",
    children: [
      { value: "cars", label: "Cars" },
      { value: "motorbikes-scooters", label: "Motorbikes & Scooters" },
      { value: "bicycles", label: "Bicycles" },
      { value: "auto-parts", label: "Auto Parts & Accessories" },
    ],
  },
  {
    value: "fashion",
    label: "Fashion",
    children: [
      { value: "mens-clothing", label: "Men’s Clothing" },
      { value: "womens-clothing", label: "Women’s Clothing" },
      { value: "footwear", label: "Footwear" },
      { value: "bags-luggage", label: "Bags & Luggage" },
      { value: "watches-jewelry", label: "Watches & Jewelry" },
    ],
  },
  {
    value: "books-education",
    label: "Books & Education",
    children: [
      { value: "textbooks", label: "Textbooks" },
      { value: "exam-materials", label: "Exam Materials" },
      { value: "novels", label: "Novels" },
      { value: "study-furniture", label: "Study Tables/Chairs" },
      { value: "stationery", label: "Stationery" },
    ],
  },
  {
    value: "kids-toys",
    label: "Kids & Toys",
    children: [
      { value: "toys-games", label: "Toys & Games" },
      { value: "baby-gear", label: "Baby Gear" },
      { value: "kids-clothing", label: "Kids’ Clothing" },
      { value: "strollers-cribs", label: "Strollers & Cribs" },
    ],
  },
  {
    value: "jobs-services",
    label: "Jobs & Services",
    children: [
      { value: "part-time-jobs", label: "Part-Time Jobs" },
      { value: "freelance-services", label: "Freelance Services" },
      { value: "tuitions-classes", label: "Tuitions & Classes" },
      { value: "home-services", label: "Home Services" },
    ],
  },
  {
    value: "others",
    label: "Others",
    children: [
      { value: "pet-supplies", label: "Pet Supplies" },
      { value: "sports-equipment", label: "Sports Equipment" },
      { value: "musical-instruments", label: "Musical Instruments" },
      { value: "tools-machinery", label: "Tools & Machinery" },
      { value: "collectibles-antiques", label: "Collectibles & Antiques" },
      { value: "miscellaneous", label: "Miscellaneous" },
    ],
  },
];

const AddDress = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    state: null,
    district: null,
    email: "",
    images: [],
    price: null,
  });
  const {
    count,
    setCount,
    setAdInitialLoad,
    setAdData,
    setAdLastEvaluatedKey,
    addProductInitialLoad,
    setAddProductInitialLoad,
    unreadChatCount,
    setUnreadChatCount,
  } = useContext(Context);
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

  useEffect(() => {
    const getUser = async () => {
      let currentUser = await getCurrentUser();
      setForm((prevValue) => {
        return { ...prevValue, email: currentUser.userId };
      });
      setUser(currentUser);
    };
    getUser();
  }, []);

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
            console.error(err);
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

  const [districts, setDistricts] = useState([]);
  const handleChange = (value, type) => {
    if (type === "price" && !/^(|[1-9]\d*)$/.test(value.target.value)) {
      return;
    }
    setForm((prevValue) => {
      if (type === "title" || type === "description" || type === "price") {
        return { ...prevValue, [type]: value.target.value };
      } else if (type === "location") {
        return { ...prevValue, state: value[0], district: value[1] };
      } else if (type === "location" || type === "category") {
        return { ...prevValue, category: value[0], subCategory: value[1] };
      }
      return { ...prevValue, [type]: value };
    });
  };

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
  const navigate = useNavigate();
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
        signOut();
        break;
    }
  };
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
  };

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
      fileType: "image/webp",
    };

    const viewingOptions = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: "image/webp",
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
        )}&contentType=${encodeURIComponent("image/webp")}&count=${
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
              "Content-Type": "image/webp",
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
        state: form.state.toLowerCase(),
        district: form.district.toLowerCase(),
        email: form.email.toLowerCase(),
        price: parseInt(form.price),
        category: form.category.toLowerCase(),
        subCategory: form.category.toLowerCase(),
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
        Modal.error({
          ...errorSessionConfig,
          content: err.message + "add dress",
        });
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
  const uploadButton = (
    <button
      style={{
        border: 0,
        background: "none",
      }}
      type="button"
    >
      <PlusOutlined />
      <div
        style={{
          marginTop: 8,
        }}
      >
        Upload
      </div>
    </button>
  );

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout
      style={{
        height: "100dvh",
        overflow: "hidden",
        background: "#F9FAFB",
      }}
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
            defaultSelectedKeys={["2"]}
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
      <Content>
        <div
          className="hide-scrollbar overflow-auto"
          style={{
            background: "#F9FAFB",
            borderRadius: "0px",
            overflow: "scroll",
            height: "100%",
            paddingBottom: "60px",
          }}
        >
          {!loading && !chatLoading && user && (
            <>
              <Space
                size="large"
                direction="vertical"
                style={{
                  padding: "20px",
                  display: "flex",
                }}
              >
                <Space.Compact size="large">
                  <Input
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50vw" : "85vw",
                      marginTop: "30px",
                      border: "2px solid",
                    }}
                    onChange={(value) => handleChange(value, "title")}
                    placeholder="Title"
                    value={form.title}
                    maxLength={100}
                  />
                </Space.Compact>
                <Space.Compact size="large">
                  <TextArea
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50vw" : "85vw",
                      border: "2px solid",
                    }}
                    onChange={(value) => handleChange(value, "description")}
                    autoSize={{ minRows: 8, maxRows: 8 }}
                    placeholder="Description"
                    maxLength={300}
                    value={form.description}
                  />
                </Space.Compact>
                <Space.Compact size="large">
                  <Cascader
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50vw" : "85vw",
                      border: "1px solid",
                      borderRadius: "9px",
                    }}
                    showSearch={{ filter }}
                    onSearch={(value) => {
                      handleChange(value, "location");
                    }}
                    placeholder={"Category"}
                    onChange={(value) => {
                      handleChange(value, "category");
                    }}
                    options={options}
                  ></Cascader>
                </Space.Compact>
                <Space.Compact size="large">
                  <Cascader
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50vw" : "85vw",
                      border: "1px solid",
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
                </Space.Compact>
                {/* <Space.Compact size="large">
                  <Select
                    onChange={(value) => {
                      handleChange(value, "state");
                      let districts = districtMap();
                      setDistricts(districts[value]);
                    }}
                    showSearch
                    style={{
                      width: 190,
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    value={form.state}
                    placeholder="Select State"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? "")
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? "").toLowerCase())
                    }
                    options={states}
                  />
                </Space.Compact> */}
                {/* {districts.length > 0 && (
                  <Space.Compact size="large">
                    <Select
                      onChange={(value) => {
                        handleChange(value, "district");
                      }}
                      showSearch
                      style={{
                        width: 190,
                        // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      value={form.district}
                      placeholder="Select District"
                      optionFilterProp="label"
                      filterSort={(optionA, optionB) =>
                        (optionA?.label ?? "")
                          .toLowerCase()
                          .localeCompare((optionB?.label ?? "").toLowerCase())
                      }
                      options={districts}
                    />
                  </Space.Compact>
                )} */}
                <Space.Compact size="large">
                  <Input
                    style={{
                      // boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      width: !isMobile ? "50vw" : "85vw",
                      border: "2px solid",
                    }}
                    prefix="₹"
                    onChange={(value) => handleChange(value, "price")}
                    placeholder="Price"
                    value={form.price}
                    maxLength={15}
                  />
                </Space.Compact>
                <Space.Compact size="large">
                  <Upload
                    accept="image/png,image/jpeg"
                    listType="picture-card"
                    fileList={fileList}
                    onPreview={handlePreview}
                    beforeUpload={() => false}
                    onChange={handleChangeImage}
                    maxCount={6}
                    multiple
                    style={{ border: "2px solid", borderRadius: "11px" }}
                  >
                    {fileList.length >= 6 ? null : uploadButton}
                  </Upload>
                  {previewImage && (
                    <Image
                      wrapperStyle={{
                        display: "none",
                      }}
                      preview={{
                        visible: previewOpen,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        afterOpenChange: (visible) =>
                          !visible && setPreviewImage(""),
                      }}
                      src={previewImage}
                    />
                  )}
                </Space.Compact>
                <Space.Compact size="large">
                  <Text>Max 6 images</Text>
                </Space.Compact>
                <Space.Compact
                  size="large"
                  style={{
                    display: "flex",
                    justifyContent: !isMobile ? "flex-start" : "center",
                    marginTop: "30px",
                  }}
                >
                  {count < 5 && (
                    <Button
                      style={{ background: "#10B981" }}
                      onClick={handleSubmit}
                      type="primary"
                      disabled={count >= 5 ? true : false}
                    >
                      Submit
                    </Button>
                  )}
                </Space.Compact>
                <Space.Compact size="large">
                  {count < 5 && (
                    <Text>
                      The ad will get deleted automatically after 30 days
                    </Text>
                  )}
                </Space.Compact>
                <Space.Compact size="large">
                  {count >= 5 && <Text>Max 5 ads</Text>}
                </Space.Compact>
              </Space>
            </>
          )}
          {(loading || chatLoading) && (
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
            defaultSelectedKeys={["2"]}
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
      {submitLoading && (
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
export default AddDress;
