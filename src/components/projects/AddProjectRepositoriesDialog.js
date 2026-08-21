"use client";

import { Button, Dialog, Flash, Spinner, Text } from "@primer/react";
import { useEffect, useState } from "react";
import RepositoryPicker from "@/components/projects/RepositoryPicker";

export default function AddProjectRepositoriesDialog({
  isOpen,
  slug,
  existingRepositoryFullNames,
  onDismiss,
  onAdded,
}) {
  const [availableRepos, setAvailableRepos] = useState([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState("");
  const [addingRepositories, setAddingRepositories] = useState(false);
  const [addError, setAddError] = useState("");

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
        setReposError("Repositories could not be loaded. Please try again.");
      } finally {
        setLoadingRepos(false);
      }
    }

    loadRepositories();
  }, [isOpen, availableRepos.length, loadingRepos]);

  const existingNames = new Set(existingRepositoryFullNames);
  const repositories = availableRepos.filter(
    (repository) => !existingNames.has(repository.full_name),
  );

  const toggleRepository = (repoId) => {
    setSelectedRepoIds((currentIds) =>
      currentIds.includes(repoId)
        ? currentIds.filter((id) => id !== repoId)
        : [...currentIds, repoId],
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedRepoIds.length === 0) {
      setAddError("Select at least one repository to add.");
      return;
    }

    setAddingRepositories(true);
    setAddError("");

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(slug)}/repositories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repositories: repositories.filter((repository) =>
              selectedRepoIds.includes(repository.id),
            ),
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setAddError(data.message || "Failed to add repositories.");
        return;
      }

      onAdded(data.repositories);
      setSelectedRepoIds([]);
      onDismiss();
    } catch (error) {
      console.error("Error adding repositories:", error);
      setAddError("An error occurred while adding repositories.");
    } finally {
      setAddingRepositories(false);
    }
  };

  const handleDismiss = () => {
    if (!addingRepositories) {
      setAddError("");
      onDismiss();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog title="Add repositories" onClose={handleDismiss} width="xlarge">
      <form onSubmit={handleSubmit}>
        <div style={{ padding: "16px" }}>
          {loadingRepos ? (
            <div
              style={{
                padding: "20px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Spinner size="small" />
            </div>
          ) : reposError ? (
            <Flash variant="danger">{reposError}</Flash>
          ) : (
            <RepositoryPicker
              repositories={repositories}
              selectedRepoIds={selectedRepoIds}
              onToggle={toggleRepository}
            />
          )}
          {addError && (
            <Text
              style={{
                color: "var(--fgColor-danger)",
                fontSize: "13px",
                display: "block",
                marginTop: "12px",
              }}
            >
              {addError}
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
          <Button type="submit" variant="primary" loading={addingRepositories}>
            Add repositories
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
