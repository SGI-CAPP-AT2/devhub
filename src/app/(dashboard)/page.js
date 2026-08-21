"use client";

import {
  CheckIcon,
  LockIcon,
  MarkGithubIcon,
  PeopleIcon,
  PlusIcon,
  ProjectIcon,
  RepoForkedIcon,
  RepoIcon,
  SearchIcon,
  StarIcon,
} from "@primer/octicons-react";
import {
  Button,
  Dialog,
  Flash,
  Heading,
  Label,
  Select,
  Spinner,
  Text,
  TextInput,
} from "@primer/react";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import ProjectCard from "@/components/projects/ProjectCard";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // New Project Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Add to Project dialog state
  const [addToProjectRepo, setAddToProjectRepo] = useState(null); // the github repo object
  const [eligibleProjects, setEligibleProjects] = useState([]); // projects that don't already have this repo
  const [selectedProjectSlug, setSelectedProjectSlug] = useState("");
  const [addingToProject, setAddingToProject] = useState(false);
  const [addToProjectError, setAddToProjectError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Load user session
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

        // 2. Load Associated Projects
        const projectsRes = await fetch("/api/projects");
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.projects || []);
        }

        // 3. Load GitHub Repositories
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

  const handleOpenAddToProject = (repo) => {
    // Filter out projects that already contain this repo
    const repoFullName = repo.full_name?.toLowerCase();
    const available = projects.filter(
      (p) =>
        !p.repositories?.some(
          (r) => r.fullName?.toLowerCase() === repoFullName,
        ),
    );
    setAddToProjectRepo(repo);
    setEligibleProjects(available);
    setAddToProjectError("");
    setSelectedProjectSlug(available.length > 0 ? available[0].slug : "");
  };

  const handleSubmitAddToProject = async (e) => {
    e.preventDefault();
    if (!selectedProjectSlug || !addToProjectRepo) return;

    setAddingToProject(true);
    setAddToProjectError("");

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(selectedProjectSlug)}/repositories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repositories: [addToProjectRepo] }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add repository to project.");
      }

      // Update local project repositories so re-opening the dialog reflects the change
      setProjects((prev) =>
        prev.map((p) =>
          p.slug === selectedProjectSlug
            ? {
                ...p,
                repositories: [
                  ...(p.repositories || []),
                  {
                    id: String(addToProjectRepo.id),
                    name: addToProjectRepo.name,
                    fullName: addToProjectRepo.full_name,
                    description: addToProjectRepo.description || null,
                    url: addToProjectRepo.html_url,
                    defaultBranch: addToProjectRepo.default_branch || "main",
                    isPrivate: Boolean(addToProjectRepo.private),
                  },
                ],
                repoCount: (p.repoCount ?? 0) + 1,
              }
            : p,
        ),
      );
      setAddToProjectRepo(null);
    } catch (err) {
      setAddToProjectError(err.message || "Failed to add repository.");
    } finally {
      setAddingToProject(false);
    }
  };

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchingRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(trimmedQuery) ||
      repo.description?.toLowerCase().includes(trimmedQuery),
  );

  const displayedRepos = trimmedQuery
    ? matchingRepos
    : matchingRepos.slice(0, 6);

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
          <Text
            as="p"
            style={{
              color: "var(--fgColor-muted)",
              fontSize: "14px",
              margin: 0,
            }}
          >
            Manage your associated projects and connected GitHub repositories
          </Text>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user?.githubAuthorized && (
            <Label
              variant="success"
              size="large"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <MarkGithubIcon size={16} /> GitHub Authorized
            </Label>
          )}

          <Button
            variant="primary"
            leadingVisual={PlusIcon}
            onClick={() => setShowCreateModal(true)}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Projects Section */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Heading as="h2" style={{ fontSize: "20px", margin: 0 }}>
              Your Projects
            </Heading>
            <Label style={{ borderRadius: "20px" }}>{projects.length}</Label>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "20px 0" }}>
            <Spinner size="medium" />
          </div>
        ) : projects.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              border: "1px dashed var(--borderColor-default)",
              borderRadius: "8px",
              backgroundColor: "var(--bgColor-inset)",
            }}
          >
            <ProjectIcon
              size={32}
              style={{ color: "var(--fgColor-muted)", marginBottom: "12px" }}
            />
            <Heading as="h3" style={{ fontSize: "16px", marginBottom: "8px" }}>
              No projects associated yet
            </Heading>
            <Text
              as="p"
              style={{
                color: "var(--fgColor-muted)",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              Create a new project to start collaborating with your team and
              linking GitHub repositories.
            </Text>
            <Button
              variant="primary"
              leadingVisual={PlusIcon}
              onClick={() => setShowCreateModal(true)}
            >
              Create First Project
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* GitHub Repositories Section */}
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
            <Label style={{ borderRadius: "20px" }}>
              {trimmedQuery
                ? `${matchingRepos.length} results`
                : repos.length > 6
                  ? `6 of ${repos.length}`
                  : repos.length}
            </Label>
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
        ) : displayedRepos.length === 0 ? (
          <Flash
            variant="default"
            style={{ textAlign: "center", padding: "32px" }}
          >
            <Text>No repositories found matching "{searchQuery}".</Text>
          </Flash>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
                gap: "16px",
              }}
            >
              {displayedRepos.map((repo) => {
                return (
                  <div
                    key={repo.id}
                    style={{
                      padding: "20px",
                      borderRadius: "8px",
                      border: "1px solid var(--borderColor-default, #30363d)",
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
                            style={{
                              color: "var(--fgColor-muted)",
                              flexShrink: 0,
                            }}
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
                          marginBottom: "16px",
                          lineHeight: 1.4,
                          minHeight: "40px",
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: getLanguageColor(
                                  repo.language,
                                ),
                                display: "inline-block",
                              }}
                            />
                            <span>{repo.language}</span>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <StarIcon size={14} />
                          <span>{repo.stargazers_count}</span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <RepoForkedIcon size={14} />
                          <span>{repo.forks_count}</span>
                        </div>
                      </div>

                      {/* Add to Project Button */}
                      <Button
                        size="small"
                        variant="primary"
                        leadingVisual={PlusIcon}
                        onClick={() => handleOpenAddToProject(repo)}
                      >
                        Add to Project
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!trimmedQuery && repos.length > 6 && (
              <div
                style={{
                  marginTop: "16px",
                  textAlign: "center",
                  padding: "8px",
                }}
              >
                <Text
                  style={{
                    color: "var(--fgColor-muted)",
                    fontSize: "13px",
                  }}
                >
                  Showing 6 of {repos.length} repositories. Search to find other
                  repositories.
                </Text>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectDialog
          isOpen={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          onCreated={(project) =>
            setProjects((currentProjects) => [project, ...currentProjects])
          }
        />
      )}

      {/* Add to Project Dialog */}
      {addToProjectRepo && (
        <Dialog
          title={`Add "${addToProjectRepo.name}" to a project`}
          onClose={() => {
            if (!addingToProject) setAddToProjectRepo(null);
          }}
          width="medium"
        >
          <form onSubmit={handleSubmitAddToProject}>
            <div
              style={{
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {addToProjectError && (
                <Flash variant="danger">{addToProjectError}</Flash>
              )}

              {projects.length === 0 ? (
                <Flash variant="warning">
                  You have no projects yet. Create a project first.
                </Flash>
              ) : eligibleProjects.length === 0 ? (
                <Flash variant="default">
                  <strong>{addToProjectRepo.full_name}</strong> has already been
                  added to all your projects.
                </Flash>
              ) : (
                <>
                  <Text as="p" style={{ margin: 0, fontSize: "14px" }}>
                    Select which project to add{" "}
                    <strong>{addToProjectRepo.full_name}</strong> to.
                  </Text>

                  <div>
                    <Text
                      as="label"
                      htmlFor="select-project"
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Select Project
                    </Text>
                    <Select
                      id="select-project"
                      block
                      value={selectedProjectSlug}
                      onChange={(e) => setSelectedProjectSlug(e.target.value)}
                    >
                      {eligibleProjects.map((p) => (
                        <Select.Option key={p.id} value={p.slug}>
                          {p.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--borderColor-default)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <Button
                type="button"
                onClick={() => setAddToProjectRepo(null)}
                disabled={addingToProject}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={addingToProject}
                disabled={
                  eligibleProjects.length === 0 ||
                  !selectedProjectSlug ||
                  addingToProject
                }
              >
                Add to Project
              </Button>
            </div>
          </form>
        </Dialog>
      )}
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
