import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { errorMessage } from "../lib/utils";
export function useData(url) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData((await api.get(url)).data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, loading, error, reload };
}
