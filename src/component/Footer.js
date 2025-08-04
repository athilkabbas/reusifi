import { Layout } from "antd";

const FooterWrapper = ({ children }) => {
  const { Footer } = Layout;
  return (
    <Footer
      style={{
        position: "fixed",
        bottom: 0,
        zIndex: 1,
        width: "100dvw",
        height: "60px",
        padding: "0px",
        paddingInline: "env(safe-area-inset-left) env(safe-area-inset-right)",
        boxSizing: "border-box",
      }}
    >
      {children}
    </Footer>
  );
};

export default FooterWrapper;
