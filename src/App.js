import { useContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";
import {
  signInWithRedirect,
  getCurrentUser,
  fetchAuthSession,
} from "@aws-amplify/auth";

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
    setChatInitialLoad,
    setChatData,
    setChatLastEvaluatedKey,
  } = useContext(Context);
  const [socketLoading, setSocketLoading] = useState(false);
  useEffect(() => {
    let socket = null;
    let reconnectTimeout = null;

    const fetchNotifications = async () => {
      setSocketLoading(true);
      let token = "";
      let session;
      try {
        session = await fetchAuthSession();
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
          Modal.error({ ...errorConfig, content: err.message });
        }
        return;
      }
      const tokens = session.tokens;
      if (tokens?.idToken) {
        token = tokens.idToken;
      } else {
        Modal.error(errorSessionConfig);
        return;
      }
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
      };

      socket.onmessage = async (event) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return; // guard
        setChatData([]);
        setChatLastEvaluatedKey(null);
        setChatInitialLoad(true);
        setUnreadChatCount(1);
      };

      socket.onclose = () => {
        reconnectTimeout = setTimeout(() => {
          fetchNotifications();
        }, 1000);
      };
    };

    fetchNotifications();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }
      }
    };
  }, []);

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
