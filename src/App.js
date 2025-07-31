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
import { Spin } from "antd";
import { Context } from "./context/provider";

import "./App.css";
import CheckRender from "./helpers/checkRender";

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
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
              reconnectTimeout = null;
            }
          };

          socket.onerror = (err) => {
            if (!reconnectTimeout) {
              reconnectTimeout = setTimeout(() => {
                fetchNotifications();
                reconnectTimeout = null;
              }, 300);
            }
          };

          socket.onmessage = async (event) => {
            if (!socket || socket.readyState !== WebSocket.OPEN) return; // guard
            setChatData([]);
            setChatLastEvaluatedKey(null);
            setChatInitialLoad(true);
            setUnreadChatCount(1);
          };

          socket.onclose = () => {
            if (!reconnectTimeout) {
              reconnectTimeout = setTimeout(() => {
                fetchNotifications();
                reconnectTimeout = null;
              }, 300);
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

  if (checked && !isSignedIn) {
    signInWithRedirect();
    return (
      <div
        style={{
          display: "flex",
          height: "100dvh",
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
    <>
      {!socketLoading && !checkSession && checked && isSignedIn && (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={
                <CheckRender>
                  <Home />
                </CheckRender>
              }
            />
            <Route
              path="addProduct"
              element={
                <CheckRender>
                  <AddDress />
                </CheckRender>
              }
            />
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
            <Route
              path="chatPage"
              element={
                <CheckRender>
                  <ChatPage />
                </CheckRender>
              }
            />
            <Route
              path="ads"
              element={
                <CheckRender>
                  <Ads />
                </CheckRender>
              }
            />
            <Route
              path="contact"
              element={
                <CheckRender>
                  <Contact />
                </CheckRender>
              }
            />
            <Route
              path="favourite"
              element={
                <CheckRender>
                  <Favourites />
                </CheckRender>
              }
            />
          </Route>
        </Routes>
      )}
      {(socketLoading || checkSession || !checked || !isSignedIn) && (
        <Spin
          fullscreen
          tip={`socket:${socketLoading} chechSession:${checkSession} checked:${checked} isSign:${isSignedIn}`}
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />
          }
        />
      )}
    </>
  );
}

export default App;
