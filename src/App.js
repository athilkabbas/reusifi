import { useContext, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";
import {
  signInWithRedirect,
  getCurrentUser,
  fetchAuthSession,
  signOut,
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

Amplify.configure(awsconfig);

function App() {
  return (
    <BrowserRouter>
      <AppWithSession />
    </BrowserRouter>
  );
}

function AppWithSession() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checkSession, setCheckSession] = useState(false);
  const [checked, setChecked] = useState(false);
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
      let token = "";
      let session;
      try {
        setCheckSession(true);
        session = await fetchAuthSession();
        const tokens = session.tokens;
        if (tokens?.idToken) {
          token = tokens.idToken;
          setIsSignedIn(true);
          setCheckSession(false);
          setChecked(true);
          const currentUser = await getCurrentUser();
          setSocketLoading(true);
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
            }, 300);
          };
        } else {
          throw new Error();
        }
      } catch (err) {
        setSocketLoading(false);
        setIsSignedIn(false);
        setCheckSession(false);
        setChecked(true);
        if (isModalVisibleRef.current) {
          return;
        }
        isModalVisibleRef.current = true;
        Modal.error(errorSessionConfig);
        return;
      }
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
  if (socketLoading || checkSession) {
    return (
      <Spin
        fullscreen
        indicator={
          <LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />
        }
      />
    );
  }

  if (checked && !isSignedIn && !isModalVisibleRef.current) {
    // return (
    //   <div
    //     style={{
    //       display: "flex",
    //       height: "100%",
    //       justifyContent: "center",
    //       alignItems: "center",
    //       fontSize: "1.5rem",
    //       color: "#6366F1",
    //       fontWeight: "600",
    //       backgroundColor: "#F5F7FF",
    //     }}
    //   >
    //     Redirecting to sign in...
    //   </div>
    // );
    signInWithRedirect();
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
