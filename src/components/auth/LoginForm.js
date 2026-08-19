"use client";

import { useState, useEffect } from "react";
import { FormControl, TextInput, Button, Text } from "@primer/react";
import { EyeIcon, EyeClosedIcon, MarkGithubIcon } from "@primer/octicons-react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errParam = params.get("error");
      if (errParam === "no_account_linked") {
        setError("No DevHub account is linked to this GitHub account. Please sign up or log in with credentials.");
      } else if (errParam === "auth_failed" || errParam === "token_failed") {
        setError("GitHub authorization failed. Please try again.");
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to sign in");
        return;
      }

      // Redirect to dashboard on successful login
      window.location.href = "/";
    } catch (err) {
      setError("An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = "/api/auth/github/login";
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Username / Email Field */}
      <FormControl>
        <FormControl.Label>Username or Email</FormControl.Label>
        <TextInput
          placeholder="Enter your username or email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size="medium"
          block
        />
      </FormControl>

      {/* Password Field */}
      <FormControl>
        <FormControl.Label>Password</FormControl.Label>
        <TextInput
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size="medium"
          block
          trailingAction={
            <TextInput.Action
              onClick={() => setShowPassword(!showPassword)}
              icon={showPassword ? EyeClosedIcon : EyeIcon}
              aria-label="Toggle password visibility"
            />
          }
        />
      </FormControl>

      {/* Error Message Banner */}
      {error && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "var(--bgColor-danger)",
            borderRadius: "6px",
          }}
        >
          <Text as="p" fontSize={0} color="fg.default" style={{ margin: 0 }}>
            {error}
          </Text>
        </div>
      )}

      {/* Credentials Sign In Button */}
      <Button
        type="submit"
        loading={loading}
        size="medium"
        block
        variant="primary"
        style={{ marginTop: "4px" }}
      >
        Sign In
      </Button>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "8px 0",
          color: "var(--fgColor-muted)",
          fontSize: "12px",
        }}
      >
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--borderColor-default)" }} />
        <span style={{ padding: "0 12px", textTransform: "uppercase" }}>OR</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--borderColor-default)" }} />
      </div>

      {/* GitHub Sign In Button */}
      <Button
        type="button"
        onClick={handleGitHubLogin}
        size="medium"
        block
        variant="secondary"
        leadingVisual={MarkGithubIcon}
      >
        Sign In with GitHub
      </Button>
    </form>
  );
}

export default LoginForm;
