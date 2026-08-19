"use client";

import { useEffect, useState } from "react";
import {
  Heading,
  Text,
  Button,
  Label,
  Spinner,
  Flash,
  TextInput,
} from "@primer/react";
import {
  MarkGithubIcon,
  RepoIcon,
  StarIcon,
  RepoForkedIcon,
  PlusIcon,
  CheckIcon,
  LockIcon,
  SearchIcon,
} from "@primer/octicons-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedRepos, setAddedRepos] = useState({});

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Load user session
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (!sessionData.user) {
            window.location.href = "/signup";
            return;
          }
          setUser(sessionData.user);
        } else {
          window.location.href = "/signup";
          return;
        }

        // Load GitHub Repositories
        const reposRes = await fetch("/api/github/repos");
        if (reposRes.ok) {
          const reposData = await reposRes.json();
          setRepos(reposData.repos || []);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleAddToProject = (repoId) => {
    // Dummy action per user request: toggle added status for UI demonstration
    setAddedRepos((prev) => ({
      ...prev,
      [repoId]: !prev[repoId],
    }));
  };

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description &&
        repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header Banner */}
      <div
        style={{
          marginBottom: "32px",
          paddingBottom: "24px",
          borderBottom: "1px solid var(--borderColor-default)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <Heading as="h1" style={{ fontSize: "28px", marginBottom: "4px" }}>
            Welcome back, {user?.name || user?.username || "Developer"} 👋
          </Heading>
          <Text as="p" style={{ color: "var(--fgColor-muted)", fontSize: "14px", margin: 0 }}>
            Manage your connected GitHub repositories and DevHub projects
          </Text>
        </div>

        {user?.githubAuthorized && (
          <Label
            variant="success"
            size="large"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <MarkGithubIcon size={16} /> GitHub Authorized
          </Label>
        )}
      </div>

      {/* Repositories Section */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Heading as="h2" style={{ fontSize: "20px", margin: 0 }}>
              Your GitHub Repositories
            </Heading>
            <Label style={{ borderRadius: "20px" }}>{repos.length}</Label>
          </div>

          <div style={{ width: "280px" }}>
            <TextInput
              leadingVisual={SearchIcon}
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              block
            />
          </div>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "48px 0",
            }}
          >
            <Spinner size="large" />
            <Text style={{ marginLeft: "12px", color: "var(--fgColor-muted)" }}>
              Loading repositories...
            </Text>
          </div>
        ) : filteredRepos.length === 0 ? (
          <Flash variant="default" style={{ textAlign: "center", padding: "32px" }}>
            <Text>No repositories found matching "{searchQuery}".</Text>
          </Flash>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredRepos.map((repo) => {
              const isAdded = Boolean(addedRepos[repo.id]);
              return (
                <div
                  key={repo.id}
                  style={{
                    padding: "20px",
                    borderRadius: "8px",
                    border: `1px solid ${
                      isAdded
                        ? "var(--borderColor-accent-emphasis, #1f6beb)"
                        : "var(--borderColor-default, #30363d)"
                    }`,
                    backgroundColor: "var(--bgColor-inset, #0d1117)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <RepoIcon
                          size={18}
                          style={{ color: "var(--fgColor-muted)", flexShrink: 0 }}
                        />
                        <Text
                          as="a"
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontWeight: "bold",
                            color: "var(--fgColor-accent, #58a6ff)",
                            textDecoration: "none",
                            fontSize: "16px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {repo.name}
                        </Text>
                      </div>

                      <Label
                        size="small"
                        variant={repo.private ? "attention" : "secondary"}
                        style={{ flexShrink: 0 }}
                      >
                        {repo.private ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <LockIcon size={12} /> Private
                          </span>
                        ) : (
                          "Public"
                        )}
                      </Label>
                    </div>

                    <Text
                      as="p"
                      style={{
                        color: "var(--fgColor-muted)",
                        fontSize: "14px",
                        marginBottom: "20px",
                        minHeight: "40px",
                        lineHeight: 1.4,
                      }}
                    >
                      {repo.description || "No description provided."}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--borderColor-default)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        fontSize: "12px",
                        color: "var(--fgColor-muted)",
                      }}
                    >
                      {repo.language && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: getLanguageColor(repo.language),
                              display: "inline-block",
                            }}
                          />
                          <span>{repo.language}</span>
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <StarIcon size={14} />
                        <span>{repo.stargazers_count}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <RepoForkedIcon size={14} />
                        <span>{repo.forks_count}</span>
                      </div>
                    </div>

                    {/* Dummy Add to Project Button */}
                    <Button
                      size="small"
                      variant={isAdded ? "outline" : "primary"}
                      leadingVisual={isAdded ? CheckIcon : PlusIcon}
                      onClick={() => handleAddToProject(repo.id)}
                    >
                      {isAdded ? "Added" : "Add to Project"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getLanguageColor(language) {
  switch (language) {
    case "JavaScript":
      return "#f1e05a";
    case "TypeScript":
      return "#3178c6";
    case "Python":
      return "#3572A5";
    case "Go":
      return "#00ADD8";
    default:
      return "#8b949e";
  }
}
