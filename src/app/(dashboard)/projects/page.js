"use client";

import {
  PeopleIcon,
  PlusIcon,
  ProjectIcon,
  RepoIcon,
} from "@primer/octicons-react";
import {
  Avatar,
  Button,
  Flash,
  Heading,
  Label,
  Spinner,
  Text,
} from "@primer/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";

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

function ProjectCard({ project }) {
  const members = project.members || [];

  return (
    <article
      style={{
        padding: "20px",
        minHeight: "220px",
        borderRadius: "8px",
        border: "1px solid var(--borderColor-default)",
        backgroundColor: "var(--bgColor-default)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: 0,
            }}
          >
            <ProjectIcon
              size={18}
              style={{ color: "var(--fgColor-accent)", flexShrink: 0 }}
            />
            <Link
              href={`/projects/${encodeURIComponent(project.slug)}`}
              style={{
                color: "var(--fgColor-default)",
                fontWeight: "bold",
                fontSize: "16px",
                overflowWrap: "anywhere",
                textDecoration: "none",
              }}
            >
              {project.name}
            </Link>
          </div>
          <Label
            size="small"
            variant={roleVariant(project.userRole)}
            style={{ flexShrink: 0 }}
          >
            {project.userRole}
          </Label>
        </div>
        <Text
          as="p"
          style={{
            color: "var(--fgColor-muted)",
            fontSize: "14px",
            minHeight: "40px",
            lineHeight: 1.4,
            margin: "0 0 20px",
          }}
        >
          {project.description || "No project description."}
        </Text>
        {members.length > 0 && (
          <fieldset
            aria-label={`${project.memberCount} members`}
            style={{
              display: "flex",
              alignItems: "center",
              minHeight: "24px",
              margin: 0,
              padding: 0,
              border: 0,
            }}
          >
            {members.slice(0, 4).map((member, index) => (
              <Avatar
                key={member.id}
                src={member.image || undefined}
                alt={member.name || member.username || "Project member"}
                size={24}
                style={{
                  marginLeft: index === 0 ? 0 : "-6px",
                  border: "2px solid var(--bgColor-default)",
                }}
              />
            ))}
            {members.length > 4 && (
              <span
                style={{
                  marginLeft: "6px",
                  color: "var(--fgColor-muted)",
                  fontSize: "12px",
                }}
              >
                +{members.length - 4}
              </span>
            )}
          </fieldset>
        )}
      </div>
      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "12px",
          marginTop: "16px",
          borderTop: "1px solid var(--borderColor-default)",
          fontSize: "12px",
          color: "var(--fgColor-muted)",
        }}
      >
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <PeopleIcon size={14} /> {project.memberCount} member
          {project.memberCount !== 1 ? "s" : ""}
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RepoIcon size={14} /> {project.repoCount} repo
          {project.repoCount !== 1 ? "s" : ""}
        </span>
      </footer>
    </article>
  );
}

function roleVariant(role) {
  if (role === "OWNER") return "accent";
  if (role === "ADMIN") return "attention";
  return "secondary";
}
