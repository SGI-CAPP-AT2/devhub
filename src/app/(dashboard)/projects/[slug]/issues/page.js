"use client";

import { IssueOpenedIcon, ProjectIcon } from "@primer/octicons-react";
import {
  Avatar,
  Button,
  Checkbox,
  Dialog,
  Flash,
  Heading,
  Label,
  Link,
  Select,
  Spinner,
  Text,
} from "@primer/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const LIMIT = 20;

export default function IssuesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params.slug;

  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || LIMIT, 1),
    100,
  );

  const statusParam = searchParams.get("status");

  const status = ["open", "closed", "all"].includes(statusParam)
    ? statusParam
    : "open";

  const repo = searchParams.get("repo") || "";

  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    hasNextPage: false,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Issue selection for adding to board
  const [selectedIssues, setSelectedIssues] = useState([]);

  // Add to Board Dialog state
  const [isAddToBoardOpen, setIsAddToBoardOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [targetBoardId, setTargetBoardId] = useState("");
  const [targetSectionId, setTargetSectionId] = useState("");
  const [addingToBoard, setAddingToBoard] = useState(false);
  const [addToBoardError, setAddToBoardError] = useState("");

  useEffect(() => {
    if (!slug) return;

    async function loadIssues() {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams();

        query.set("page", String(page));
        query.set("limit", String(limit));
        query.set("status", status);

        if (repo) {
          query.set("repo", repo);
        }

        const response = await fetch(
          `/api/projects/${slug}/issues?${query.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          }

          throw new Error("Failed to load issues");
        }

        const data = await response.json();

        setIssues(data.issues || []);
        // Reset selection on page change or filter change
        setSelectedIssues([]);

        setPagination(
          data.pagination || {
            page,
            limit,
            hasNextPage: false,
            total: 0,
          },
        );
      } catch (err) {
        console.error("Failed to load issues:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadIssues();
  }, [slug, page, limit, status, repo]);

  function changeStatus(newStatus) {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("limit", String(limit));
    params.set("status", newStatus);

    if (repo) {
      params.set("repo", repo);
    }

    router.push(`/projects/${slug}/issues?${params.toString()}`);
  }

  function changePage(newPage) {
    const params = new URLSearchParams();

    params.set("page", String(newPage));
    params.set("limit", String(limit));
    params.set("status", status);

    if (repo) {
      params.set("repo", repo);
    }

    router.push(`/projects/${slug}/issues?${params.toString()}`);
  }

  // Toggle selection for a single issue
  const toggleIssueSelection = (issue) => {
    setSelectedIssues((prev) => {
      const exists = prev.some((i) => i.id === issue.id);
      if (exists) {
        return prev.filter((i) => i.id !== issue.id);
      }
      return [...prev, issue];
    });
  };

  // Toggle select all on current page
  const toggleSelectAll = () => {
    if (selectedIssues.length === issues.length && issues.length > 0) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues([...issues]);
    }
  };

  // Open Add to Board dialog and fetch available boards
  const handleOpenAddToBoard = async () => {
    setIsAddToBoardOpen(true);
    setAddToBoardError("");
    setLoadingBoards(true);

    try {
      const response = await fetch(`/api/projects/${slug}/boards`);
      if (!response.ok) {
        throw new Error("Failed to load boards.");
      }
      const data = await response.json();
      const boardList = data.boards || [];
      setBoards(boardList);

      if (boardList.length > 0) {
        setTargetBoardId(boardList[0].id);
        const sections = boardList[0].sections || [];
        setTargetSectionId(sections.length > 0 ? sections[0].id : "");
      } else {
        setTargetBoardId("");
        setTargetSectionId("");
      }
    } catch (err) {
      console.error("Error loading boards:", err);
      setAddToBoardError("Failed to fetch project boards.");
    } finally {
      setLoadingBoards(false);
    }
  };

  // When selected board changes in dialog, update target section
  const handleBoardChange = (boardId) => {
    setTargetBoardId(boardId);
    const board = boards.find((b) => b.id === boardId);
    const sections = board?.sections || [];
    setTargetSectionId(sections.length > 0 ? sections[0].id : "");
  };

  // Submit adding issues to board
  const handleSubmitAddToBoard = async (e) => {
    e.preventDefault();
    if (!targetSectionId || selectedIssues.length === 0) return;

    try {
      setAddingToBoard(true);
      setAddToBoardError("");

      const response = await fetch(`/api/projects/${slug}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: targetSectionId,
          issues: selectedIssues.map((issue) => ({
            title: `#${issue.number} ${issue.title}`,
            description: issue.body || null,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add issues to board.");
      }

      setIsAddToBoardOpen(false);
      setSelectedIssues([]);
      setSuccessMsg(
        `Successfully added ${selectedIssues.length} issue(s) to the board!`,
      );
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Add to board error:", err);
      setAddToBoardError(err.message || "Failed to add issues to board.");
    } finally {
      setAddingToBoard(false);
    }
  };

  const selectedBoard = boards.find((b) => b.id === targetBoardId);
  const targetSections = selectedBoard?.sections || [];
  const allSelected =
    issues.length > 0 && selectedIssues.length === issues.length;

  return (
    <div>
      {/* Alert Notifications */}
      {error && (
        <Flash
          variant="danger"
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <Button size="small" variant="invisible" onClick={() => setError("")}>
            Dismiss
          </Button>
        </Flash>
      )}

      {successMsg && (
        <Flash
          variant="success"
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{successMsg}</span>
          <Button
            size="small"
            variant="invisible"
            onClick={() => setSuccessMsg("")}
          >
            Dismiss
          </Button>
        </Flash>
      )}

      {/* Top Filter and Action Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            variant={status === "open" ? "primary" : "default"}
            onClick={() => changeStatus("open")}
            disabled={loading}
          >
            Open
          </Button>

          <Button
            variant={status === "closed" ? "primary" : "default"}
            onClick={() => changeStatus("closed")}
            disabled={loading}
          >
            Closed
          </Button>

          <Button
            variant={status === "all" ? "primary" : "default"}
            onClick={() => changeStatus("all")}
            disabled={loading}
          >
            All
          </Button>
        </div>

        {/* Add to Board CTA button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {selectedIssues.length > 0 && (
            <Text style={{ fontSize: "13px", color: "var(--fgColor-muted)" }}>
              {selectedIssues.length} selected
            </Text>
          )}

          <Button
            variant="primary"
            leadingVisual={ProjectIcon}
            disabled={selectedIssues.length === 0 || loading}
            onClick={handleOpenAddToBoard}
          >
            Add to Board
            {selectedIssues.length > 0 ? ` (${selectedIssues.length})` : ""}
          </Button>
        </div>
      </div>

      {/* Issues Container with Header and Rows */}
      <div
        style={{
          border: "1px solid var(--borderColor-default)",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {/* Table Header with Select All */}
        {!loading && issues.length > 0 && (
          <div
            style={{
              padding: "10px 16px",
              backgroundColor: "var(--bgColor-muted, #f6f8fa)",
              borderBottom: "1px solid var(--borderColor-default)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Checkbox
              checked={allSelected}
              indeterminate={
                selectedIssues.length > 0 &&
                selectedIssues.length < issues.length
              }
              onChange={toggleSelectAll}
              aria-label="Select all issues"
            />
            <Text style={{ fontSize: "13px", fontWeight: 600 }}>
              {selectedIssues.length > 0
                ? `${selectedIssues.length} of ${issues.length} selected`
                : "Select issues to add to board"}
            </Text>
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: "80px 32px",
              textAlign: "center",
            }}
          >
            <Spinner size="medium" />
            <Text
              style={{
                color: "var(--fgColor-muted)",
                display: "block",
                marginTop: "8px",
              }}
            >
              Loading issues...
            </Text>
          </div>
        ) : issues.length === 0 ? (
          <div
            style={{
              padding: "80px 32px",
              textAlign: "center",
            }}
          >
            <IssueOpenedIcon
              size={32}
              style={{
                color: "var(--fgColor-muted)",
                marginBottom: "16px",
              }}
            />

            <Heading as="h3" sx={{ mb: 1 }}>
              No issues found
            </Heading>

            <Text sx={{ color: "fg.muted" }}>
              There are no {status === "all" ? "" : status} issues in this
              project.
            </Text>
          </div>
        ) : (
          issues.map((issue) => {
            const isSelected = selectedIssues.some((i) => i.id === issue.id);

            return (
              <div
                key={`${issue.repository.id}-${issue.number}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--borderColor-muted)",
                  backgroundColor: isSelected
                    ? "var(--bgColor-accent-muted, #e7f2ff)"
                    : "transparent",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Row Checkbox */}
                <div style={{ paddingTop: "2px", flexShrink: 0 }}>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleIssueSelection(issue)}
                    aria-label={`Select issue ${issue.title}`}
                  />
                </div>

                {/* Issue Icon */}
                <div
                  style={{
                    paddingTop: "2px",
                    flexShrink: 0,
                  }}
                >
                  <IssueOpenedIcon
                    size={16}
                    style={{
                      color:
                        issue.state === "closed"
                          ? "var(--fgColor-done, #8250df)"
                          : "var(--fgColor-open, #1a7f37)",
                    }}
                  />
                </div>

                {/* Issue Content */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {/* Title */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <Link
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: 2,
                        fontWeight: "bold",
                        color: "fg.default",
                        textDecoration: "none",

                        "&:hover": {
                          color: "accent.fg",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {issue.title}
                    </Link>

                    <Text
                      sx={{
                        color: "fg.muted",
                        flexShrink: 0,
                      }}
                    >
                      #{issue.number}
                    </Text>
                  </div>

                  {/* Metadata */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Repository */}
                    <Label variant="secondary">
                      {issue.repository.fullName}
                    </Label>

                    {/* Labels */}
                    {issue.labels?.map((label) => (
                      <Label key={label.id}>{label.name}</Label>
                    ))}

                    {/* Date */}
                    <Text
                      sx={{
                        color: "fg.muted",
                        fontSize: 0,
                      }}
                    >
                      opened {formatDate(issue.createdAt)}
                    </Text>

                    {/* Comments */}
                    {issue.comments > 0 && (
                      <Text
                        sx={{
                          color: "fg.muted",
                          fontSize: 0,
                        }}
                      >
                        💬 {issue.comments}
                      </Text>
                    )}
                  </div>
                </div>

                {/* Author */}
                {issue.author && (
                  <div
                    style={{
                      flexShrink: 0,
                    }}
                  >
                    <Avatar
                      src={issue.author.avatarUrl}
                      alt={issue.author.login}
                      size={28}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && issues.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <Button disabled={page <= 1} onClick={() => changePage(page - 1)}>
            Previous
          </Button>

          <Text
            sx={{
              color: "fg.muted",
              minWidth: 70,
              textAlign: "center",
            }}
          >
            Page {page}
          </Text>

          <Button
            variant="primary"
            disabled={!pagination.hasNextPage}
            onClick={() => changePage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialog: Add to Board */}
      {isAddToBoardOpen && (
        <Dialog
          title="Add Issues to Board"
          onClose={() => {
            if (!addingToBoard) setIsAddToBoardOpen(false);
          }}
          width="medium"
        >
          {loadingBoards ? (
            <div
              style={{
                padding: "32px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Spinner size="small" />
              <Text style={{ color: "var(--fgColor-muted)" }}>
                Loading project boards...
              </Text>
            </div>
          ) : boards.length === 0 ? (
            <div style={{ padding: "20px" }}>
              <Flash variant="warning" style={{ marginBottom: "16px" }}>
                No boards found in this project. Please create a board first in
                the <strong>Board</strong> tab.
              </Flash>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button onClick={() => setIsAddToBoardOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitAddToBoard}>
              <div
                style={{
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {addToBoardError && (
                  <Flash variant="danger">{addToBoardError}</Flash>
                )}

                <Text as="p" style={{ margin: 0, fontSize: "14px" }}>
                  Adding <strong>{selectedIssues.length}</strong> selected
                  issue(s) to a board column.
                </Text>

                {/* Board Selector */}
                <div>
                  <Text
                    as="label"
                    htmlFor="select-board"
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Select Board
                  </Text>
                  <Select
                    id="select-board"
                    block
                    value={targetBoardId}
                    onChange={(e) => handleBoardChange(e.target.value)}
                  >
                    {boards.map((b) => (
                      <Select.Option key={b.id} value={b.id}>
                        {b.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                {/* Section / Column Selector */}
                <div>
                  <Text
                    as="label"
                    htmlFor="select-section"
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Select Section / Column
                  </Text>
                  {targetSections.length === 0 ? (
                    <Text
                      style={{
                        color: "var(--fgColor-muted)",
                        fontSize: "13px",
                      }}
                    >
                      This board has no sections.
                    </Text>
                  ) : (
                    <Select
                      id="select-section"
                      block
                      value={targetSectionId}
                      onChange={(e) => setTargetSectionId(e.target.value)}
                    >
                      {targetSections.map((s) => (
                        <Select.Option key={s.id} value={s.id}>
                          {s.name}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </div>
              </div>

              {/* Dialog Footer Actions */}
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
                  onClick={() => setIsAddToBoardOpen(false)}
                  disabled={addingToBoard}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={addingToBoard}
                  disabled={!targetSectionId || addingToBoard}
                >
                  Add to Board
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </div>
  );
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
