import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devhub_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let session;

    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { message: "GitHub account not connected" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);

    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      100,
    );

    const status = searchParams.get("status") || "open";
    const repoFilter = searchParams.get("repo");

    if (!["open", "closed", "all"].includes(status)) {
      return NextResponse.json(
        {
          message: "Invalid status. Use open, closed, or all.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 4. Check project membership
    // --------------------------------------------------

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
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // 5. Get project repositories
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 6. Optional repository filter
    // --------------------------------------------------

    const selectedRepositories = repoFilter
      ? repositories.filter((repository) => repository.fullName === repoFilter)
      : repositories;

    if (repoFilter && selectedRepositories.length === 0) {
      return NextResponse.json(
        {
          message: "Repository not found in this project.",
        },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // 7. Fetch issues from all repositories
    // --------------------------------------------------

    const repositoryResults = await Promise.all(
      selectedRepositories.map(async (repository) => {
        const allIssues = [];

        let githubPage = 1;

        /*
         * Fetch GitHub pages until there are no more.
         *
         * We use GitHub pagination independently from
         * DevHub pagination.
         */
        while (true) {
          const githubUrl = new URL(
            `https://api.github.com/repos/${repository.owner}/${repository.name}/issues`,
          );

          githubUrl.searchParams.set("state", status);

          githubUrl.searchParams.set("page", githubPage.toString());

          // Fetch 100 GitHub items at a time.
          githubUrl.searchParams.set("per_page", "100");

          const response = await fetch(githubUrl.toString(), {
            headers: {
              Authorization: `Bearer ${githubAccessToken}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "DevHub-App",
            },
            cache: "no-store",
          });

          if (!response.ok) {
            const errorBody = await response.text();

            console.error(
              `GitHub API error for ${repository.fullName}:`,
              response.status,
              errorBody,
            );

            return {
              repository,
              issues: [],
            };
          }

          const githubIssues = await response.json();

          /*
           * GitHub's Issues API also returns Pull Requests.
           * Remove them.
           */
          const actualIssues = githubIssues.filter(
            (issue) => !issue.pull_request,
          );

          allIssues.push(...actualIssues);

          /*
           * Less than 100 means this was the
           * last GitHub page.
           */
          if (githubIssues.length < 100) {
            break;
          }

          githubPage++;
        }

        return {
          repository,
          issues: allIssues,
        };
      }),
    );

    // --------------------------------------------------
    // 8. Combine all repositories
    // --------------------------------------------------

    const allIssues = repositoryResults.flatMap(({ repository, issues }) =>
      issues.map((issue) => ({
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
      })),
    );

    // --------------------------------------------------
    // 9. Sort globally
    // --------------------------------------------------

    allIssues.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    // --------------------------------------------------
    // 10. Global DevHub pagination
    // --------------------------------------------------

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const issues = allIssues.slice(startIndex, endIndex);

    const hasNextPage = endIndex < allIssues.length;

    // --------------------------------------------------
    // 11. Response
    // --------------------------------------------------

    return NextResponse.json({
      issues,

      pagination: {
        page,
        limit,
        total: allIssues.length,
        hasNextPage,
      },
    });
  } catch (error) {
    console.error("Get project issues error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch project issues",
      },
      { status: 500 },
    );
  }
}
