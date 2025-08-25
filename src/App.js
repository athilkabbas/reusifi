import { useContext, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";
import { getCurrentUser, fetchAuthSession } from "@aws-amplify/auth";

import AddDress from "./pages/AddDress";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Details from "./pages/Details";
import Chat from "./pages/Chat";
import ChatPage from "./pages/ChatPage";
import Ads from "./pages/Ads";
import Contact from "./pages/Contact";
import Favourites from "./pages/Favourite";
import { Spin } from "antd";
import { Context } from "./context/provider";

import "./App.css";
import CheckRender from "./helpers/checkRender";
import ReusifiLanding from "./pages/landingPage";

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
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const {
    setUnreadChatCount,
    setChatInitialLoad,
    setChatData,
    setChatLastEvaluatedKey,
    setUser,
    setEmail,
  } = useContext(Context);

  const [socketLoading, setSocketLoading] = useState(false);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setCheckSession(true);
        const session = await fetchAuthSession();
        const tokens = session.tokens;

        if (tokens?.idToken) {
          const token = tokens.idToken.toString();
          setIsSignedIn(true);
          setCheckSession(false);
          setChecked(true);

          const decoded = JSON.parse(atob(token.split(".")[1]));
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setEmail(decoded.email);
          setSocketLoading(true);

          socketRef.current = new WebSocket(
            `wss://apichat.reusifi.com/production?userId=${currentUser.userId}&token=${token}`
          );

          socketRef.current.onopen = () => {
            setSocketLoading(false);
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          };

          socketRef.current.onerror = () => {
            if (!reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                fetchNotifications();
                reconnectTimeoutRef.current = null;
              }, 3000);
            }
          };

          socketRef.current.onmessage = () => {
            if (
              !socketRef.current ||
              socketRef.current.readyState !== WebSocket.OPEN
            )
              return;
            setChatData([]);
            setChatLastEvaluatedKey(null);
            setChatInitialLoad(true);
            setUnreadChatCount(1);
          };

          socketRef.current.onclose = () => {
            if (!reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                fetchNotifications();
                reconnectTimeoutRef.current = null;
              }, 3000);
            }
          };
        } else {
          throw new Error();
        }
      } catch (err) {
        setSocketLoading(false);
        setIsSignedIn(false);
        setCheckSession(false);
        setChecked(true);
      }
    };

    fetchNotifications();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        if (
          socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING
        ) {
          socketRef.current.close();
        }
      }
    };
  }, []);
  if (checked && !isSignedIn) {
    return <ReusifiLanding />;
  }
  return (
    <>
      {!socketLoading && !checkSession && checked && isSignedIn && (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="addProduct" element={<AddDress />} />
            <Route
              path="details"
              element={
                <CheckRender>
                  <Details />
                </CheckRender>
              }
            />
            <Route
              path="chat"
              element={
                <CheckRender>
                  <Chat />
                </CheckRender>
              }
            />
            <Route path="chatPage" element={<ChatPage />} />
            <Route path="ads" element={<Ads />} />
            <Route path="contact" element={<Contact />} />
            <Route path="favourite" element={<Favourites />} />
          </Route>
        </Routes>
      )}
      {(socketLoading || checkSession || !checked || !isSignedIn) && (
        <Spin
          fullscreen
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#52c41a" }} spin />
          }
        />
      )}
    </>
  );
}

export default App;
