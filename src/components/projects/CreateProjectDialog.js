"use client";

import { RepoIcon, SearchIcon } from "@primer/octicons-react";
import {
  Button,
  Dialog,
  Flash,
  Label,
  Spinner,
  Text,
  TextInput,
} from "@primer/react";
import { useEffect, useState } from "react";

export default function CreateProjectDialog({ isOpen, onDismiss, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableRepos, setAvailableRepos] = useState([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!isOpen || availableRepos.length || loadingRepos) return;

    async function loadRepositories() {
      setLoadingRepos(true);
      setReposError("");

      try {
        const response = await fetch("/api/github/repos");
        if (!response.ok) throw new Error("Unable to load repositories.");

        const data = await response.json();
        setAvailableRepos(data.repos || []);
      } catch (error) {
        console.error("Error loading repositories:", error);
        setReposError(
          "Repositories could not be loaded. You can still create an empty project.",
        );
      } finally {
        setLoadingRepos(false);
      }
    }

    loadRepositories();
  }, [isOpen, availableRepos.length, loadingRepos]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setCreateError("Project name is required.");
      return;
    }

    setCreatingProject(true);
    setCreateError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          repositories: availableRepos.filter((repo) =>
            selectedRepoIds.includes(repo.id),
          ),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.message || "Failed to create project.");
        return;
      }

      onCreated?.(data.project);
      setName("");
      setDescription("");
      setSelectedRepoIds([]);
      onDismiss();
    } catch (error) {
      console.error("Error creating project:", error);
      setCreateError("An error occurred while creating the project.");
    } finally {
      setCreatingProject(false);
    }
  };

  const toggleRepository = (repoId) => {
    setSelectedRepoIds((currentIds) =>
      currentIds.includes(repoId)
        ? currentIds.filter((id) => id !== repoId)
        : [...currentIds, repoId],
    );
  };

  const handleDismiss = () => {
    if (!creatingProject) {
      setCreateError("");
      onDismiss();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onDismiss={handleDismiss}
      aria-labelledby="create-project-title"
      style={{
        width: "min(640px, calc(100vw - 32px))",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <Dialog.Header id="create-project-title">
        Create New Project
      </Dialog.Header>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <Text
              as="label"
              htmlFor="project-name"
              style={{ fontWeight: "bold", fontSize: "14px", display: "block" }}
            >
              Project name
            </Text>
            <TextInput
              id="project-name"
              block
              placeholder="e.g. Mobile App Redesign"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Text
              as="label"
              htmlFor="project-description"
              style={{ fontWeight: "bold", fontSize: "14px", display: "block" }}
            >
              Description{" "}
              <span
                style={{ color: "var(--fgColor-muted)", fontWeight: "normal" }}
              >
                (optional)
              </span>
            </Text>
            <TextInput
              id="project-description"
              block
              placeholder="Brief summary of the project goals"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <RepositoryPicker
            repositories={availableRepos}
            selectedRepoIds={selectedRepoIds}
            loading={loadingRepos}
            error={reposError}
            onToggle={toggleRepository}
          />
          {createError && (
            <Text style={{ color: "var(--fgColor-danger)", fontSize: "13px" }}>
              {createError}
            </Text>
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
          <Button type="button" onClick={handleDismiss}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={creatingProject}>
            Create Project
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function RepositoryPicker({
  repositories,
  selectedRepoIds,
  loading,
  error,
  onToggle,
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRepositories = repositories.filter((repo) => {
    if (!normalizedQuery) return true;

    return [repo.name, repo.full_name, repo.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  return (
    <fieldset style={{ margin: 0, minWidth: 0, padding: 0, border: 0 }}>
      <Text
        as="legend"
        style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}
      >
        Add repositories{" "}
        <span style={{ color: "var(--fgColor-muted)", fontWeight: "normal" }}>
          (optional)
        </span>
      </Text>
      <Text
        as="p"
        style={{
          color: "var(--fgColor-muted)",
          fontSize: "12px",
          margin: "0 0 10px",
        }}
      >
        {selectedRepoIds.length} selected
      </Text>

      {!loading && !error && repositories.length > 0 && (
        <TextInput
          block
          leadingVisual={SearchIcon}
          placeholder="Search repositories..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search repositories"
        />
      )}

      {loading ? (
        <div
          style={{
            marginTop: "10px",
            padding: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Spinner size="small" />
        </div>
      ) : error ? (
        <Flash variant="warning">{error}</Flash>
      ) : repositories.length === 0 ? (
        <Flash variant="default">No repositories are available to add.</Flash>
      ) : filteredRepositories.length === 0 ? (
        <Flash variant="default">No repositories match “{query}”.</Flash>
      ) : (
        <div
          style={{
            marginTop: "10px",
            maxHeight: "210px",
            overflowY: "auto",
            border: "1px solid var(--borderColor-default)",
            borderRadius: "6px",
          }}
        >
          {filteredRepositories.map((repo, index) => {
            const isSelected = selectedRepoIds.includes(repo.id);

            return (
              <label
                key={repo.id}
                htmlFor={`repository-${repo.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  boxSizing: "border-box",
                  maxWidth: "100%",
                  minWidth: 0,
                  cursor: "pointer",
                  backgroundColor: isSelected
                    ? "var(--bgColor-accent-muted)"
                    : "transparent",
                  borderTop:
                    index === 0 ? 0 : "1px solid var(--borderColor-muted)",
                }}
              >
                <input
                  id={`repository-${repo.id}`}
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(repo.id)}
                />
                <RepoIcon
                  size={16}
                  style={{ color: "var(--fgColor-muted)", flexShrink: 0 }}
                />
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {repo.full_name || repo.name}
                  </span>
                  {repo.description && (
                    <span
                      style={{
                        display: "block",
                        color: "var(--fgColor-muted)",
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {repo.description}
                    </span>
                  )}
                </span>
                {repo.private && (
                  <Label
                    size="small"
                    variant="attention"
                    style={{ marginLeft: "auto", flexShrink: 0 }}
                  >
                    Private
                  </Label>
                )}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
