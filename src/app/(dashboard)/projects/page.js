"use client";

import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import ProjectCard from "@/components/projects/ProjectCard";
import { PlusIcon, ProjectIcon } from "@primer/octicons-react";
import { Button, Flash, Heading, Label, Spinner, Text } from "@primer/react";
import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Unable to load projects.");
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (requestError) {
        console.error("Error loading projects:", requestError);
        setError("We couldn't load your projects. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      <header
        style={{
          marginBottom: "32px",
          paddingBottom: "24px",
          borderBottom: "1px solid var(--borderColor-default)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <Heading as="h1" style={{ fontSize: "28px", marginBottom: "4px" }}>
            Projects
          </Heading>
          <Text
            as="p"
            style={{
              color: "var(--fgColor-muted)",
              fontSize: "14px",
              margin: 0,
            }}
          >
            Manage the projects you collaborate on and their connected
            repositories.
          </Text>
        </div>
        <Button
          variant="primary"
          leadingVisual={PlusIcon}
          onClick={() => setShowCreateModal(true)}
        >
          New Project
        </Button>
      </header>

      <section aria-labelledby="your-projects-heading">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <Heading
            as="h2"
            id="your-projects-heading"
            style={{ fontSize: "20px", margin: 0 }}
          >
            Your Projects
          </Heading>
          {!loading && (
            <Label style={{ borderRadius: "20px" }}>{projects.length}</Label>
          )}
        </div>

        {loading ? (
          <div
            style={{
              minHeight: "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "var(--fgColor-muted)",
            }}
          >
            <Spinner size="medium" />
            <Text>Loading projects...</Text>
          </div>
        ) : error ? (
          <Flash variant="danger">{error}</Flash>
        ) : projects.length === 0 ? (
          <div
            style={{
              padding: "40px 32px",
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
              No projects yet
            </Heading>
            <Text
              as="p"
              style={{
                color: "var(--fgColor-muted)",
                fontSize: "14px",
                margin: "0 0 16px",
              }}
            >
              Create a project to begin collaborating with your team and linking
              repositories.
            </Text>
            <Button
              variant="primary"
              leadingVisual={PlusIcon}
              onClick={() => setShowCreateModal(true)}
            >
              Create your first project
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
      </section>

      {showCreateModal && (
        <CreateProjectDialog
          isOpen={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          onCreated={(project) =>
            setProjects((currentProjects) => [project, ...currentProjects])
          }
        />
      )}
    </div>
  );
}
