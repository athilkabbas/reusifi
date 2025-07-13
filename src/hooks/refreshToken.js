// hooks/useTokenRefresh.js
import { useEffect, useRef, useState } from "react";
import { fetchAuthSession, signOut } from "@aws-amplify/auth";

export function useTokenRefresh(intervalMs = 60000) {
  const lastActivityRef = useRef(Date.now());
  const [accessToken, setAccessToken] = useState(null);

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
      if (minutesSinceActivity < 15) {
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.accessToken?.toString() || null;
          setAccessToken(token);
        } catch (err) {
          console.error("Token refresh error:", err);
        }
      }
      else{
        console.log("User inactive, logging out");
        await signOut();
        return;
      }
    }, intervalMs);

    // initial fetch
    fetchAuthSession()
      .then((session) =>
        setAccessToken(session.tokens?.accessToken?.toString() || null)
      )
      .catch(() => setAccessToken(null));

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
    };
  }, [intervalMs]);

  return accessToken;
}
