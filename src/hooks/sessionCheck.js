// hooks/sessionCheck.js
import { useState, useEffect, useContext } from "react";
import { fetchAuthSession, signInWithRedirect, signOut } from "@aws-amplify/auth";
import axios from "axios";
import { Context } from "../context/provider";

export function useSessionCheck() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false)
  const { setToken } = useContext(Context)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await fetchAuthSession();
        const tokens = session.tokens;
        if(tokens?.idToken){
          await axios.get(`https://api.reusifi.com/prod/setSession`,
          { headers: { Authorization: tokens.idToken },withCredentials: true });
          setIsSignedIn(true);
          setToken(tokens?.idToken)
        }
        else{
           setIsSignedIn(false);
        }
      } catch {
        setSessionExpired(true)
        setIsSignedIn(false);
      } finally {
        setChecked(true);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    const completeCheck = async () => {
      if (checked && !isSignedIn && !sessionExpired) {
        await signInWithRedirect();
      }
      else if(checked && !isSignedIn && sessionExpired){
        await signOut()
      }
    }
  completeCheck()
  }, [checked, isSignedIn, sessionExpired]);

  return { isSignedIn, checked };
}
