// hooks/sessionCheck.js
import { useState, useEffect } from "react";
import { fetchAuthSession, signInWithRedirect } from "@aws-amplify/auth";

export function useSessionCheck() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await fetchAuthSession();
        const tokens = session.tokens;
        setIsSignedIn(!!tokens?.idToken);
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

  return { isSignedIn, checked };
}
