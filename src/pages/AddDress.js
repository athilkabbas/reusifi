import React, { useContext, useEffect, useState } from "react";
import { Col, Row, Skeleton, Space, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Select } from "antd";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload, Typography, message } from "antd";
import { Button, Badge } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import imageCompression from "browser-image-compression";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  MailOutlined,
  HeartOutlined,
  ProductFilled,
} from "@ant-design/icons";
import { Context } from "../context/provider";
const { Text, Link } = Typography;
const { TextArea } = Input;
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "Ads",
  "Contact",
  "Favourites",
  "SignOut",
];
const { Header, Content, Footer } = Layout;
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const AddDress = () => {
  const [user, setUser] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    state: null,
    district: null,
    email: "",
    images: [],
    price: null,
  });
  useEffect(() => {
    const fetchUser = async () => {
      let currentUser = await getCurrentUser();
      setForm((prevValue) => {
        return { ...prevValue, email: currentUser.userId };
      });
      setUser(currentUser);
      try {
        setLoading(true);
        let result;
        result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getDress?count=${true}&email=${
            currentUser.userId
          }`,
          { headers: { Authorization: "xxx" } }
        );
        setCount(result.data.count);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.log(err);
      }
    };
    fetchUser();
  }, []);

  const [districts, setDistricts] = useState([]);
  const [count, setCount] = useState(0);
  const handleChange = (value, type) => {
    if (type === "price" && !/^(|[1-9]\d*)$/.test(value.target.value)) {
      return;
    }
    setForm((prevValue) => {
      if (
        type === "category" ||
        type === "title" ||
        type === "description" ||
        type === "price"
      ) {
        return { ...prevValue, [type]: value.target.value };
      }
      return { ...prevValue, [type]: value };
    });
  };

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const {
    setData,
    setInitialLoad,
    data,
    setHomeInitialLoad,
    setAdInitialLoad,
    setChatData,
    setFavData,
    setAdData,
    setFavInitialLoad,
    setChatInitialLoad,
    setFavPageInitialLoad,
    setAdPageInitialLoad,
    setChatPageInitialLoad,
  } = useContext(Context);

  useEffect(() => {
    const getChatCount = async () => {
      setChatLoading(true);
      try {
        const result = await axios.get(
          `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${
            user.userId
          }&count=${true}`,
          { headers: { Authorization: "xxx" } }
        );
        setUnreadChatCount(result.data.count);
        setChatLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (user) {
      getChatCount();
    }
  }, [user]);
  const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    MailOutlined,
    HeartOutlined,
    LogoutOutlined,
  ].map((icon, index) => {
    if (index === 2) {
      return {
        key: String(index + 1),
        icon: (
          <Badge overflowCount={999} count={unreadChatCount}>
            {React.createElement(icon)}
          </Badge>
        ),
        label: IconText[index],
      };
    }
    return {
      key: String(index + 1),
      icon: React.createElement(icon),
      label: IconText[index],
    };
  });
  const navigate = useNavigate();
  const handleNavigation = (event) => {
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
        navigate("/contact");
        break;
      case "6":
        navigate("/favourite");
        break;
      case "7":
        signOut();
        break;
    }
  };
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };
  const handleChangeImage = (file) => {
    setFileList(file.fileList);
  };
  useEffect(() => {
    if (data.length > 0) {
      setInitialLoad(false);
    } else {
      setInitialLoad(true);
    }
  }, []);
  useEffect(() => {
    setForm((prevValue) => {
      return {
        ...prevValue,
        images: fileList.map((item) => item.originFileObj),
      };
    });
  }, [fileList]);
  const handleSubmit = async () => {
    let invalid = false;
    for (let key in form) {
      if (key === "images" && form[key].length === 0) {
        invalid = true;
      } else if (form[key] === "" || form[key] === null) {
        invalid = true;
      }
    }
    if (invalid) {
      infoAllFieldsMandatory();
      return;
    }
    setData([]);
    setInitialLoad(true);
    setLoading(true);
    const formData = new FormData();
    const options = {
      maxSizeMB: 0.01, // Try to compress the image down to ~10 KB
      maxWidthOrHeight: 800, // Limit the width/height (e.g., 100px)
      useWebWorker: true, // Enable web worker for performance
      initialQuality: 0.6, // Start with low quality for aggressive compression
    };
    for (let i = 0; i < form.images.length; i++) {
      if (form.images[i].size / 1024 / 1024 > 50) {
        setLoading(false);
        info();
        return;
      }
      let compressImage = await imageCompression(form.images[i], options);
      formData.append(`image${i}`, compressImage);
    }
    formData.append("category", form.category);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("state", form.state);
    formData.append("district", form.district);
    formData.append("email", form.email);
    formData.append("price", form.price);
    await axios.post(
      "https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/addDress",
      formData,
      {
        headers: {
          Authorization: "xxx",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    setLoading(false);
    navigate("/");
  };
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

  useEffect(() => {
    setFavData([]);
    setFavInitialLoad(true);
    setAdData([]);
    setAdInitialLoad(true);
    setChatData([]);
    setChatInitialLoad(true);
    setAdPageInitialLoad(true);
    setFavPageInitialLoad(true);
    setChatPageInitialLoad(true);
  }, []);

  useEffect(() => {
    setHomeInitialLoad(false);
  }, []);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const info = () => {
    messageApi.info("Max size 50MB per image");
  };
  const infoAllFieldsMandatory = () => {
    messageApi.info("All fields are mandatory");
  };
  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Content style={{ padding: "0 15px" }}>
        <div
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "scroll",
            height: "100%",
            paddingBottom: "60px",
          }}
        >
          {contextHolder}
          {!loading && !chatLoading && user && (
            <>
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                <Input
                  onChange={(value) => handleChange(value, "category")}
                  placeholder="Category"
                  value={form.category}
                />
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                <Input
                  onChange={(value) => handleChange(value, "title")}
                  placeholder="Title"
                  value={form.title}
                />
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                <TextArea
                  onChange={(value) => handleChange(value, "description")}
                  rows={4}
                  placeholder="Description"
                  maxLength={100}
                  value={form.description}
                />
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                <Select
                  onChange={(value) => {
                    handleChange(value, "state");
                    let districts = districtMap();
                    setDistricts(districts[value]);
                  }}
                  showSearch
                  style={{
                    width: 190,
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
              </Space.Compact>
              {districts.length > 0 && (
                <Space.Compact
                  block={true}
                  size="large"
                  style={{ padding: "10px" }}
                >
                  <Select
                    onChange={(value) => {
                      handleChange(value, "district");
                    }}
                    showSearch
                    style={{
                      width: 190,
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
              )}
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                <Input
                  prefix="₹"
                  onChange={(value) => handleChange(value, "price")}
                  placeholder="Price"
                  value={form.price}
                />
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                <Upload
                  accept="image/png,image/jpeg"
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleChangeImage}
                  maxCount={4}
                  multiple
                >
                  {fileList.length >= 4 ? null : uploadButton}
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
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                {count < 10 && <Text>Max 4 images</Text>}
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                {count < 10 && (
                  <Button onClick={handleSubmit} type="primary">
                    Submit
                  </Button>
                )}
                {count >= 10 && (
                  <Button onClick={handleSubmit} type="primary" disabled>
                    Submit
                  </Button>
                )}
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                {count < 10 && (
                  <Text>
                    The ad will get deleted automatically after 30 days
                  </Text>
                )}
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ padding: "10px" }}
              >
                {count >= 10 && <Text>Max 10 ads</Text>}
              </Space.Compact>
            </>
          )}
          {(loading || chatLoading) && <Spin fullscreen />}
        </div>
      </Content>
      <Footer
        style={{
          position: "fixed",
          bottom: 0,
          zIndex: 1,
          width: "100vw",
          display: "flex",
          alignItems: "center",
          padding: "0px",
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
            flex: 1,
            minWidth: 0,
          }}
        />
      </Footer>
    </Layout>
  );
};
export default AddDress;
