"use client";

import { RepoIcon } from "@primer/octicons-react";
import { Flash, Heading, Label, Spinner, Text } from "@primer/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectRepositoriesPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Unable to load project.");

        const data = await response.json();
        const matchingProject = data.projects?.find(
          (item) => item.slug === slug,
        );

        if (!matchingProject) {
          setError("This project could not be found.");
          return;
        }

        setProject(matchingProject);
      } catch (requestError) {
        console.error("Error loading project:", requestError);
        setError("We couldn't load this project. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ padding: "32px 0" }}>
        <Spinner size="medium" />
      </div>
    );
  }

  if (error) return <Flash variant="danger">{error}</Flash>;

  const repositories = project.repositories || [];

  return (
    <section aria-labelledby="repositories-heading">
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
          id="repositories-heading"
          style={{ fontSize: "20px", margin: 0 }}
        >
          Repositories
        </Heading>
        <Label style={{ borderRadius: "20px" }}>{repositories.length}</Label>
      </div>

      {repositories.length === 0 ? (
        <Flash variant="default">
          No repositories have been added to this project yet.
        </Flash>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {repositories.map((repository) => (
            <article
              key={repository.id}
              style={{
                padding: "16px",
                border: "1px solid var(--borderColor-default)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <RepoIcon
                  size={16}
                  style={{ color: "var(--fgColor-muted)", flexShrink: 0 }}
                />
                <Text
                  as="a"
                  href={repository.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--fgColor-accent)",
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {repository.fullName}
                </Text>
              </div>
              <Text
                as="p"
                style={{
                  color: "var(--fgColor-muted)",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                {repository.description ||
                  `Default branch: ${repository.defaultBranch}`}
              </Text>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
