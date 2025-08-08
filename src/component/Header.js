import { Layout } from "antd";
const HeaderWrapper = ({ children }) => {
  const { Header } = Layout;
  return (
    <Header
      style={{
        padding: "0px",
        height: "60px",
        zIndex: 1,
        width: "100dvw",
      }}
    >
      {children}
    </Header>
  );
};

export default HeaderWrapper;
