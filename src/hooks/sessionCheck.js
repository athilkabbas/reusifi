// hooks/sessionCheck.js
import { useState, useEffect } from "react";
import { fetchAuthSession, signInWithRedirect } from "@aws-amplify/auth";
import { Modal } from "antd";

export function useSessionCheck() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  const errorSessionConfig = {
    title: 'Session has expired.',
    content: 'Please login again.',
    closable: false,
    maskClosable: false,
    okText: 'Login',
    onOk: async () => {
      await signInWithRedirect()
    }
  }
  const errorConfig = {
    title: 'An error has occurred.',
    content: 'Please login again',
    closable: false,
    maskClosable: false,
    okText: 'Login',
    onOk: async () => {
      await signInWithRedirect()
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await fetchAuthSession();
        const tokens = session.tokens;
        if(tokens?.idToken){
          setIsSignedIn(true);
          setChecked(true);
        }
        else{
           const error = new Error('Session Expired')
           error.status = 401
           throw error
        }
      } catch(err) {
          if (err?.name === "NotAuthorizedException" && err?.message?.includes("Refresh Token has expired")) {
            Modal.error(errorSessionConfig)
          } 
          else if(err?.status === 401){
            Modal.error(errorSessionConfig)
          }
          else {
            Modal.error(errorConfig)
          }
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
