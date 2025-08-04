import { Layout } from "antd";

const FooterWrapper = ({ children }) => {
  const { Footer } = Layout;
  return (
    <Footer
      style={{
        position: "fixed",
        bottom: 0,
        zIndex: 1,
        width: "100vw",
        height: "60px",
        padding: "0px",
      }}
    >
      {children}
    </Footer>
  );
};

export default FooterWrapper;
