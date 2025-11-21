import React, { useState, useEffect, useContext, useRef } from "react";
import { Navigate } from "react-router-dom";
import { callApi } from "../helpers/api";
import { Button, Result, Modal, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { Context } from "../context/provider";
import { signInWithRedirect } from "@aws-amplify/auth";
import axios from "axios";
import { useClearForm } from "../hooks/clearForm";
import { LoadingOutlined } from "@ant-design/icons";

const Return = () => {
  const { clearForm } = useClearForm();
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);

  const isModalVisibleRef = useRef(false);
  const errorSessionConfig = {
    title: "Session has expired.",
    content:
      "Your payment has been refunded because the ad submission didn’t go through. Please try again.",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: async () => {
      isModalVisibleRef.current = false;
      await clearForm();
      signInWithRedirect();
    },
  };
  const errorSessionConfigRefundFailure = {
    title: "Session has expired.",
    content: "Please raise a query",
    closable: false,
    maskClosable: false,
    okText: "Login",
    onOk: async () => {
      isModalVisibleRef.current = false;
      await clearForm();
      signInWithRedirect();
    },
  };
  const errorConfig = {
    title: "An error has occurred.",
    content:
      "Your payment has been refunded because the ad submission didn’t go through. Please try again.",
    closable: false,
    maskClosable: false,
    okText: "OK",
    onOk: () => {
      isModalVisibleRef.current = false;
      navigate("/addProduct");
    },
  };

  const errorConfigRefundFailure = {
    title: "An error has occurred.",
    content: "Please raise a query",
    closable: false,
    maskClosable: false,
    okText: "OK",
    onOk: () => {
      isModalVisibleRef.current = false;
      navigate("/");
    },
  };

  const {
    setCount,
    setAdInitialLoad,
    setAdData,
    setAdLastEvaluatedKey,
    user,
    setCurrentLocationLabel,
    setCurrentLocation,
    setCurrLocRemoved,
    form,
    setForm,
    setFileList,
  } = useContext(Context);

  const [submit, setSubmit] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    if (status === "complete") {
      handleSubmit();
    }
  }, [status]);

  const handleSubmit = async () => {
    setSubmitLoading(true);

    const thumbnailOptions = {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 500,
      useWebWorker: true,
      initialQuality: 0.7,
      fileType: "image/jpeg",
    };

    const viewingOptions = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: "image/jpeg",
    };

    try {
      // Compress thumbnails and viewings in parallel
      const compressedThumbnails = [
        await imageCompression(form.images[0].originFileObj, thumbnailOptions),
      ];
      const compressedViewings = await Promise.all(
        form.images.map((image) =>
          imageCompression(image.originFileObj, viewingOptions)
        )
      );

      const allCompressed = [...compressedThumbnails, ...compressedViewings];
      const urlRes = await callApi(
        `https://api.reusifi.com/prod/getUrlNew?email=${encodeURIComponent(
          user.userId
        )}&contentType=${encodeURIComponent("image/jpeg")}&count=${
          allCompressed.length
        }`,
        "GET"
      );
      const uploadURLs = urlRes.data.uploadURLs;
      const s3Keys = urlRes.data.s3Keys;

      await Promise.all(
        allCompressed.map((img, idx) =>
          axios.put(uploadURLs[idx], img, {
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "public, max-age=2592000",
            },
          })
        )
      );

      const thumbnailS3Keys = [s3Keys[0]];
      const viewingS3Keys = s3Keys.slice(1);

      // Prepare form data with separate keys for thumbnails and viewings
      const data = {
        title: form.title.trim().toLowerCase(),
        description: form.description.trim().toLowerCase(),
        email: user.userId.toLowerCase(),
        location: form.location.split(",").map(parseFloat),
        locationLabel: form.locationLabel,
        price: parseFloat(form.price).toFixed(2),
        category: form.category.toLowerCase(),
        subCategory: form.subCategory.toLowerCase(),
        thumbnailS3Keys,
        viewingS3Keys,
        sessionId,
      };
      await callApi(
        "https://api.reusifi.com/prod/addProduct",
        "POST",
        false,
        data
      );
      setCount((prevValue) => prevValue + 1);
      setAdData([]);
      setAdLastEvaluatedKey(null);
      setAdInitialLoad(true);
      setFileList([]);
      setCurrLocRemoved(true);
      setCurrentLocationLabel("");
      setCurrentLocation("");
      setSubmit(true);
      await clearForm();
      setSubmitLoading(false);
      // message.success(
      //   "Your ad is now live on Reusifi. It may take up to 5 minutes to appear."
      // );
      // navigate("/ads");
    } catch (err) {
      setSubmitLoading(false);
      try {
        await callApi("https://api.reusifi.com/prod/refund", "POST", false, {
          session_id: sessionId,
        });
        if (isModalVisibleRef.current) {
          return;
        }
        isModalVisibleRef.current = true;
        if (err?.status === 401) {
          Modal.error(errorSessionConfig);
        } else {
          Modal.error(errorConfig);
        }
      } catch (err) {
        if (isModalVisibleRef.current) {
          return;
        }
        isModalVisibleRef.current = true;
        if (err?.status === 401) {
          Modal.error(errorSessionConfigRefundFailure);
        } else {
          Modal.error(errorConfigRefundFailure);
        }
      }
      return;
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const sessionId = urlParams.get("session_id");
      const result = await callApi(
        `https://api.reusifi.com/prod/checkoutSessionStatus?session_id=${sessionId}`,
        "GET"
      );
      setSessionId(sessionId);
      setStatus(result.data.status);
      setCustomerEmail(result.data.customer_email);
    };
    fetchStatus();
  }, []);

  if (status === "open") {
    return <Navigate to="/checkout" />;
  }

  if (status === "complete" && submit) {
    return (
      <Result
        status="success"
        title="Successfully posted an Ad"
        subTitle="Your ad is now live on Reusifi. It may take up to 5 minutes to appear."
        extra={[
          <Button
            style={{
              background: "#52c41a",
              fontSize: "13px",
              fontWeight: "300",
            }}
            onClick={() => {
              navigate("/");
            }}
            type="primary"
            key="console"
          >
            Go Home
          </Button>,
        ]}
      />
    );
  }
  return (
    <Spin
      fullscreen
      indicator={
        <LoadingOutlined style={{ fontSize: 48, color: "#52c41a" }} spin />
      }
    />
  );
};

export default Return;
