// hooks/sessionCheck.js
import { useState, useEffect, useContext } from "react";
import { fetchAuthSession, signInWithRedirect } from "@aws-amplify/auth";
import { Context } from "../context/provider";

export function useSessionCheck() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checked, setChecked] = useState(false);
  const { setToken } = useContext(Context);

  const errorSessionConfig = {
    title: "Session has expired.",
    content: "Please login again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: async () => {
      await signInWithRedirect();
    },
  };
  const errorConfig = {
    title: "An error has occurred.",
    content: "Please login again",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: async () => {
      await signInWithRedirect();
    },
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await fetchAuthSession();
        const tokens = session.tokens;
        if (tokens?.idToken) {
          setIsSignedIn(true);
          setToken(tokens.idToken);
        } else {
          setIsSignedIn(false);
        }
      } catch (err) {
        setIsSignedIn(false);
      } finally {
        setChecked(true);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    const completeCheck = async () => {
      if (checked && !isSignedIn) {
        await signInWithRedirect();
      }
    };
    completeCheck();
  }, [checked, isSignedIn]);

  return { isSignedIn, checked };
}
