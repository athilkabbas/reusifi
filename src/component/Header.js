import { Layout } from "antd";
const HeaderWrapper = ({ children }) => {
  const { Header } = Layout;
  return (
    <Header
      style={{
        display: "flex",
        padding: "0px",
        height: "60px",
        zIndex: 1,
        paddingInline: "env(safe-area-inset-left) env(safe-area-inset-right)",
      }}
    >
      {children}
    </Header>
  );
};

export default HeaderWrapper;
