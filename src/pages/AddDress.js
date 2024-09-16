import React, { useEffect, useState } from "react";
import { Col, Row, Skeleton, Space } from "antd";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Select } from "antd";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { states, districts, districtMap } from "../helpers/locations";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import { Button } from "antd";
import axios from "axios";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
} from "@ant-design/icons";
const { TextArea } = Input;
const IconText = ["Home", "Upload", "Chats", "SignOut"];
const items = [HomeFilled, UploadOutlined, MessageFilled, LogoutOutlined].map(
  (icon, index) => ({
    key: String(index + 1),
    icon: React.createElement(icon),
    label: IconText[index],
  })
);
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
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    state: "",
    district: "",
    email: "",
    images: [],
    price: 0,
  });
  useEffect(() => {
    const fetchUser = async () => {
      let currentUser = await getCurrentUser();
      setForm((prevValue) => {
        return { ...prevValue, email: currentUser.userId };
      });
      setUser(currentUser);
    };
    fetchUser();
  }, []);
  const [districts, setDistricts] = useState([]);
  const handleChange = (value, type) => {
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
        signOut();
        break;
    }
  };
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
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
    setForm((prevValue) => {
      return {
        ...prevValue,
        images: fileList.map((item) => item.originFileObj),
      };
    });
  }, [fileList]);
  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    for (let i = 0; i < form.images.length; i++) {
      formData.append(`image${i}`, form.images[i]);
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
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout>
      <Content style={{ padding: "0 15px" }}>
        <div
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "scroll",
            height: "100vh",
          }}
        >
          {!loading && user && (
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
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleChangeImage}
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
                <Button onClick={handleSubmit} type="primary">
                  Submit
                </Button>
              </Space.Compact>
            </>
          )}
          {loading && <Skeleton />}
        </div>
      </Content>
      <Footer
        style={{
          position: "sticky",
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
