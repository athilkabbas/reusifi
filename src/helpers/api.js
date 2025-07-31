import { fetchAuthSession } from "aws-amplify/auth";
import axios from "axios";

export const callApi = async (url, method, skipRefresh = false, data) => {
  try {
    const config = {
      withCredentials: true,
      ...(method === "POST" && {
        headers: { "Content-Type": "application/json" },
      }),
    };

    let result;
    if (method === "GET") {
      result = await axios.get(url, config);
    } else if (method === "POST") {
      result = await axios.post(url, data, config);
    }

    return result;
  } catch (err) {
    const isForbidden = err?.response?.status === 403;

    if (!skipRefresh && isForbidden) {
      try {
        const session = await fetchAuthSession();
        const tokens = session.tokens;

        await axios.get("https://api.reusifi.com/prod/setSession", {
          headers: { Authorization: tokens.idToken.toString() },
          withCredentials: true,
        });

        return callApi(url, method, false, data);
      } catch (refreshErr) {
        const isRefreshExpired =
          refreshErr?.name === "NotAuthorizedException" &&
          refreshErr?.message?.includes("Refresh Token has expired");
        const isUnauthorized = refreshErr?.response?.status === 401;
        if (isRefreshExpired || isUnauthorized) {
          refreshErr.status = 401;
        }
        throw refreshErr;
      }
    }

    throw err;
  }
};
