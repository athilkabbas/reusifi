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
  LoadingOutlined
} from "@ant-design/icons";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
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
      if (type === "title" || type === "description" || type === "price") {
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
    setLastEvaluatedKey,
    setLastEvaluatedKeys,
    setFavLastEvaluatedKey,
    setChatLastEvaluatedKey,
    setAdLastEvaluatedKey,
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
    if (file.file.size / 1024 / 1024 > 30) {
      info();
      return;
    }
    let newFileList = file.fileList.filter(
      (file) => file.size / 1024 / 1024 <= 30
    );
    setFileList(newFileList);
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
    setLastEvaluatedKey(null);
    setLastEvaluatedKeys({});
    setLoading(true);
    const options = {
      maxSizeMB: 0.01, // Try to compress the image down to ~10 KB
      useWebWorker: true, // Enable web worker for performance
      initialQuality: 1, // Start with low quality for aggressive compression
    };
    let s3Keys = [];
    for (let i = 0; i < form.images.length; i++) {
      let compressImage = await imageCompression(form.images[i], options);
      const url = await axios.get(
        `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getUrl?email=${form.email}`,
        {
          headers: {
            Authorization: "xxx",
          },
        }
      );
      s3Keys.push(url.data.s3Key);
      await axios.put(url.data.uploadURL, compressImage);
    }
    let data = {
      title: form.title.trim().toLowerCase(),
      description: form.description.trim().toLowerCase(),
      state: form.state.toLowerCase(),
      district: form.district.toLowerCase(),
      email: form.email.toLowerCase(),
      price: parseInt(form.price.toLowerCase()),
      s3Keys,
    };
    await axios.post(
      "https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/addDress",
      data,
      {
        headers: {
          Authorization: "xxx",
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
    setFavLastEvaluatedKey(null);
    setAdData([]);
    setAdInitialLoad(true);
    setAdLastEvaluatedKey(null);
    setChatData([]);
    setChatInitialLoad(true);
    setChatLastEvaluatedKey(null);
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
    messageApi.info("Max size 30MB per image");
  };
  const infoAllFieldsMandatory = () => {
    messageApi.info("All fields are mandatory");
  };
  const isMobile = useIsMobile()
  return (
    <Layout style={{ height: "100vh", overflow: "hidden",background:"#F9FAFB" }}>
         {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px' }}>
                    <Menu
                      onClick={(event) => handleNavigation(event)}
                      theme="dark"
                      mode="horizontal"
                      defaultSelectedKeys={["2"]}
                      items={items}
                      style={{ minWidth: 0, flex: "auto",background: "#6366F1" }}
                    />
                  </Header>}
      <Content style={{ padding: "0 15px" }}>
        <div
          style={{
            background: '#F9FAFB',
            borderRadius: '0px',
            overflow: "scroll",
            height: "100%",
            paddingBottom: "60px",
          }}
        >
          {contextHolder}
          {!loading && !chatLoading && user && (
            <>
               <Space   block={true}
                            size="large"  
                            direction="vertical"
                            style={{
                            padding: "20px",
                            display: "flex"
                          }}>
      <Space.Compact
                block={true}
                size="large"
              >
                <Input
                style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", width: !isMobile ? '50vw' : '90vw', marginTop: '30px'}}
                  onChange={(value) => handleChange(value, "title")}
                  placeholder="Title"
                  value={form.title}
                  maxLength={100}
                />
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
              >
                <TextArea
                style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" ,width: !isMobile ? '50vw' : '90vw'}}
                  onChange={(value) => handleChange(value, "description")}
                  autoSize={{ minRows: 8, maxRows: 8 }}
                  placeholder="Description"
                  maxLength={300}
                  value={form.description}
                />
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
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
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
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
                >
                  <Select
                    onChange={(value) => {
                      handleChange(value, "district");
                    }}
                    showSearch
                    style={{
                      width: 190,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
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
              >
                <Input
                style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",width: !isMobile ? '50vw' : '90vw' }}
                  prefix="₹"
                  onChange={(value) => handleChange(value, "price")}
                  placeholder="Price"
                  value={form.price}
                  maxLength={100}
                />
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
              >
                <Upload
                  accept="image/png,image/jpeg"
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  beforeUpload={() => false}
                  onChange={handleChangeImage}
                  maxCount={6}
                  multiple
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
              <Space.Compact
                block={true}
                size="large"
              >
                <Text>Max 6 images</Text>
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
                style={{ display: "flex", justifyContent: !isMobile ? 'flex-start' : 'center', marginTop: '30px' }}
              >
                {count < 5 && (
                  <Button style={{ background: "#10B981" }} onClick={handleSubmit} type="primary" disabled={count >= 5 ? true : false}>
                    Submit
                  </Button>
                )}
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
              >
                {count < 5 && (
                  <Text>
                    The ad will get deleted automatically after 30 days
                  </Text>
                )}
              </Space.Compact>
              <Space.Compact
                block={true}
                size="large"
              >
                {count >= 5 && <Text>Max 5 ads</Text>}
              </Space.Compact>
                          </Space>
            </>
          )}
          {(loading || chatLoading) && 
           <Skeleton
              paragraph={{
                rows: 16,
              }}
              active
            />
          }
        </div>
      </Content>
      {isMobile && <Footer
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
            flex: "auto",
            minWidth: 0,background: "#6366F1"
          }}
        />
      </Footer>}
    </Layout>
  );
};
export default AddDress;
