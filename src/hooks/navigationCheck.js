import { useEffect, useState } from "react";
import { useNavigate, useNavigationType } from "react-router-dom";

const useNavigationCheck = () => {
  const navigate = useNavigate();
  const navType = useNavigationType();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (navType === "POP") {
      navigate("/", { replace: true });
    } else {
      setShouldRender(true);
    }
  }, [navType, navigate]);
  return shouldRender;
};

export default useNavigationCheck;
