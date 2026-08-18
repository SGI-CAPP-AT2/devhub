"use client";

import { StateProvider } from "@/context/StateContext";

/**
 * Client-side wrapper to provide global state context
 * This wraps the app with StateProvider since the root layout is a server component
 */
export function ClientProviders({ children }) {
  return <StateProvider>{children}</StateProvider>;
}
