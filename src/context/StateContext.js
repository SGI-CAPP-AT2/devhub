"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

const StateContext = createContext();

/**
 * Provider component for managing global loading and error states
 */
export function StateProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  const setErrorState = useCallback((errorMsg) => {
    setError(errorMsg);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    loading,
    error,
    startLoading,
    stopLoading,
    setErrorState,
    clearError,
  };

  return (
    <StateContext.Provider value={value}>{children}</StateContext.Provider>
  );
}

/**
 * Hook to use global state
 */
export function useAppState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error("useAppState must be used within StateProvider");
  }
  return context;
}
