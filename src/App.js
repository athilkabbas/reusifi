import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  LoadingOutlined
} from "@ant-design/icons";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";
import {
  signInWithRedirect,
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
import { Spin  } from "antd";

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

function AppWithSession() {
  const { isSignedIn, checked } = useSessionCheck();

  if (!checked) {
    return (
      <Spin
        fullscreen
        indicator={<LoadingOutlined style={{ fontSize: 48, color: "#6366F1" }} spin />}
      />
    );
  }

  if (!isSignedIn) {
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