const awsmobile = {
  aws_project_region: "ap-south-1",
  aws_cognito_region: "ap-south-1",
  aws_user_pools_id: "ap-south-1_8TOOXlT5Y",
  aws_user_pools_web_client_id: "q57qj9r5ehaoli43r10jic2rp",
  oauth: {
    domain: "auth.reusifi.com",
    scope: ["openid", "email", "phone"],
    redirectSignIn:
      "https://www.reusifi.com/,https://reusifi.com/,http://localhost:3000/",
    redirectSignOut:
      "https://www.reusifi.com/,https://reusifi.com/,http://localhost:3000/",
    responseType: "code",
  },
};

export default awsmobile;
