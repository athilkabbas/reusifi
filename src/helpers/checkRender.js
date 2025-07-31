import useNavigationCheck from "../hooks/navigationCheck";
const CheckRender = ({ children }) => {
  const shouldRender = useNavigationCheck();
  if (!shouldRender) {
    return null;
  }
  return children;
};

export default CheckRender;
