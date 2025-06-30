import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

import "./App.css";

Amplify.configure(awsconfig);

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await fetchAuthSession();
        const tokens = session.tokens;
        if (tokens?.idToken) {
          setIsSignedIn(true);
        } else {
          setIsSignedIn(false);
        }
      } catch {
        setIsSignedIn(false);
      } finally {
        setChecked(true);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (checked && !isSignedIn) {
      signInWithRedirect();
    }
  }, [checked, isSignedIn]);

  if (!isSignedIn) {
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "1.5rem",
      color: "#6366F1",
      fontWeight: "600",
      backgroundColor: "#F5F7FF"
    }}>
      Redirecting to sign in...
    </div>
  );
}

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
