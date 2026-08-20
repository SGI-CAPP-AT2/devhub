import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devhub_session");

    let userId = null;
    let username = "developer";

    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        userId = session.userId;
        username = session.username || "developer";
      } catch (_error) {
        // Invalid session JSON
      }
    }

    let githubAccessToken = null;

    if (userId) {
      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          githubAccessToken: true,
          username: true,
        },
      });

      if (dbUser?.githubAccessToken) {
        githubAccessToken = dbUser.githubAccessToken;
      }

      if (dbUser?.username) {
        username = dbUser.username;
      }
    }

    // Fetch user's actual repositories from GitHub API
    if (githubAccessToken) {
      try {
        const ghResponse = await fetch(
          "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator",
          {
            headers: {
              Authorization: `Bearer ${githubAccessToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "DevHub-App",
            },
            next: { revalidate: 10 },
          },
        );

        if (ghResponse.ok) {
          const liveRepos = await ghResponse.json();

          const repos = liveRepos.map((repo) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: Boolean(repo.private),
            language: repo.language || "Plain Text",
            stargazers_count: repo.stargazers_count || 0,
            forks_count: repo.forks_count || 0,
            updated_at: repo.updated_at,
            html_url: repo.html_url,
            default_branch: repo.default_branch || "main",
          }));

          return NextResponse.json({
            repos,
            source: "live_github_api",
          });
        }

        console.warn("GitHub API error status:", ghResponse.status);
      } catch (err) {
        console.error("Failed to fetch live GitHub repos:", err);
      }
    }

    // No fallback/sample repositories
    return NextResponse.json({
      repos: [],
      source: "github_unavailable",
    });
  } catch (error) {
    console.error("Fetch repos error:", error);

    return NextResponse.json(
      { message: "Failed to fetch GitHub repositories" },
      { status: 500 },
    );
  }
}
