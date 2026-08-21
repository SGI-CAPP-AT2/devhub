import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devhub_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    if (!session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const membership = await db.projectMember.findFirst({
      where: {
        userId: session.userId,
        project: { slug },
      },
      select: {
        role: true,
        projectId: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    if (membership.role === "MEMBER") {
      return NextResponse.json(
        { message: "Only project owners and admins can add repositories." },
        { status: 403 },
      );
    }

    const { repositories = [] } = await request.json();
    const repositoryData = validateRepositories(repositories);

    if (!repositoryData) {
      return NextResponse.json(
        { message: "One or more selected repositories are invalid." },
        { status: 400 },
      );
    }

    const allRepositories = await db.$transaction(async (transaction) => {
      if (repositoryData.length > 0) {
        await transaction.gitHubRepository.createMany({
          data: repositoryData.map((repository) => ({
            ...repository,
            projectId: membership.projectId,
          })),
          skipDuplicates: true,
        });
      }

      return transaction.gitHubRepository.findMany({
        where: { projectId: membership.projectId },
        select: {
          id: true,
          name: true,
          fullName: true,
          description: true,
          url: true,
          defaultBranch: true,
          isPrivate: true,
        },
        orderBy: { createdAt: "desc" },
      });
    });

    return NextResponse.json({ repositories: allRepositories });
  } catch (error) {
    console.error("Add project repositories error:", error);
    return NextResponse.json(
      { message: "Failed to add repositories" },
      { status: 500 },
    );
  }
}

function validateRepositories(repositories) {
  if (!Array.isArray(repositories)) return null;

  const selectedIds = new Set();
  const parsedRepositories = [];

  for (const repository of repositories) {
    const githubId = String(repository?.id || "");
    const nameParts = String(repository?.full_name || "").split("/");
    const [owner, name] = nameParts;

    if (
      !/^\d+$/.test(githubId) ||
      nameParts.length !== 2 ||
      !owner ||
      !name ||
      !String(repository?.html_url || "").startsWith("https://github.com/") ||
      selectedIds.has(githubId)
    ) {
      return null;
    }

    selectedIds.add(githubId);
    parsedRepositories.push({
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

  return parsedRepositories;
}
