import React, { createContext, useState } from "react";

export const Context = createContext();

const Provider = ({ children }) => {
  const [data, setData] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [location, setLocation] = useState({ state: null, district: null });
  const [search, setSearch] = useState(null);
  const [lastEvaluatedKeys, setLastEvaluatedKeys] = useState({
    cLEK: null,
    tLEK: null,
    tS1LEK: null,
    tS2LEK: null,
    tS3LEK: null,
  });
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);

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
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default Provider;
