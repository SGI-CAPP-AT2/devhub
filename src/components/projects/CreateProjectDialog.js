"use client";

import { Button, Dialog, Flash, Spinner, Text, TextInput } from "@primer/react";
import { useEffect, useState } from "react";
import RepositoryPicker from "@/components/projects/RepositoryPicker";

export default function CreateProjectDialog({ isOpen, onDismiss, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repositories, setRepositories] = useState([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState([]);
  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const [repositoriesError, setRepositoriesError] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!isOpen || repositories.length || loadingRepositories) return;

    async function loadRepositories() {
      setLoadingRepositories(true);
      setRepositoriesError("");
      try {
        const response = await fetch("/api/github/repos");
        if (!response.ok) throw new Error("Unable to load repositories.");
        const data = await response.json();
        setRepositories(data.repos || []);
      } catch (error) {
        console.error("Error loading repositories:", error);
        setRepositoriesError("Repositories could not be loaded. You can still create an empty project.");
      } finally {
        setLoadingRepositories(false);
      }
    }

    loadRepositories();
  }, [isOpen, repositories.length, loadingRepositories]);

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
          repositories: repositories.filter((repository) => selectedRepoIds.includes(repository.id)),
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

  const handleDismiss = () => {
    if (!creatingProject) {
      setCreateError("");
      onDismiss();
    }
  };

  const toggleRepository = (repoId) => {
    setSelectedRepoIds((currentIds) => currentIds.includes(repoId)
      ? currentIds.filter((id) => id !== repoId)
      : [...currentIds, repoId]);
  };

  return (
    <Dialog isOpen={isOpen} onDismiss={handleDismiss} aria-labelledby="create-project-title" style={{ width: "min(640px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}>
      <Dialog.Header id="create-project-title">Create New Project</Dialog.Header>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <Text as="label" htmlFor="project-name" style={{ fontWeight: "bold", fontSize: "14px", display: "block" }}>Project name</Text>
            <TextInput id="project-name" block placeholder="e.g. Mobile App Redesign" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Text as="label" htmlFor="project-description" style={{ fontWeight: "bold", fontSize: "14px", display: "block" }}>Description <span style={{ color: "var(--fgColor-muted)", fontWeight: "normal" }}>(optional)</span></Text>
            <TextInput id="project-description" block placeholder="Brief summary of the project goals" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          {loadingRepositories ? (
            <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}><Spinner size="small" /></div>
          ) : repositoriesError ? (
            <Flash variant="warning">{repositoriesError}</Flash>
          ) : (
            <RepositoryPicker repositories={repositories} selectedRepoIds={selectedRepoIds} onToggle={toggleRepository} />
          )}
          {createError && <Text style={{ color: "var(--fgColor-danger)", fontSize: "13px" }}>{createError}</Text>}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--borderColor-default)", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Button type="button" onClick={handleDismiss}>Cancel</Button>
          <Button type="submit" variant="primary" loading={creatingProject}>Create Project</Button>
        </div>
      </form>
    </Dialog>
  );
}
