"use client";

import { Spinner, Box, Text } from "@primer/react";
import styles from "./Loading.module.css";

/**
 * Loading spinner component
 * @param {string} message - Optional loading message
 * @param {string} size - Size of spinner: small, medium (default), large
 * @param {boolean} fullHeight - Whether to take full viewport height
 */
export function Loading({
  message = "Loading...",
  size = "medium",
  fullHeight = false,
}) {
  return (
    <Box
      className={`${styles.loadingContainer} ${fullHeight ? styles.fullHeight : ""}`}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      padding={4}
    >
      <Spinner size={size} />
      {message && (
        <Text as="p" mt={3} color="fg.muted">
          {message}
        </Text>
      )}
    </Box>
  );
}

/**
 * Skeleton loader component for data placeholders
 * @param {number} lines - Number of skeleton lines to show
 * @param {number} width - Width of skeleton (default: 100%)
 */
export function SkeletonLoader({ lines = 3, width = "100%" }) {
  return (
    <Box className={styles.skeletonContainer} style={{ width }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Box
          key={i}
          className={styles.skeletonLine}
          mb={i === lines - 1 ? 0 : 2}
        />
      ))}
    </Box>
  );
}

export default Loading;
