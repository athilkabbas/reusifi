import { Layout } from "antd";

const FooterWrapper = ({ children }) => {
  const { Footer } = Layout;
  return (
    <Footer
      style={{
        position: "fixed",
        bottom: 0,
        zIndex: 1000,
        width: "100dvw",
        height: "60px",
        padding: "0px",
      }}
    >
      {children}
    </Footer>
  );
};

export default FooterWrapper;
