import React, { useContext, useEffect, useState } from "react";
import { Col, Row, Skeleton, Space, Spin } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Select } from "antd";
import { Breadcrumb, Layout, Menu, theme, Modal } from "antd";
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
  MailFilled,
  HeartFilled,
  LoadingOutlined
} from "@ant-design/icons";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
import { useTokenRefresh } from "../hooks/refreshToken";
const { Text, Link } = Typography;
const { TextArea } = Input;
const IconText = [
  "Home",
  "Upload",
  "Chats",
  "My Ads",
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
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    state: null,
    district: null,
    email: "",
    images: [],
    price: null,
  });
   const {
    setData,
    setInitialLoad,
    data,
    count,
    setCount,
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
    setExhaustedShards,
    setFavLastEvaluatedKey,
    setChatLastEvaluatedKey,
    setAdLastEvaluatedKey,
    addProductInitialLoad,
    setContactInitialLoad,
    setIChatInitialLoad,
    setAddProductInitialLoad,
    unreadChatCount,
    setUnreadChatCount
  } = useContext(Context);
  
    const errorSessionConfig = {
      title: 'Session has expired.',
      content: 'Please login again.',
      closable: false,
      maskClosable: false,
      okText: 'Login',
      onOk: () => {
        signOut()
      }
    }
   const errorConfig = {
  title: 'An error has occurred.',
  content: 'Please try again later.',
  closable: false,
  maskClosable: false,
  okText: 'Close',
  onOk: () => {
    navigate('/')
  }
}

    const token = useTokenRefresh()
    useEffect(() => {
      const getUser = async () => {
          let currentUser = await getCurrentUser();
        setForm((prevValue) => {
          return { ...prevValue, email: currentUser.userId };
        });
        setUser(currentUser);
      }
      getUser()
    },[])

      useEffect(() => {
  if (user && addProductInitialLoad && token) {
    try{
          setChatLoading(true);
    setLoading(true);

    const getChatCount = axios.get(
      `https://dwo94t377z7ed.cloudfront.net/prod/getChatsCount?userId1=${encodeURIComponent(user.userId)}&count=${encodeURIComponent(true)}`,
      { headers: { Authorization: token } }
    );

    const getAdCount = axios.get(
          `https://dwo94t377z7ed.cloudfront.net/prod/getProductsCount?count=${true}&email=${
            encodeURIComponent(user.userId)
          }`,
          { headers: { Authorization: token } }
        );


    Promise.all([getChatCount, getAdCount])
      .then(([chatResult,adResult]) => {
        setUnreadChatCount(chatResult.data.count);
        setCount(adResult.data.count);
      })
      .catch((err) => {
           if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
        console.error(err);
      })
      .finally(() => {
        setChatLoading(false);
        setLoading(false);
        setAddProductInitialLoad(false)
      });
    }
    catch(err){
       if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        Modal.error(errorConfig)
      }
    }
  }
}, [user, token, addProductInitialLoad]);

  const [districts, setDistricts] = useState([]);
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

    const items = [
    HomeFilled,
    UploadOutlined,
    MessageFilled,
    ProductFilled,
    MailFilled,
    HeartFilled,
    LogoutOutlined,
  ].map((icon, index) => {
    if (index === 2) {
      return {
        key: String(index + 1),
        icon: (
          <Badge dot={unreadChatCount}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
              <span style={{ fontSize: '16px', marginTop: '0px' }}>{React.createElement(icon)}</span>
              <span style={{ fontSize: '10px', marginTop: '5px' }}>{IconText[index]}</span>
            </div>
          </Badge>
        )
      };
    }
     return {
      key: String(index + 1),
      icon: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
        <span style={{ fontSize: '16px', marginTop: '0px' }}>{React.createElement(icon)}</span>
        <span style={{ fontSize: '10px', marginTop: '5px' }}>{IconText[index]}</span>
      </div>
    )
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
      message.info("Max size 30MB per image")
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
    message.info("All fields are mandatory")
    return;
  }

  setLoading(true);

  const thumbnailOptions = {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 250,
    useWebWorker: true,
    initialQuality: 0.75,
    fileType: "image/webp",
  };

  const viewingOptions = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.75,
    fileType: "image/webp",
  };

  try {
    // Compress thumbnails and viewings in parallel
    const compressedThumbnails = [await imageCompression(form.images[0], thumbnailOptions)];
    const compressedViewings = await Promise.all(
      form.images.map((image) => imageCompression(image, viewingOptions))
    );

    // Get upload URLs for thumbnails
    const thumbnailUploadUrlPromises = compressedThumbnails.map((img) =>
      axios.get(
        `https://dwo94t377z7ed.cloudfront.net/prod/getUrlNew?email=${encodeURIComponent(
          form.email
        )}&contentType=${encodeURIComponent(img.type)}`,
        { headers: { Authorization: token } }
      )
    );

    // Get upload URLs for viewing images
    const viewingUploadUrlPromises = compressedViewings.map((img) =>
      axios.get(
        `https://dwo94t377z7ed.cloudfront.net/prod/getUrlNew?email=${encodeURIComponent(
          form.email
        )}&contentType=${encodeURIComponent(img.type)}`,
        { headers: { Authorization: token } }
      )
    );

    const thumbnailUploadUrls = await Promise.all(thumbnailUploadUrlPromises);
    const viewingUploadUrls = await Promise.all(viewingUploadUrlPromises);

    // Upload thumbnails
    await Promise.all(
      compressedThumbnails.map((img, idx) =>
        axios.put(thumbnailUploadUrls[idx].data.uploadURL, img, {
          headers: { "Content-Type": img.type, "Cache-Control": "public, max-age=2592000" },
        })
      )
    );

    // Upload viewing images
    await Promise.all(
      compressedViewings.map((img, idx) =>
        axios.put(viewingUploadUrls[idx].data.uploadURL, img, {
          headers: { "Content-Type": img.type, "Cache-Control": "public, max-age=2592000" },
        })
      )
    );

    // Extract s3 keys separately
    const thumbnailS3Keys = thumbnailUploadUrls.map((res) => res.data.s3Key);
    const viewingS3Keys = viewingUploadUrls.map((res) => res.data.s3Key);

    // Prepare form data with separate keys for thumbnails and viewings
    const data = {
      title: form.title.trim().toLowerCase(),
      description: form.description.trim().toLowerCase(),
      state: form.state.toLowerCase(),
      district: form.district.toLowerCase(),
      email: form.email.toLowerCase(),
      price: parseInt(form.price),
      thumbnailS3Keys,
      viewingS3Keys,
    };

    await axios.post(
      "https://dwo94t377z7ed.cloudfront.net/prod/addProduct",
      data,
      { headers: { Authorization: token } }
    );
    setCount((prevValue) => prevValue + 1)
    setAdData([])
    setAdLastEvaluatedKey(null)
    setAdInitialLoad(true)
    setLoading(false);
    message.success("Ad submitted")
    navigate("/ads");
  } catch (err) {
    setLoading(false);
     if(err?.status === 401){
        Modal.error(errorSessionConfig)
      }
      else{
        message.error("An Error has occurred")
      }
    console.error("Error during submission:", err);
    // Optionally, handle error UI here
  }
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

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const isMobile = useIsMobile()
  return (
    <Layout style={{ height: "100dvh", overflow: "hidden",background:"#F9FAFB" }}>
      
         {!isMobile && <Header style={{ display: 'flex', alignItems: 'center', padding: '0px', height: '50px' }}>
                    <Menu
                      onClick={(event) => handleNavigation(event)}
                      theme="dark"
                      mode="horizontal"
                      defaultSelectedKeys={["2"]}
                      items={items}
                      style={{ minWidth: 0,justifyContent: 'space-around',
            flex: 1,background: "#6366F1" }}
                    />
                  </Header>}
      <Content style={{ padding: "0 15px" }}>
        <div
         className="hide-scrollbar overflow-auto"
          style={{
            background: '#F9FAFB',
            borderRadius: '0px',
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
                            display: "flex"
                          }}>
      <Space.Compact
                
                size="large"
              >
                <Input
                style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", width: !isMobile ? '50vw' : '85vw', marginTop: '30px'}}
                  onChange={(value) => handleChange(value, "title")}
                  placeholder="Title"
                  value={form.title}
                  maxLength={100}
                />
              </Space.Compact>
              <Space.Compact
                
                size="large"
              >
                <TextArea
                style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" ,width: !isMobile ? '50vw' : '85vw'}}
                  onChange={(value) => handleChange(value, "description")}
                  autoSize={{ minRows: 8, maxRows: 8 }}
                  placeholder="Description"
                  maxLength={300}
                  value={form.description}
                />
              </Space.Compact>
              <Space.Compact
                
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
                
                size="large"
              >
                <Input
                style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",width: !isMobile ? '50vw' : '85vw' }}
                  prefix="₹"
                  onChange={(value) => handleChange(value, "price")}
                  placeholder="Price"
                  value={form.price}
                  maxLength={100}
                />
              </Space.Compact>
              <Space.Compact
                
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
                
                size="large"
              >
                <Text>Max 6 images</Text>
              </Space.Compact>
              <Space.Compact
                
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
                
                size="large"
              >
                {count < 5 && (
                  <Text>
                    The ad will get deleted automatically after 30 days
                  </Text>
                )}
              </Space.Compact>
              <Space.Compact
                
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
                rows: 8,
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
          height: '50px'
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
            justifyContent: 'space-around',
            flex: 1,
            minWidth: 0,background: "#6366F1"
          }}
        />
      </Footer>}
    </Layout>
  );
};
export default AddDress;
