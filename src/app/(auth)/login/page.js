"use client";

import { Text, Link } from "@primer/react";
import { LoginForm } from "@/components/auth/LoginForm";
import styles from "../signup/page.module.css";

export default function LoginPage() {
  return (
    <div className={styles.signupPage}>
      <div className={styles.signupContainer}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Sign in to DevHub
          </h1>
          <p style={{ color: "var(--fgColor-muted)", fontSize: "14px", margin: 0 }}>
            Enter your credentials or use GitHub to continue
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--borderColor-default)",
          }}
        >
          <Text fontSize={0} color="fg.muted" as="p">
            Don't have an account? <Link href="/signup">Sign up</Link>
          </Text>
        </div>
      </div>
    </div>
  );
}
