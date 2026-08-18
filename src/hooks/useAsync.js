import { useState, useEffect, useCallback } from "react";

export function useAsync(asyncFunction, immediate = true, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err.message || "An error occurred",
      });
      console.error("Async operation failed:", err);
      throw err;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return { ...state, execute };
}
