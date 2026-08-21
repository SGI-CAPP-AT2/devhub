"use client";

import { PeopleIcon, ProjectIcon, RepoIcon } from "@primer/octicons-react";
import { Avatar, Label, Text } from "@primer/react";
import Link from "next/link";

export default function ProjectCard({ project }) {
  const members = project?.members || [];
  const memberCount = project?.memberCount ?? members.length ?? 0;
  const repoCount = project?.repoCount ?? project?.repositories?.length ?? 0;

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
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div>
        {/* Header: Title & Role */}
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
          {project.userRole && (
            <Label
              size="small"
              variant={roleVariant(project.userRole)}
              style={{ flexShrink: 0 }}
            >
              {project.userRole}
            </Label>
          )}
        </div>

        {/* Description */}
        <Text
          as="p"
          style={{
            color: "var(--fgColor-muted)",
            fontSize: "14px",
            minHeight: "40px",
            lineHeight: 1.4,
            margin: "0 0 20px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {project.description || "No project description."}
        </Text>

        {/* Member Avatars */}
        {members.length > 0 && (
          <fieldset
            aria-label={`${memberCount} members`}
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
                key={member.id || index}
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

      {/* Footer: Member & Repo Counts */}
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
          <PeopleIcon size={14} /> {memberCount} member
          {memberCount !== 1 ? "s" : ""}
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RepoIcon size={14} /> {repoCount} repo
          {repoCount !== 1 ? "s" : ""}
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
