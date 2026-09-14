import { useCallback, useEffect, useState } from "react";
import { api } from "./api-client";

export function useApiData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get<T>(url)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    // Standard fetch-on-mount-or-url-change pattern; the setState calls are
    // the load-start/loading-end of an async request, not a synchronous
    // props->state mirror, so this is intentional despite the lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
