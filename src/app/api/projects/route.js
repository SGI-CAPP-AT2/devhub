import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devhub_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ projects: [] });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ projects: [] });
    }

    // Query projects where user is a member
    const projectMemberships = await db.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            members: {
              select: {
                id: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
            repositories: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projects = projectMemberships.map((membership) => ({
      id: membership.project.id,
      name: membership.project.name,
      slug: membership.project.slug,
      description: membership.project.description,
      status: membership.project.status,
      userRole: membership.role,
      memberCount: membership.project.members.length,
      members: membership.project.members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        name: m.user.name,
        image: m.user.image,
        role: m.role,
      })),
      repoCount: membership.project.repositories.length,
      createdAt: membership.project.createdAt,
    }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Fetch projects error:", error);
    return NextResponse.json(
      { message: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devhub_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, description, repositories = [] } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Project name is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(repositories)) {
      return NextResponse.json(
        { message: "Repositories must be provided as a list." },
        { status: 400 },
      );
    }

    const repositoryData = [];
    const selectedRepositoryIds = new Set();

    for (const repository of repositories) {
      const githubId = String(repository?.id || "");
      const [owner, name] = String(repository?.full_name || "").split("/");

      if (
        !/^\d+$/.test(githubId) ||
        !owner ||
        !name ||
        !String(repository?.html_url || "").startsWith("https://github.com/") ||
        selectedRepositoryIds.has(githubId)
      ) {
        return NextResponse.json(
          { message: "One or more selected repositories are invalid." },
          { status: 400 },
        );
      }

      selectedRepositoryIds.add(githubId);
      repositoryData.push({
        githubId: BigInt(githubId),
        owner,
        name,
        fullName: `${owner}/${name}`,
        description: repository.description || null,
        url: repository.html_url,
        defaultBranch: repository.default_branch || "main",
        isPrivate: Boolean(repository.private),
      });
    }

    const cleanName = name.trim();
    const baseSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create project and assign user as OWNER
    const project = await db.project.create({
      data: {
        name: cleanName,
        slug,
        description: description ? description.trim() : null,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
        repositories: {
          create: repositoryData,
        },
      },
      include: {
        members: true,
        repositories: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          status: project.status,
          userRole: "OWNER",
          memberCount: 1,
          repoCount: project.repositories.length,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create project" },
      { status: 500 },
    );
  }
}
