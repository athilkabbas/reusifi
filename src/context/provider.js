import React, { createContext, useState } from "react";

export const Context = createContext();

const Provider = ({ children }) => {
  const [data, setData] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [location, setLocation] = useState({ state: null, district: null });
  const [search, setSearch] = useState(null);
  const [filterList, setFilterList] = useState([]);
  const [lastEvaluatedKeys, setLastEvaluatedKeys] = useState({
    cLEK: null,
    tLEK: null,
    tS1LEK: null,
    tS2LEK: null,
    tS3LEK: null,
  });
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [favScrollPosition, setFavScrollPosition] = useState(0);
  const [favInitialLoad, setFavInitialLoad] = useState(true);
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
  return (
    <Context.Provider
      value={{
        data,
        setData,
        initialLoad,
        setInitialLoad,
        scrollPosition,
        setScrollPosition,
        location,
        setLocation,
        search,
        setSearch,
        lastEvaluatedKey,
        setLastEvaluatedKey,
        lastEvaluatedKeys,
        setLastEvaluatedKeys,
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
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default Provider;
