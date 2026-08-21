"use client";

import { RepoIcon, SearchIcon } from "@primer/octicons-react";
import { Flash, Label, Text, TextInput } from "@primer/react";
import { useState } from "react";

export default function RepositoryPicker({
  repositories,
  selectedRepoIds,
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
        Select repositories
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
      {repositories.length === 0 ? (
        <Flash variant="default">
          No additional repositories are available to add.
        </Flash>
      ) : (
        <>
          <TextInput
            block
            leadingVisual={SearchIcon}
            placeholder="Search repositories..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search repositories"
            style={{ marginBottom: "10px" }}
          />
          {filteredRepositories.length === 0 ? (
            <Flash variant="default">No repositories match “{query}”.</Flash>
          ) : (
            <div
              style={{
                maxHeight: "260px",
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
        </>
      )}
    </fieldset>
  );
}
