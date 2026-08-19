import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
      } catch (e) {
        // Invalid session JSON
      }
    }

    let githubAccessToken = null;

    if (userId) {
      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: { githubAccessToken: true, username: true },
      });
      if (dbUser?.githubAccessToken) {
        githubAccessToken = dbUser.githubAccessToken;
      }
      if (dbUser?.username) {
        username = dbUser.username;
      }
    }

    // If live GitHub Access Token exists, fetch user's actual repositories directly from GitHub API!
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
          }
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
          }));

          return NextResponse.json({ repos, source: "live_github_api" });
        } else {
          console.warn("GitHub API error status:", ghResponse.status);
        }
      } catch (err) {
        console.error("Failed to fetch live GitHub repos:", err);
      }
    }

    // Fallback sample repositories if user hasn't completed live OAuth authorization yet
    const fallbackRepos = [
      {
        id: 101,
        name: "devhub",
        full_name: `${username}/devhub`,
        description: "Developer collaboration platform built with Next.js, Primer React, and Prisma.",
        private: false,
        language: "JavaScript",
        stargazers_count: 24,
        forks_count: 5,
        updated_at: "2026-08-19T10:30:00Z",
        html_url: `https://github.com/${username}/devhub`,
      },
      {
        id: 102,
        name: "nextjs-dashboard-template",
        full_name: `${username}/nextjs-dashboard-template`,
        description: "Production-ready Next.js 16 starter kit with TailwindCSS and authentication.",
        private: false,
        language: "TypeScript",
        stargazers_count: 89,
        forks_count: 14,
        updated_at: "2026-08-18T14:20:00Z",
        html_url: `https://github.com/${username}/nextjs-dashboard-template`,
      },
      {
        id: 103,
        name: "internal-api-gateway",
        full_name: `${username}/internal-api-gateway`,
        description: "Microservice routing gateway with rate limiting and JWT auth middleware.",
        private: true,
        language: "Go",
        stargazers_count: 12,
        forks_count: 2,
        updated_at: "2026-08-15T09:15:00Z",
        html_url: `https://github.com/${username}/internal-api-gateway`,
      },
      {
        id: 104,
        name: "primer-design-components",
        full_name: `${username}/primer-design-components`,
        description: "Custom UI component library extending GitHub Primer React system.",
        private: false,
        language: "JavaScript",
        stargazers_count: 45,
        forks_count: 8,
        updated_at: "2026-08-12T18:45:00Z",
        html_url: `https://github.com/${username}/primer-design-components`,
      },
      {
        id: 105,
        name: "ai-code-assistant-bot",
        full_name: `${username}/ai-code-assistant-bot`,
        description: "Autonomous GitHub bot for automated PR reviews and refactoring suggestions.",
        private: true,
        language: "Python",
        stargazers_count: 156,
        forks_count: 31,
        updated_at: "2026-08-10T11:00:00Z",
        html_url: `https://github.com/${username}/ai-code-assistant-bot`,
      },
    ];

    return NextResponse.json({ repos: fallbackRepos, source: "sample_fallback" });
  } catch (error) {
    console.error("Fetch repos error:", error);
    return NextResponse.json(
      { message: "Failed to fetch GitHub repositories" },
      { status: 500 }
    );
  }
}
