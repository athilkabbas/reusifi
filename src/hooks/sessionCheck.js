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
        if(tokens?.idToken){
          setIsSignedIn(true);
        }
        else{
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
    const completeCheck = async () => {
      if (checked && !isSignedIn) {
        await signInWithRedirect();
      }
    }
  completeCheck()
  }, [checked, isSignedIn]);

  return { isSignedIn, checked };
}
