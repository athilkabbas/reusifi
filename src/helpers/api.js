import { fetchAuthSession } from "aws-amplify/auth";
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
      const error =  new Error('Session expired')
      error.status = 401
      throw error
    }
    }catch(err){
      if (err?.name === "NotAuthorizedException" && err?.message?.includes("Refresh Token has expired")) {
        const error =  new Error('Session expired')
        error.status = 401
        throw error
      } 
      else if(err?.status === 401){
        throw err
      }
      else {
          const error =  new Error('An error occurred')
          error.status = 500
          throw error
      }
    }

  }
     const config = {
      withCredentials: true,
       ...(method === "POST" && {
          headers: { "Content-Type": "application/json" },
      }),
    };

    if (method === "GET") {
      return await axios.get(url, config);
    } else if (method === "POST") {
      return await axios.post(url, data, config);
    }
};
