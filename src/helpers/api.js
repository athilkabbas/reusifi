import { fetchAuthSession, signOut } from "aws-amplify/auth";
import axios from "axios";

export const callApi = async (url, method,skipRefresh = false,data) => {
  if(!skipRefresh){
      try {
    const session = await fetchAuthSession();
    const tokens = session.tokens;

    if (tokens?.idToken) {
      await axios.get(
        `https://api.reusifi.com/prod/setSession`,
        {
          headers: { Authorization: tokens.idToken.toString() },
          withCredentials: true,
        }
      );
    } else {
      await signOut()
    }
    }catch(err){
        await signOut()
    }

  }
    const config = {
      withCredentials: true,
    };

    if (method === "GET") {
      return await axios.get(url, config);
    } else if (method === "POST") {
      return await axios.post(url, data, config);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
};
