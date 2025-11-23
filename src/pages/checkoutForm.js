import React, { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { callApi } from "../helpers/api";
import { useLocation, useNavigate } from "react-router-dom";

const TEST_STRIPE_KEY =
  "pk_test_51SU7igCRFnrudVzCXa7taHa6By0kzfuOwNFIVDLxJoo6qpn5YfAPRCVivrVQa7WqXYCirQdfygBVihqpfDs3IcmC00d5srxpgo";
const LIVE_STRIPE_KEY =
  "pk_live_51SU7iXCGYi9Bz1k4QVlwGOyXrUM0QteOBjk8zYTpVEh94BIo1XGcriyAL3BCdHLmbdkP2ytZ3eGee5tHx6GWMTqj003WtmPVbH";

const CheckoutForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adType } = location.state || "";
  if (!adType) {
    navigate("/");
  }
  const fetchClientSecret = useCallback(async () => {
    // Create a Checkout Session

    const result = await callApi(
      "https://api.reusifi.com/prod/checkoutSession",
      "POST",
      false,
      {
        adType,
      }
    );
    return result.data.clientSecret;
  }, []);

  const options = { fetchClientSecret };

  let stripePromise;
  if (window.location.origin === "https://localhost:3000") {
    stripePromise = loadStripe(TEST_STRIPE_KEY);
    console.log("athile");
  } else {
    console.log("aaa");
    stripePromise = loadStripe(LIVE_STRIPE_KEY);
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default CheckoutForm;
