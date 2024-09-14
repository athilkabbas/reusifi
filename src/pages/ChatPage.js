import React, { useEffect, useState, useRef } from "react";
import { Col, message, Row } from "antd";
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
import { Divider, List, Typography } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { hashString } from "react-hash-string";
import { Card, Skeleton } from "antd";

import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
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
const ChatPage = () => {
  const [data, setData] = useState([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleNavigation = (event) => {
    switch (event.key) {
      case "1":
        navigate("/");
        break;
      case "2":
        navigate("/addDress");
        break;
      case "3":
        navigate("/chatPage");
        break;
      case "4":
        signOut();
        break;
    }
  };
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const getChats = async () => {
    setLoading(true);
    const result = await axios.get(
      `https://odkn534jbf.execute-api.ap-south-1.amazonaws.com/prod/getChat?userId1=${user.userId}&lastEvaluatedKey=${lastEvaluatedKey}`,
      { headers: { Authorization: "xxx" } }
    );
    setData((prevValue) => [...result.data.items, ...prevValue]);
    setLastEvaluatedKey(result.data.lastEvaluatedKey);
    // If no more data to load, set hasMore to false
    setLoading(false);
    if (!result.data.lastEvaluatedKey) {
      setHasMore(false);
    }
  };
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.userId) {
      getChats();
    }
  }, [user]);
  return (
    <Layout>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
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
      </Header>
      <Content
        style={{
          padding: "0 15px",
        }}
      >
        {!loading && (
          <div
            id="scrollableDiv"
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              overflow: "scroll",
              height: "100vh",
            }}
          >
            <InfiniteScroll
              style={{
                overflowX: "hidden",
              }}
              dataLength={data.length}
              next={getChats}
              hasMore={hasMore}
              inverse={true}
              loader={
                <Skeleton
                  avatar
                  paragraph={{
                    rows: 1,
                  }}
                  active
                />
              }
              endMessage={<Divider plain>It is all, nothing more</Divider>}
              scrollableTarget="scrollableDiv"
            >
              {data.map((item) => {
                return (
                  <Row style={{ padding: "10px" }}>
                    <Col span={24}>
                      <Card
                        onClick={() => {
                          navigate("/chat", {
                            state: { conversationId: item.conversationId },
                          });
                        }}
                        key={hashString(item.conversationId)}
                        title={hashString(item.conversationId)
                          .toString()
                          .slice(1)}
                        bordered={true}
                      >
                        <p>{item.message}</p>
                      </Card>
                    </Col>
                  </Row>
                );
              })}
            </InfiniteScroll>
          </div>
        )}
        {loading && <Skeleton />}
      </Content>
    </Layout>
  );
};

export default ChatPage;
