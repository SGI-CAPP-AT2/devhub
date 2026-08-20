"use client";

import {
  GearIcon,
  GitPullRequestIcon,
  IssueOpenedIcon,
  ProjectIcon,
  RepoIcon,
} from "@primer/octicons-react";
import { Spinner, Text, UnderlineNav } from "@primer/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { label: "Repositories", path: "", icon: RepoIcon },
  { label: "Issues", path: "issues", icon: IssueOpenedIcon },
  { label: "Board", path: "board", icon: ProjectIcon },
  { label: "Pull requests", path: "pull-requests", icon: GitPullRequestIcon },
  { label: "Settings", path: "settings", icon: GearIcon },
];

export default function ProjectLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const projectPath = `/projects/${encodeURIComponent(slug || "")}`;
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    async function loadProjectName() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) return;

        const data = await response.json();
        const project = data.projects?.find((item) => item.slug === slug);
        setProjectName(project?.name || "");
      } catch (error) {
        console.error("Error loading project name:", error);
      }
    }

    loadProjectName();
  }, [slug]);

  return (
    <div style={{ padding: "5px 5px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderBottom: "1px solid var(--borderColor-muted)",
        }}
      >
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            overflowX: "auto",
          }}
        >
          <UnderlineNav
            aria-label="Project navigation"
            variant="flush"
            hideIconsBreakpoint="small"
          >
            {TABS.map((tab) => {
              const href = tab.path
                ? `${projectPath}/${tab.path}`
                : projectPath;
              const isActive = pathname === href;
              const Icon = tab.icon;

              return (
                <UnderlineNav.Item
                  key={tab.path || "repositories"}
                  as={Link}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  leadingVisual={<Icon size={16} />}
                >
                  {tab.label}
                </UnderlineNav.Item>
              );
            })}
          </UnderlineNav>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
            maxWidth: "40%",
            padding: "0 8px",
          }}
        >
          {!projectName ? (
            <Spinner size="small" />
          ) : (
            <Text
              style={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={projectName}
            >
              {projectName}
            </Text>
          )}
        </div>
      </div>

      <div style={{ paddingTop: "10px" }}>{children}</div>
    </div>
  );
}
