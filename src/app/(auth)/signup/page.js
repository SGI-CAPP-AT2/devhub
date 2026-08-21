"use client";

import { Text, Link } from "@primer/react";
import { SignupForm } from "@/components/auth/SignupForm";
import styles from "./page.module.css";

export default function SignupPage() {
  return (
    <div className={styles.signupPage}>
      <div className={styles.signupContainer}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Join DevHub
          </h1>
          <p
            style={{
              color: "var(--fgColor-muted)",
              fontSize: "14px",
              margin: 0,
            }}
          >
            Create your account and start collaborating
          </p>
        </div>

        {/* Signup Form */}
        <SignupForm />

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--borderColor-default)",
          }}
        >
          <Text fontSize={0} color="fg.muted" as="p">
            Already have an account? <Link href="/login">Sign in</Link>
          </Text>
        </div>
      </div>
    </div>
  );
}
