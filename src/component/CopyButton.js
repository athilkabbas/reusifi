import { message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

const CopyButton = ({ text }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("Copied to clipboard!");
    } catch (err) {
      message.error("Failed to copy");
    }
  };

  return <CopyOutlined onClick={handleCopy} />;
};

export default CopyButton;
