import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
const Context = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setUser((await api.get("/auth/me")).data);
    } catch (e) {
      setUser(null);
      if (e.response?.status !== 401)
        setError("Unable to reach FreelanceFlow. Start the API, then retry.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
    const expire = () => setUser(null);
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  const signIn = async (mode, input) => {
    const { data } = await api.post(`/auth/${mode}`, input);
    setUser(data);
  };
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };
  const money = (value) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: user?.preferredCurrency || "USD",
      maximumFractionDigits: 2,
    }).format(value || 0);
  return (
    <Context.Provider
      value={{ user, setUser, loading, error, refresh, signIn, logout, money }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
