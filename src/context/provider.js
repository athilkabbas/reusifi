import React, { createContext, useState } from "react";

export const Context = createContext();

const Provider = ({ children }) => {
  const [data, setData] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [count, setCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [adHasMore, setAdHasMore] = useState(false);
  const [favHasMore, setFavHasMore] = useState(false);
  const [chatHasMore, setChatHasMore] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [location, setLocation] = useState({ state: "", district: "" });
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
  const [detailData, setDetailData] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  return (
    <Context.Provider
      value={{
        currentPage,
        setCurrentPage,
        count,
        setCount,
        unreadChatCount,
        setUnreadChatCount,
        detailData,
        setDetailData,
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
