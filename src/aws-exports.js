const awsmobile = {
  aws_project_region: "ap-south-1",
  aws_cognito_region: "ap-south-1",
  aws_user_pools_id: "ap-south-1_R9wR17tT5",
  aws_user_pools_web_client_id: "7jeltl9uu4apdfugbmo1cub7ti",
  oauth: {
    domain: "auth.reusifi.com",
    scope: ["openid", "email", "profile"],
    redirectSignIn:
      "https://www.reusifi.com/,https://reusifi.com/,http://localhost:3000/",
    redirectSignOut:
      "https://www.reusifi.com/,https://reusifi.com/,http://localhost:3000/",
    responseType: "code",
  },
};

export default awsmobile;
