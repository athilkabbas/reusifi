import React, { createContext, useEffect, useState } from "react";
import { useIndexedDBImages } from "../hooks/indexedDB";

export const Context = createContext();

const Provider = ({ children }) => {
  const { saveImage, loadImage, saveForm, loadForm } = useIndexedDBImages();
  const [currentLocation, setCurrentLocation] = useState("");
  const [currentLocationLabel, setCurrentLocationLabel] = useState("");
  const [triggerLocation, setTriggerLocation] = useState(false);
  const [data, setData] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [count, setCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [adHasMore, setAdHasMore] = useState(false);
  const [favHasMore, setFavHasMore] = useState(false);
  const [chatHasMore, setChatHasMore] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");
  const [filterList, setFilterList] = useState([]);
  const [adLastEvaluatedKey, setAdLastEvaluatedKey] = useState(null);
  const [favLastEvaluatedKey, setFavLastEvaluatedKey] = useState(null);
  const [chatLastEvaluatedKey, setChatLastEvaluatedKey] = useState(null);
  const [favScrollPosition, setFavScrollPosition] = useState(0);
  const [favInitialLoad, setFavInitialLoad] = useState(true);
  const [addProductInitialLoad, setAddProductInitialLoad] = useState(true);
  const [favData, setFavData] = useState([]);
  const [adScrollPosition, setAdScrollPosition] = useState(0);
  const [adInitialLoad, setAdInitialLoad] = useState(true);
  const [chatScrollPosition, setChatScrollPosition] = useState(0);
  const [chatInitialLoad, setChatInitialLoad] = useState(true);
  const [adData, setAdData] = useState([]);
  const [chatData, setChatData] = useState([]);
  const [homeInitialLoad, setHomeInitialLoad] = useState(true);
  const [favPageInitialLoad, setFavPageInitialLoad] = useState(true);
  const [adPageInitialLoad, setAdPageInitialLoad] = useState(true);
  const [chatPageInitialLoad, setChatPageInitialLoad] = useState(true);
  const [priceFilter, setPriceFilter] = useState("");
  const [detailInitialLoad, setDetailInitialLoad] = useState(true);
  const [contactInitialLoad, setContactInitialLoad] = useState(true);
  const [iChatInitialLoad, setIChatInitialLoad] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState(null);
  const [locationAccessLoading, setLocationAccessLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState(false);
  const [applied, setApplied] = useState(false);
  const [currLocRemoved, setCurrLocRemoved] = useState(true);
  const [sellingChatLastEvaluatedKey, setSellingChatLastEvaluatedKey] =
    useState(null);
  const [buyingChatLastEvaluatedKey, setBuyingChatLastEvaluatedKey] =
    useState(null);
  const [sellingChatInitalLoad, setSellingChatInitialLoad] = useState(true);
  const [buyingChatInitalLoad, setBuyingChatInitialLoad] = useState(true);
  const [sellingChatScrollPosition, setSellingChatScrollPosition] = useState(0);
  const [buyingChatScrollPosition, setBuyingChatScrollPosition] = useState(0);
  const [sellingChatData, setSellingChatData] = useState([]);
  const [buyingChatData, setBuyingChatData] = useState([]);
  const [sellingChatHasMore, setSellingChatHasMore] = useState(false);
  const [buyingChatHasMore, setBuyingChatHasMore] = useState(false);
  const [actionType, setActionType] = useState("Selling");
  const [mapLoading, setMapLoading] = useState(false);
  const [accountInitialLoad, setAccountInitialLoad] = useState(true);
  const [queryInitialLoad, setQueryInitialLoad] = useState(true);
  const [boostInitialLoad, setBoostInitialLoad] = useState(true);
  const [account, setAccount] = useState({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    keywords: [],
    email: "",
    images: [],
    price: null,
    location: "",
    locationLabel: "",
  });

  const [boostForm, setBoostForm] = useState({
    uuid: "",
  });

  useEffect(() => {
    const loadFormIndexedDB = async () => {
      const storedForm = await loadForm("reusifiForm");
      const images = await loadImage("imageReusifiForm");
      setForm({ ...form, ...storedForm, images });
    };
    loadFormIndexedDB();
  }, []);

  useEffect(() => {
    const loadBoostForm = async () => {
      const storedBoostForm = await loadForm("reusifiBoostForm");
      setBoostForm({ ...boostForm, ...storedBoostForm });
    };
    loadBoostForm();
  }, []);

  useEffect(() => {
    const saveFormIndexedDB = async () => {
      const { images, ...formWithoutImages } = form;
      await saveForm(formWithoutImages, "reusifiForm");
      await saveImage(images, "imageReusifiForm");
    };
    saveFormIndexedDB();
  }, [form]);

  useEffect(() => {
    const saveBoostForm = async () => {
      await saveForm(boostForm, "reusifiBoostForm");
    };
    saveBoostForm();
  }, [boostForm]);

  return (
    <Context.Provider
      value={{
        boostForm,
        setBoostForm,
        form,
        setForm,
        account,
        setAccount,
        boostInitialLoad,
        setBoostInitialLoad,
        queryInitialLoad,
        setQueryInitialLoad,
        accountInitialLoad,
        setAccountInitialLoad,
        mapLoading,
        setMapLoading,
        actionType,
        setActionType,
        sellingChatLastEvaluatedKey,
        setSellingChatLastEvaluatedKey,
        buyingChatLastEvaluatedKey,
        setBuyingChatLastEvaluatedKey,
        sellingChatInitalLoad,
        setSellingChatInitialLoad,
        buyingChatInitalLoad,
        setBuyingChatInitialLoad,
        sellingChatScrollPosition,
        setSellingChatScrollPosition,
        buyingChatScrollPosition,
        setBuyingChatScrollPosition,
        sellingChatData,
        setSellingChatData,
        buyingChatData,
        setBuyingChatData,
        sellingChatHasMore,
        setSellingChatHasMore,
        buyingChatHasMore,
        setBuyingChatHasMore,
        currLocRemoved,
        setCurrLocRemoved,
        applied,
        setApplied,
        category,
        setCategory,
        subCategory,
        setSubCategory,
        locationLabel,
        setLocationLabel,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        locationAccessLoading,
        setLocationAccessLoading,
        currentLocationLabel,
        setCurrentLocationLabel,
        triggerLocation,
        setTriggerLocation,
        currentLocation,
        setCurrentLocation,
        email,
        setEmail,
        user,
        setUser,
        currentPage,
        setCurrentPage,
        count,
        setCount,
        unreadChatCount,
        setUnreadChatCount,
        contactInitialLoad,
        setContactInitialLoad,
        iChatInitialLoad,
        setIChatInitialLoad,
        addProductInitialLoad,
        setAddProductInitialLoad,
        detailInitialLoad,
        setDetailInitialLoad,
        data,
        setData,
        initialLoad,
        setInitialLoad,
        scrollPosition,
        setScrollPosition,
        location,
        setLocation,
        priceFilter,
        setPriceFilter,
        search,
        setSearch,
        hasMore,
        setHasMore,
        filterList,
        setFilterList,
        favScrollPosition,
        setFavScrollPosition,
        favInitialLoad,
        setFavInitialLoad,
        favData,
        setFavData,
        adScrollPosition,
        setAdScrollPosition,
        adInitialLoad,
        setAdInitialLoad,
        chatScrollPosition,
        setChatScrollPosition,
        chatInitialLoad,
        setChatInitialLoad,
        adData,
        setAdData,
        chatData,
        setChatData,
        homeInitialLoad,
        setHomeInitialLoad,
        setFavPageInitialLoad,
        favPageInitialLoad,
        setAdPageInitialLoad,
        adPageInitialLoad,
        chatPageInitialLoad,
        setChatPageInitialLoad,
        adHasMore,
        setAdHasMore,
        setFavHasMore,
        favHasMore,
        chatHasMore,
        setChatHasMore,
        adLastEvaluatedKey,
        favLastEvaluatedKey,
        chatLastEvaluatedKey,
        setAdLastEvaluatedKey,
        setFavLastEvaluatedKey,
        setChatLastEvaluatedKey,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default Provider;
