import { useContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";
import { signInWithRedirect, getCurrentUser } from "@aws-amplify/auth";

import AddDress from "./pages/AddDress";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Details from "./pages/Details";
import Chat from "./pages/Chat";
import ChatPage from "./pages/ChatPage";
import Ads from "./pages/Ads";
import Contact from "./pages/Contact";
import Favourites from "./pages/Favourite";
import { Spin, Modal } from "antd";
import { Context } from "./context/provider";

import "./App.css";
import { useSessionCheck } from "./hooks/sessionCheck";

Amplify.configure(awsconfig);

function App() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);

    return () => window.removeEventListener("resize", setVH);
  }, []);

  return (
    <BrowserRouter>
      <AppWithSession />
    </BrowserRouter>
  );
}

const errorSessionConfig = {
  title: "Session has expired.",
  content: "Please login again.",
  closable: false,
  maskClosable: false,
  okText: "Login",
  onOk: () => {
    signInWithRedirect();
  },
};
const errorConfig = {
  title: "An error has occurred.",
  content: "Please login again.",
  closable: false,
  maskClosable: false,
  okText: "Login",
  onOk: () => {
    signInWithRedirect();
  },
};

function AppWithSession() {
  const { isSignedIn, checked } = useSessionCheck();
  const {
    setUnreadChatCount,
    token,
    setChatInitialLoad,
    setChatData,
    setChatLastEvaluatedKey,
  } = useContext(Context);
  const [socketLoading, setSocketLoading] = useState(false);
  useEffect(() => {
    let socket;
    const fetchNotifications = async () => {
      try {
        setSocketLoading(true);
        const currentUser = await getCurrentUser();

        socket = new WebSocket(
          `wss://apichat.reusifi.com/production?userId=${currentUser.userId}&token=${token}`
        );
        socket.onopen = () => {
          console.log("Connected to the WebSocket");
          setSocketLoading(false);
        };

        socket.onerror = (err) => {
          setSocketLoading(false);
          Modal.error(errorConfig);
        };

        socket.onmessage = async (event) => {
          setChatData([]);
          setChatLastEvaluatedKey(null);
          setChatInitialLoad(true);
          setUnreadChatCount(1);
        };
        // To close the connection
        socket.onclose = () => {
          console.log("Disconnected from WebSocket");
        };
      } catch (err) {
        setSocketLoading(false);
        if (
          err?.name === "NotAuthorizedException" &&
          err?.message?.includes("Refresh Token has expired")
        ) {
          Modal.error(errorSessionConfig);
        } else if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
      }
    };
    if (token) {
      fetchNotifications();
    }
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      } else if (socket && socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => {
          socket.close();
        };
      }
    };
  }, [token]);

  if (socketLoading) {
    return (
      <Spin
        fullscreen
        indicator={
          <LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />
        }
      />
    );
  }

  if (!checked) {
    return (
      <Spin
        fullscreen
        indicator={
          <LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />
        }
      />
    );
  }

  if (!isSignedIn) {
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.5rem",
          color: "#6366F1",
          fontWeight: "600",
          backgroundColor: "#F5F7FF",
        }}
      >
        Redirecting to sign in...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="addProduct" element={<AddDress />} />
        <Route path="details" element={<Details />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chatPage" element={<ChatPage />} />
        <Route path="ads" element={<Ads />} />
        <Route path="contact" element={<Contact />} />
        <Route path="favourite" element={<Favourites />} />
      </Route>
    </Routes>
  );
}

export default App;
