"use client";

import { FormControl, Button, Text, Checkbox } from "@primer/react";
import { MarkGithubIcon, CheckCircleIcon } from "@primer/octicons-react";
import { useState } from "react";

export default function GitHubStep({ data, onChange, errors }) {
  const [authorizing, setAuthorizing] = useState(false);
  const [useConsent, setUseConsent] = useState(false);

  const handleGitHubAuth = async () => {
    if (!useConsent) {
      return;
    }

    setAuthorizing(true);

    // Save username & passwordHash to database prior to GitHub redirect
    if (data.username && data.password) {
      try {
        await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: data.username,
            password: data.password,
            githubAuthorized: false,
          }),
        });
      } catch (err) {
        console.error("Failed to pre-save credentials:", err);
      }
    }

    const usernameParam = data.username
      ? `?username=${encodeURIComponent(data.username)}`
      : "";
    window.location.href = `/api/auth/github/login${usernameParam}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          padding: "16px",
          backgroundColor: "var(--bgColor-inset)",
          border: "1px solid var(--borderColor-default)",
          borderRadius: "8px",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            margin: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <MarkGithubIcon style={{ marginRight: "8px" }} size={20} />
          GitHub Authorization
        </h3>

        {data.githubAuthorized && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--fgColor-success)",
              marginTop: "8px",
            }}
          >
            <CheckCircleIcon style={{ marginRight: "8px" }} size={16} />
            <Text
              as="span"
              fontSize={1}
              style={{ color: "var(--fgColor-success)", fontWeight: "600" }}
            >
              GitHub account connected
            </Text>
          </div>
        )}
      </div>

      <FormControl>
        <Checkbox
          checked={useConsent}
          onChange={(e) => setUseConsent(e.target.checked)}
          disabled={data.githubAuthorized}
        />
        <FormControl.Label style={{ fontSize: "14px" }}>
          I authorize DevHub to access my GitHub account and repositories
        </FormControl.Label>
      </FormControl>

      {errors.github && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "var(--bgColor-danger)",
            borderRadius: "6px",
          }}
        >
          <Text as="p" fontSize={0} color="fg.default">
            {errors.github}
          </Text>
        </div>
      )}

      <Button
        onClick={handleGitHubAuth}
        disabled={!useConsent || data.githubAuthorized}
        loading={authorizing}
        size="medium"
        block
        variant="primary"
        leadingVisual={MarkGithubIcon}
      >
        {data.githubAuthorized ? "Connected" : "Authorize with GitHub"}
      </Button>
    </div>
  );
}
