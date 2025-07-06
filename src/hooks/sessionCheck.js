// hooks/sessionCheck.js
import { useState, useEffect } from "react";
import { fetchAuthSession, signInWithRedirect } from "@aws-amplify/auth";

export function useSessionCheck() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [token, setToken] = useState(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await fetchAuthSession();
        const tokens = session.tokens;
        setIsSignedIn(!!tokens?.idToken);
        setToken(tokens?.accessToken)
      } catch {
        setIsSignedIn(false);
        setToken(null)
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

  return { isSignedIn, checked, token };
}
