import { useIndexedDBImages } from "../hooks/indexedDB";
import React, { useContext } from "react";
import { Context } from "../context/provider";

export const useClearForm = () => {
  const { clear } = useIndexedDBImages();

  const { setForm } = useContext(Context);

  const clearForm = async () => {
    setForm({
      title: "",
      description: "",
      category: "",
      subCategory: "",
      email: "",
      images: [],
      price: null,
      location: "",
      locationLabel: "",
    });
    sessionStorage.removeItem("reusifiForm");
    await clear();
  };

  return { clearForm };
};
