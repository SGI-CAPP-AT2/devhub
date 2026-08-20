"use client";

import { Heading, Text, Label, Avatar, Link, Button } from "@primer/react";
import { IssueOpenedIcon } from "@primer/octicons-react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
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

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "16px",
            marginBottom: "24px",
            border: "1px solid var(--borderColor-danger-muted)",
            borderRadius: "6px",
            color: "var(--fgColor-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Issues */}
      <div
        style={{
          border: "1px solid var(--borderColor-default)",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "80px 32px",
              textAlign: "center",
            }}
          >
            <Text sx={{ color: "fg.muted" }}>Loading issues...</Text>
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
          issues.map((issue) => (
            <div
              key={`${issue.repository.id}-${issue.number}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                padding: "16px",
                borderBottom: "1px solid var(--borderColor-muted)",
              }}
            >
              {/* Issue Icon */}
              <div
                style={{
                  paddingTop: "4px",
                  flexShrink: 0,
                }}
              >
                <IssueOpenedIcon
                  size={16}
                  style={{
                    color: "var(--fgColor-open)",
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
                    marginBottom: "8px",
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
                  <Label variant="secondary">{issue.repository.fullName}</Label>

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
                    size={32}
                  />
                </div>
              )}
            </div>
          ))
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
