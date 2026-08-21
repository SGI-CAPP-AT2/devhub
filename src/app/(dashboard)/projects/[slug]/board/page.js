"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  KebabHorizontalIcon,
  PlusIcon,
  ProjectIcon,
} from "@primer/octicons-react";
import {
  ActionList,
  ActionMenu,
  Button,
  Dialog,
  Flash,
  IconButton,
  Label,
  Spinner,
  Text,
  TextInput,
} from "@primer/react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./board.module.css";

export default function ProjectBoardPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  // Board state
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [boardData, setBoardData] = useState(null);

  // Status state
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Dialog states - Boards
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);

  const [isRenameBoardOpen, setIsRenameBoardOpen] = useState(false);
  const [renameBoardName, setRenameBoardName] = useState("");
  const [renamingBoard, setRenamingBoard] = useState(false);

  const [isDeleteBoardOpen, setIsDeleteBoardOpen] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);

  // Dialog states - Sections
  const [isAddSectionActive, setIsAddSectionActive] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);

  const [renamingSectionId, setRenamingSectionId] = useState(null);
  const [renamingSectionName, setRenamingSectionName] = useState("");
  const [renamingSection, setRenamingSection] = useState(false);

  const [deletingSectionId, setDeletingSectionId] = useState(null);
  const [deletingSection, setDeletingSection] = useState(false);

  // 1. Load project boards
  const loadBoards = useCallback(
    async (keepSelectedId = null) => {
      if (!slug) return;
      try {
        setError("");
        const response = await fetch(`/api/projects/${slug}/boards`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to load project boards.");
        }
        const data = await response.json();
        const boardList = data.boards || [];
        setBoards(boardList);

        if (boardList.length > 0) {
          if (
            keepSelectedId &&
            boardList.some((b) => b.id === keepSelectedId)
          ) {
            setSelectedBoardId(keepSelectedId);
          } else if (
            !selectedBoardId ||
            !boardList.some((b) => b.id === selectedBoardId)
          ) {
            setSelectedBoardId(boardList[0].id);
          }
        } else {
          setSelectedBoardId(null);
          setBoardData(null);
        }
      } catch (err) {
        console.error("Error fetching boards:", err);
        setError(err.message || "Failed to load boards");
      } finally {
        setLoading(false);
      }
    },
    [slug, selectedBoardId],
  );

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // 2. Load active board details
  const loadActiveBoard = useCallback(async () => {
    if (!slug || !selectedBoardId) {
      setBoardData(null);
      return;
    }
    try {
      setBoardLoading(true);
      setError("");
      const response = await fetch(
        `/api/projects/${slug}/boards/${selectedBoardId}`,
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to load board details.");
      }
      const data = await response.json();
      setBoardData(data.board || null);
    } catch (err) {
      console.error("Error loading board details:", err);
      setError(err.message || "Failed to load board details.");
    } finally {
      setBoardLoading(false);
    }
  }, [slug, selectedBoardId]);

  useEffect(() => {
    loadActiveBoard();
  }, [loadActiveBoard]);

  // Create Board
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      setCreatingBoard(true);
      setError("");
      const response = await fetch(`/api/projects/${slug}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create board.");
      }

      setNewBoardName("");
      setIsCreateBoardOpen(false);
      setFeedbackMsg("Board created successfully!");
      setTimeout(() => setFeedbackMsg(""), 4000);
      await loadBoards(data.board?.id);
    } catch (err) {
      console.error("Create board error:", err);
      setError(err.message);
    } finally {
      setCreatingBoard(false);
    }
  };

  // Rename Board
  const handleRenameBoard = async (e) => {
    e.preventDefault();
    if (!renameBoardName.trim() || !selectedBoardId) return;

    try {
      setRenamingBoard(true);
      setError("");
      const response = await fetch(
        `/api/projects/${slug}/boards/${selectedBoardId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: renameBoardName.trim() }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to rename board.");
      }

      setIsRenameBoardOpen(false);
      setFeedbackMsg("Board renamed successfully!");
      setTimeout(() => setFeedbackMsg(""), 4000);
      await loadBoards(selectedBoardId);
      await loadActiveBoard();
    } catch (err) {
      console.error("Rename board error:", err);
      setError(err.message);
    } finally {
      setRenamingBoard(false);
    }
  };

  // Delete Board
  const handleDeleteBoard = async () => {
    if (!selectedBoardId) return;

    try {
      setDeletingBoard(true);
      setError("");
      const response = await fetch(
        `/api/projects/${slug}/boards/${selectedBoardId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete board.");
      }

      setIsDeleteBoardOpen(false);
      setFeedbackMsg("Board deleted successfully!");
      setTimeout(() => setFeedbackMsg(""), 4000);
      await loadBoards();
    } catch (err) {
      console.error("Delete board error:", err);
      setError(err.message);
    } finally {
      setDeletingBoard(false);
    }
  };

  // Create Section
  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim() || !selectedBoardId) return;

    try {
      setCreatingSection(true);
      setError("");
      const response = await fetch(
        `/api/projects/${slug}/boards/${selectedBoardId}/sections`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newSectionName.trim() }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create section.");
      }

      setNewSectionName("");
      setIsAddSectionActive(false);
      await loadActiveBoard();
    } catch (err) {
      console.error("Create section error:", err);
      setError(err.message);
    } finally {
      setCreatingSection(false);
    }
  };

  // Rename Section
  const handleRenameSection = async (e) => {
    e.preventDefault();
    if (!renamingSectionName.trim() || !renamingSectionId || !selectedBoardId)
      return;

    try {
      setRenamingSection(true);
      setError("");
      const response = await fetch(
        `/api/projects/${slug}/boards/${selectedBoardId}/sections/${renamingSectionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: renamingSectionName.trim() }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to rename section.");
      }

      setRenamingSectionId(null);
      setRenamingSectionName("");
      await loadActiveBoard();
    } catch (err) {
      console.error("Rename section error:", err);
      setError(err.message);
    } finally {
      setRenamingSection(false);
    }
  };

  // Reorder Section (Move left/right)
  const handleMoveSection = async (sectionId, currentPosition, direction) => {
    if (!selectedBoardId || !boardData?.sections) return;

    const newPosition =
      direction === "left" ? currentPosition - 1 : currentPosition + 1;
    if (newPosition < 0 || newPosition >= boardData.sections.length) return;

    try {
      setError("");
      // Optimistic update
      const updatedSections = [...boardData.sections];
      const targetIdx = updatedSections.findIndex((s) => s.id === sectionId);
      if (targetIdx !== -1) {
        const otherIdx = updatedSections.findIndex(
          (s) => s.position === newPosition,
        );
        if (otherIdx !== -1) {
          updatedSections[targetIdx].position = newPosition;
          updatedSections[otherIdx].position = currentPosition;
          updatedSections.sort((a, b) => a.position - b.position);
          setBoardData({ ...boardData, sections: updatedSections });
        }
      }

      const response = await fetch(
        `/api/projects/${slug}/boards/${selectedBoardId}/sections/${sectionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: newPosition }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reorder section.");
      }

      await loadActiveBoard();
    } catch (err) {
      console.error("Reorder section error:", err);
      setError(err.message);
      await loadActiveBoard();
    }
  };

  // Drag and Drop state
  const [draggingIssueId, setDraggingIssueId] = useState(null);
  const [dropTargetSectionId, setDropTargetSectionId] = useState(null);

  // Drag handlers
  const handleDragStart = (e, issue, fromSectionId) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        issueId: issue.id,
        fromSectionId,
      }),
    );
    e.dataTransfer.effectAllowed = "move";
    setDraggingIssueId(issue.id);
  };

  const handleDragEnd = () => {
    setDraggingIssueId(null);
    setDropTargetSectionId(null);
  };

  const handleDragOver = (e, sectionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTargetSectionId !== sectionId) {
      setDropTargetSectionId(sectionId);
    }
  };

  const handleDragLeave = (e, sectionId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dropTargetSectionId === sectionId) {
      setDropTargetSectionId(null);
    }
  };

  const handleDrop = async (e, toSectionId) => {
    e.preventDefault();
    setDropTargetSectionId(null);
    setDraggingIssueId(null);

    const rawData = e.dataTransfer.getData("application/json");
    if (!rawData) return;

    try {
      const { issueId, fromSectionId } = JSON.parse(rawData);
      if (!issueId || !fromSectionId || fromSectionId === toSectionId) return;

      // Find the issue to move
      const fromSection = boardData?.sections?.find(
        (s) => s.id === fromSectionId,
      );
      const movingIssue = fromSection?.issues?.find((i) => i.id === issueId);
      if (!movingIssue) return;

      // Optimistic update
      const updatedSections = boardData.sections.map((section) => {
        if (section.id === fromSectionId) {
          return {
            ...section,
            issues: (section.issues || []).filter((i) => i.id !== issueId),
          };
        }
        if (section.id === toSectionId) {
          return {
            ...section,
            issues: [
              ...(section.issues || []),
              { ...movingIssue, sectionId: toSectionId },
            ],
          };
        }
        return section;
      });

      setBoardData({
        ...boardData,
        sections: updatedSections,
      });

      // API call to move issue
      const response = await fetch(`/api/projects/${slug}/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: toSectionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to move issue.");
      }
    } catch (err) {
      console.error("Drop issue error:", err);
      setError(err.message || "Failed to move issue.");
      await loadActiveBoard();
    }
  };

  // Delete Section
  const handleDeleteSection = async () => {
    if (!deletingSectionId || !selectedBoardId) return;

    try {
      setDeletingSection(true);
      setError("");
      const response = await fetch(
        `/api/projects/${slug}/boards/${selectedBoardId}/sections/${deletingSectionId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete section.");
      }

      setDeletingSectionId(null);
      await loadActiveBoard();
    } catch (err) {
      console.error("Delete section error:", err);
      setError(err.message);
    } finally {
      setDeletingSection(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "48px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Spinner size="medium" />
        <Text style={{ color: "var(--fgColor-muted)" }}>Loading board...</Text>
      </div>
    );
  }

  const currentBoard = boards.find((b) => b.id === selectedBoardId);
  const sections = boardData?.sections || [];

  return (
    <div className={styles.container}>
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
      {feedbackMsg && (
        <Flash
          variant="success"
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{feedbackMsg}</span>
          <Button
            size="small"
            variant="invisible"
            onClick={() => setFeedbackMsg("")}
          >
            Dismiss
          </Button>
        </Flash>
      )}

      {/* Top Header / Board Switcher Bar */}
      <div className={styles.topBar}>
        <div className={styles.boardSelectorWrapper}>
          <div className={styles.boardTitle}>
            <ProjectIcon size={20} style={{ color: "var(--fgColor-accent)" }} />
            <span>{currentBoard ? currentBoard.name : "Boards"}</span>
          </div>

          {currentBoard && (
            <ActionMenu>
              <ActionMenu.Anchor>
                <IconButton
                  icon={KebabHorizontalIcon}
                  aria-label="Board options"
                  size="small"
                  variant="invisible"
                />
              </ActionMenu.Anchor>
              <ActionMenu.Overlay width="small">
                <ActionList>
                  <ActionList.Item
                    onSelect={() => {
                      setRenameBoardName(currentBoard.name);
                      setIsRenameBoardOpen(true);
                    }}
                  >
                    Rename board
                  </ActionList.Item>
                  <ActionList.Divider />
                  <ActionList.Item
                    variant="danger"
                    onSelect={() => setIsDeleteBoardOpen(true)}
                  >
                    Delete board
                  </ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            variant="primary"
            size="small"
            leadingVisual={PlusIcon}
            onClick={() => setIsCreateBoardOpen(true)}
          >
            New Board
          </Button>

          {boards.length > 0 && (
            <ActionMenu>
              <ActionMenu.Button size="small">
                Switch Board ({boards.length})
              </ActionMenu.Button>
              <ActionMenu.Overlay width="medium">
                <ActionList selectionVariant="radio">
                  {boards.map((b) => (
                    <ActionList.Item
                      key={b.id}
                      selected={b.id === selectedBoardId}
                      onSelect={() => setSelectedBoardId(b.id)}
                    >
                      {b.name}
                    </ActionList.Item>
                  ))}
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
          )}
        </div>
      </div>

      {/* Main Board View Area */}
      {boards.length === 0 ? (
        <div
          style={{
            padding: "48px 16px",
            textAlign: "center",
            border: "1px dashed var(--borderColor-default)",
            borderRadius: "8px",
            backgroundColor: "var(--bgColor-muted)",
          }}
        >
          <ProjectIcon
            size={36}
            style={{ color: "var(--fgColor-muted)", marginBottom: "12px" }}
          />
          <Text
            as="h3"
            style={{
              fontSize: "16px",
              fontWeight: 600,
              margin: 0,
              marginBottom: "6px",
            }}
          >
            No boards found for this project
          </Text>
          <Text
            as="p"
            style={{
              color: "var(--fgColor-muted)",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            Get started by creating your first board to organize tasks and
            issues.
          </Text>
          <Button
            variant="primary"
            leadingVisual={PlusIcon}
            onClick={() => setIsCreateBoardOpen(true)}
          >
            Create Board
          </Button>
        </div>
      ) : boardLoading ? (
        <div
          style={{
            padding: "48px 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Spinner size="small" />
          <Text style={{ color: "var(--fgColor-muted)" }}>
            Loading board sections...
          </Text>
        </div>
      ) : (
        <div className={styles.boardCanvas}>
          {/* Columns / Sections */}
          {sections.map((section, index) => {
            const issues = section.issues || [];
            const isFirst = index === 0;
            const isLast = index === sections.length - 1;
            const isDropTarget = dropTargetSectionId === section.id;

            return (
              <div key={section.id} className={styles.column}>
                {/* Column Header */}
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitleArea}>
                    <span className={styles.columnTitle} title={section.name}>
                      {section.name}
                    </span>
                    <Label size="small" variant="secondary">
                      {issues.length}
                    </Label>
                  </div>

                  <div className={styles.columnActions}>
                    <IconButton
                      icon={ArrowLeftIcon}
                      aria-label="Move left"
                      size="small"
                      variant="invisible"
                      disabled={isFirst}
                      onClick={() =>
                        handleMoveSection(section.id, section.position, "left")
                      }
                    />
                    <IconButton
                      icon={ArrowRightIcon}
                      aria-label="Move right"
                      size="small"
                      variant="invisible"
                      disabled={isLast}
                      onClick={() =>
                        handleMoveSection(section.id, section.position, "right")
                      }
                    />
                    <ActionMenu>
                      <ActionMenu.Anchor>
                        <IconButton
                          icon={KebabHorizontalIcon}
                          aria-label={`Options for ${section.name}`}
                          size="small"
                          variant="invisible"
                        />
                      </ActionMenu.Anchor>
                      <ActionMenu.Overlay width="small">
                        <ActionList>
                          <ActionList.Item
                            onSelect={() => {
                              setRenamingSectionId(section.id);
                              setRenamingSectionName(section.name);
                            }}
                          >
                            Rename section
                          </ActionList.Item>
                          <ActionList.Divider />
                          <ActionList.Item
                            variant="danger"
                            onSelect={() => setDeletingSectionId(section.id)}
                          >
                            Delete section
                          </ActionList.Item>
                        </ActionList>
                      </ActionMenu.Overlay>
                    </ActionMenu>
                  </div>
                </div>

                {/* Column Body / Droppable Issue Area */}
                <div
                  className={`${styles.columnBody} ${
                    isDropTarget ? styles.columnBodyDropTarget : ""
                  }`}
                  onDragOver={(e) => handleDragOver(e, section.id)}
                  onDragEnter={(e) => handleDragOver(e, section.id)}
                  onDragLeave={(e) => handleDragLeave(e, section.id)}
                  onDrop={(e) => handleDrop(e, section.id)}
                >
                  {issues.length === 0 ? (
                    <div className={styles.emptyColumn}>
                      <span>No issues in this section</span>
                    </div>
                  ) : (
                    issues.map((issue) => (
                      <div
                        key={issue.id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, issue, section.id)
                        }
                        onDragEnd={handleDragEnd}
                        className={`${styles.issueCard} ${
                          draggingIssueId === issue.id
                            ? styles.issueCardDragging
                            : ""
                        }`}
                      >
                        <div className={styles.issueHeader}>
                          <span className={styles.issueTitle}>
                            {issue.title}
                          </span>
                        </div>
                        {issue.description && (
                          <Text
                            as="p"
                            style={{
                              color: "var(--fgColor-muted)",
                              fontSize: "12px",
                              margin: "4px 0 8px 0",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {issue.description}
                          </Text>
                        )}
                        <div className={styles.issueMeta}>
                          <span>
                            Created{" "}
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Section Column */}
          <div className={styles.addSectionColumn}>
            {isAddSectionActive ? (
              <form onSubmit={handleCreateSection}>
                <TextInput
                  block
                  autoFocus
                  placeholder="Section title..."
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  style={{ marginBottom: "8px" }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    size="small"
                    type="button"
                    onClick={() => {
                      setIsAddSectionActive(false);
                      setNewSectionName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="primary"
                    type="submit"
                    loading={creatingSection}
                  >
                    Add
                  </Button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className={styles.addSectionButton}
                onClick={() => setIsAddSectionActive(true)}
              >
                <PlusIcon size={16} />
                <span>Add Section</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dialog: Create Board */}
      {isCreateBoardOpen && (
        <Dialog
          title="Create New Board"
          onClose={() => {
            if (!creatingBoard) setIsCreateBoardOpen(false);
          }}
          width="medium"
        >
          <form onSubmit={handleCreateBoard}>
            <div style={{ padding: "16px" }}>
              <Text
                as="label"
                htmlFor="board-name-input"
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Board Name
              </Text>
              <TextInput
                id="board-name-input"
                block
                placeholder="e.g. Sprint Board, Backlog"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                autoFocus
              />
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
              <Button
                type="button"
                onClick={() => setIsCreateBoardOpen(false)}
                disabled={creatingBoard}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={creatingBoard}
                disabled={!newBoardName.trim()}
              >
                Create Board
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Dialog: Rename Board */}
      {isRenameBoardOpen && (
        <Dialog
          title="Rename Board"
          onClose={() => {
            if (!renamingBoard) setIsRenameBoardOpen(false);
          }}
          width="medium"
        >
          <form onSubmit={handleRenameBoard}>
            <div style={{ padding: "16px" }}>
              <Text
                as="label"
                htmlFor="rename-board-input"
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Board Name
              </Text>
              <TextInput
                id="rename-board-input"
                block
                value={renameBoardName}
                onChange={(e) => setRenameBoardName(e.target.value)}
                autoFocus
              />
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
              <Button
                type="button"
                onClick={() => setIsRenameBoardOpen(false)}
                disabled={renamingBoard}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={renamingBoard}
                disabled={!renameBoardName.trim()}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Dialog: Delete Board Confirmation */}
      {isDeleteBoardOpen && (
        <Dialog
          title="Delete Board"
          onClose={() => {
            if (!deletingBoard) setIsDeleteBoardOpen(false);
          }}
          width="medium"
        >
          <div style={{ padding: "16px" }}>
            <Text as="p" style={{ margin: 0, fontSize: "14px" }}>
              Are you sure you want to delete board{" "}
              <strong>"{currentBoard?.name}"</strong>? All sections and tasks
              within this board will also be permanently deleted.
            </Text>
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
            <Button
              type="button"
              onClick={() => setIsDeleteBoardOpen(false)}
              disabled={deletingBoard}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deletingBoard}
              onClick={handleDeleteBoard}
            >
              Delete Board
            </Button>
          </div>
        </Dialog>
      )}

      {/* Dialog: Rename Section */}
      {Boolean(renamingSectionId) && (
        <Dialog
          title="Rename Section"
          onClose={() => {
            if (!renamingSection) setRenamingSectionId(null);
          }}
          width="medium"
        >
          <form onSubmit={handleRenameSection}>
            <div style={{ padding: "16px" }}>
              <Text
                as="label"
                htmlFor="rename-section-input"
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Section Name
              </Text>
              <TextInput
                id="rename-section-input"
                block
                value={renamingSectionName}
                onChange={(e) => setRenamingSectionName(e.target.value)}
                autoFocus
              />
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
              <Button
                type="button"
                onClick={() => setRenamingSectionId(null)}
                disabled={renamingSection}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={renamingSection}
                disabled={!renamingSectionName.trim()}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Dialog: Delete Section Confirmation */}
      {Boolean(deletingSectionId) && (
        <Dialog
          title="Delete Section"
          onClose={() => {
            if (!deletingSection) setDeletingSectionId(null);
          }}
          width="medium"
        >
          <div style={{ padding: "16px" }}>
            <Text as="p" style={{ margin: 0, fontSize: "14px" }}>
              Are you sure you want to delete this section? All issues in this
              section will also be removed.
            </Text>
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
            <Button
              type="button"
              onClick={() => setDeletingSectionId(null)}
              disabled={deletingSection}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deletingSection}
              onClick={handleDeleteSection}
            >
              Delete Section
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
