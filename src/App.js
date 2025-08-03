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
  const {
    setUnreadChatCount,
    setChatInitialLoad,
    setChatData,
    setChatLastEvaluatedKey,
  } = useContext(Context);
  const [socketLoading, setSocketLoading] = useState(false);
  useEffect(() => {
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        window.location.reload();
      }
    });
  }, []);
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
              }, 1000);
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
              }, 1000);
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
    return <ReusifiLanding />;
    // signInWithRedirect();
    // return (
    //   <div
    //     style={{
    //       display: "flex",
    //       height: "100dvh",
    //       justifyContent: "center",
    //       alignItems: "center",
    //       fontSize: "1.5rem",
    //       color: "#52c41a",
    //       fontWeight: "600",
    //       backgroundColor: "#F5F7FF",
    //     }}
    //   >
    //     Redirecting to sign in...
    //   </div>
    // );
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
