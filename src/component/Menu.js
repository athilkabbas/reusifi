import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Menu } from "antd";
import {
  HomeFilled,
  UploadOutlined,
  MessageFilled,
  LogoutOutlined,
  SearchOutlined,
  ProductFilled,
  MailFilled,
  HeartFilled,
  LoadingOutlined,
  MenuOutlined,
  UpOutlined,
  DownOutlined,
  PlusCircleFilled,
  PlusCircleOutlined,
  MessageOutlined,
  ProductOutlined,
  HeartOutlined,
  HomeOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { signOut } from "@aws-amplify/auth";
import { Context } from "../context/provider";
import { useIsMobile } from "../hooks/windowSize";
const IconText = ["Home", "Sell", "Chats", "My Ads", "Favourites", ""];

const MenuWrapper = ({
  setScrollPosition,
  scrollableDivRef,
  defaultSelectedKeys,
}) => {
  const { unreadChatCount } = useContext(Context);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleNavigation = async (event) => {
    if (scrollableDivRef) {
      setScrollPosition(scrollableDivRef.current.scrollTop);
    }
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

  const filledIcons = [
    HomeFilled,
    PlusCircleFilled,
    MessageFilled,
    ProductFilled,
    HeartFilled,
    MenuOutlined,
  ];

  const outlinedIcons = [
    HomeOutlined,
    PlusCircleOutlined,
    MessageOutlined,
    ProductOutlined,
    HeartOutlined,
    MenuOutlined,
  ];

  let keyIndex = parseInt(defaultSelectedKeys[0]);
  console.log(keyIndex);
  if (keyIndex !== 0) {
    outlinedIcons.splice(keyIndex - 1, 1, filledIcons[keyIndex - 1]);
  }

  const items = outlinedIcons.map((icon, index) => {
    let divHtml;
    if (isMobile) {
      divHtml = (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 10,
            height: "60px",
            justifyContent: "center",
          }}
        >
          <span style={{ marginTop: "5px", color: "#389e0d", scale: "1.4" }}>
            {React.createElement(icon)}
          </span>
          <span
            style={{ fontSize: "10px", marginTop: "5px", color: "#389e0d" }}
          >
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
            fontSize: 10,
            height: "60px",
            alignItems: "center",
          }}
        >
          <span style={{ marginTop: "5px", color: "#389e0d" }}>
            {React.createElement(icon)}
          </span>
          <span
            style={{
              fontSize: "15px",
              marginTop: "5px",
              marginLeft: "5px",
              color: "#389e0d",
            }}
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
            label: <span style={{ color: "#389e0d" }}>Contact</span>,
            icon:
              keyIndex === 6 ? (
                <MailFilled style={{ color: "#389e0d" }} />
              ) : (
                <MailOutlined style={{ color: "#389e0d" }} />
              ),
          },
          {
            key: "6-2",
            label: <span style={{ color: "#389e0d" }}>Sign Out</span>,
            icon: <LogoutOutlined style={{ color: "#389e0d" }} />,
          },
        ],
      };
    }
    return {
      key: String(index + 1),
      icon: divHtml,
    };
  });

  return (
    <Menu
      onClick={(event) => handleNavigation(event)}
      mode="horizontal"
      defaultSelectedKeys={defaultSelectedKeys}
      items={items}
      style={{
        width: "100vw",
        justifyContent: "space-around",
        display: "flex",
        background: "white",
        fontSize: "13px",
        fontWeight: "300",
      }}
    />
  );
};

export default MenuWrapper;
