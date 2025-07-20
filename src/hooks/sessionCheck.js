// hooks/sessionCheck.js
import { useState, useEffect } from "react";
import { fetchAuthSession, signInWithRedirect } from "@aws-amplify/auth";
import axios from "axios";

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
          await axios.get(`https://dwo94t377z7ed.cloudfront.net/prod/setSession`,
          { headers: { Authorization: tokens.idToken },withCredentials: true });
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
    if (checked && !isSignedIn) {
      signInWithRedirect();
    }
  }, [checked, isSignedIn]);

  return { isSignedIn, checked };
}
