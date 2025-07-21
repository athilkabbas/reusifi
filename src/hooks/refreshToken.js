// hooks/useTokenRefresh.js
import { useContext, useEffect, useRef, useState } from "react";
import { fetchAuthSession, signOut } from "@aws-amplify/auth";
import axios from "axios";
import { Context } from "../context/provider";

export function useTokenRefresh(intervalMs = 60000) {
  const lastActivityRef = useRef(Date.now());
    const { setToken } = useContext(Context)

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("touchstart", updateActivity);

    const interval = setInterval(async () => {
      const now = Date.now();
      const minutesSinceActivity = (now - lastActivityRef.current) / 60000;
      if (minutesSinceActivity < 60) {
        try {
          const session = await fetchAuthSession();
          await axios.get(`https://api.reusifi.com/prod/setSession`,
          { headers: { Authorization: session.tokens?.idToken },withCredentials: true });
          setToken(session.tokens?.idToken);
        } catch (err) {
          await signOut()
          console.error("Token refresh error:", err);
        }
      }
      else{
        console.log("User inactive, logging out");
        await signOut();
        return;
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
    };
  }, [intervalMs]);
}
