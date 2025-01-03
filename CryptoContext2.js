import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { CoinList } from "./config/api";
import { auth, db } from "./firebase";

const Crypto = createContext();

const CryptoContext = ({ children }) => {
  const [currency, setCurrency] = useState("INR");
  const [coins, setCoins] = useState([]);
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const symbol = useMemo(() => {
    const symbols = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      AUD: "AU$",
    };
    return symbols[currency] || "₹";
  }, [currency]);

  // Fetch coins based on currency
  const fetchCoins = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(CoinList(currency));
      setCoins(data);
    } catch (error) {
      console.error("Error fetching coins:", error);
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // Fetch coins whenever currency changes
  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  // Handle user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser || null);
    });
    return unsubscribe;
  }, []);

  // Fetch watchlist for authenticated users
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      return;
    }

    const coinRef = doc(db, "watchlist", user.uid);
    const unsubscribe = onSnapshot(coinRef, (snapshot) => {
      if (snapshot.exists()) {
        setWatchlist(snapshot.data().coins);
      } else {
        setWatchlist([]);
        console.log("No items in Watchlist");
      }
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Crypto.Provider
      value={{
        currency,
        symbol,
        setCurrency,
        alert,
        setAlert,
        user,
        coins,
        loading,
        watchlist,
      }}
    >
      {children}
    </Crypto.Provider>
  );
};

export default CryptoContext;

export const CryptoState = () => useContext(Crypto);
