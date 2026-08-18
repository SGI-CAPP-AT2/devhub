"use client";

import React from "react";
import { Box, Text, Button, Alert } from "@primer/react";
import { AlertIcon } from "@primer/octicons-react";
import styles from "./Error.module.css";

export function ErrorMessage({
  message = "An error occurred",
  title = "Error",
  onRetry = null,
  variant = "danger",
}) {
  return (
    <Alert variant={variant} icon={AlertIcon} className={styles.errorAlert}>
      <Box>
        <Text as="div" fontWeight="bold" mb={1}>
          {title}
        </Text>
        <Text as="div" color="fg.default" mb={onRetry ? 2 : 0}>
          {message}
        </Text>
        {onRetry && (
          <Box mt={2}>
            <Button onClick={onRetry} size="small" variant="primary">
              Try Again
            </Button>
          </Box>
        )}
      </Box>
    </Alert>
  );
}

export function ErrorFallback({ message = "Something went wrong", onReset }) {
  return (
    <Box
      className={styles.errorContainer}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      padding={4}
    >
      <AlertIcon size={48} className={styles.errorIcon} />
      <Text as="h1" fontSize={4} fontWeight="bold" mt={3} mb={2}>
        Oops! Something went wrong
      </Text>
      <Text as="p" color="fg.muted" mb={4} textAlign="center" maxWidth="500px">
        {message}
      </Text>
      {onReset && (
        <Button onClick={onReset} variant="primary">
          Try Again
        </Button>
      )}
    </Box>
  );
}

/**
 * Error Boundary component for catching React errors
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          message={this.state.error?.message || "An unexpected error occurred"}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorMessage;
