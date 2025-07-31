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
    const isUnauthorized =
      err?.response?.status === 403 || err?.response?.status === 401;

    if (!skipRefresh && isUnauthorized) {
      let tokens;
      let token;
      try {
        const session = await fetchAuthSession();
        tokens = session.tokens;
        if (tokens?.idToken) {
          token = tokens.idToken;
        } else {
          throw new Error();
        }
      } catch (err) {
        err.status = 401;
        throw err;
      }
      try {
        await axios.get("https://api.reusifi.com/prod/setSession", {
          headers: { Authorization: token.toString() },
          withCredentials: true,
        });

        return callApi(url, method, false, data);
      } catch (err) {
        throw err;
      }
    }

    throw err;
  }
};
