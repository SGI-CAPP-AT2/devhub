import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function getProjectIssues({
  slug,
  page = 1,
  limit = 20,
  status = "open",
  repo,
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("devhub_session");

  if (!sessionCookie?.value) {
    throw new Error("Unauthorized");
  }

  let session;

  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    throw new Error("Unauthorized");
  }

  if (!session.userId) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      githubAccessToken: true,
    },
  });

  const githubAccessToken = dbUser?.githubAccessToken;

  if (!githubAccessToken) {
    throw new Error("Unauthorized");
  }

  // Get project
  const membership = await db.projectMember.findFirst({
    where: {
      userId: session.userId,
      project: {
        slug,
      },
    },
    select: {
      projectId: true,
    },
  });

  if (!membership) {
    throw new Error("Project not found");
  }

  const repositories = await db.gitHubRepository.findMany({
    where: {
      projectId: membership.projectId,
    },
    select: {
      id: true,
      owner: true,
      name: true,
      fullName: true,
    },
  });

  const selectedRepositories = repo
    ? repositories.filter((repository) => repository.fullName === repo)
    : repositories;

  /*
   * --------------------------------------------------
   * Fetch issues from all repositories
   * --------------------------------------------------
   *
   * We fetch GitHub pages independently for every repo.
   * We don't use the DevHub `page` here.
   *
   * Then we combine everything and paginate globally.
   */

  const results = await Promise.all(
    selectedRepositories.map(async (repository) => {
      const allIssues = [];

      let githubPage = 1;

      while (githubPage <= 10) {
        const url = new URL(
          `https://api.github.com/repos/${repository.owner}/${repository.name}/issues`,
        );

        url.searchParams.set("state", status);
        url.searchParams.set("page", String(githubPage));
        url.searchParams.set("per_page", "100");

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${githubAccessToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "DevHub-App",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const errorBody = await response.text();

          console.error(
            `GitHub error ${repository.fullName}:`,
            response.status,
            errorBody,
          );

          break;
        }

        const githubIssues = await response.json();

        /*
         * GitHub's Issues API also returns Pull Requests.
         * Remove them before pagination.
         */
        const issues = githubIssues
          .filter((issue) => !issue.pull_request)
          .map((issue) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            url: issue.html_url,

            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            closedAt: issue.closed_at,

            author: issue.user
              ? {
                  login: issue.user.login,
                  avatarUrl: issue.user.avatar_url,
                }
              : null,

            labels: Array.isArray(issue.labels)
              ? issue.labels.map((label) => ({
                  id: label.id,
                  name: label.name,
                  color: label.color,
                }))
              : [],

            assignees: Array.isArray(issue.assignees)
              ? issue.assignees.map((user) => ({
                  login: user.login,
                  avatarUrl: user.avatar_url,
                }))
              : [],

            comments: issue.comments || 0,

            repository: {
              id: repository.id,
              name: repository.name,
              fullName: repository.fullName,
            },
          }));

        allIssues.push(...issues);

        /*
         * GitHub returned less than 100 items.
         * There are no more pages.
         */
        if (githubIssues.length < 100) {
          break;
        }

        githubPage++;
      }

      return allIssues;
    }),
  );

  const allIssues = results.flat();

  allIssues.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const start = (page - 1) * limit;
  const end = start + limit;

  const issues = allIssues.slice(start, end);

  const hasNextPage = end < allIssues.length;

  return {
    issues,

    pagination: {
      page,
      limit,
      total: allIssues.length,
      hasNextPage,
    },
  };
}
