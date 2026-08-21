import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { slug, boardId } = await params;

    // Check session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devhub_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!session.userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Find project
    const project = await db.project.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check project membership
    const membership = await db.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.userId,
          projectId: project.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 },
      );
    }

    // Verify board exists in this project
    const board = await db.board.findFirst({
      where: {
        id: boardId,
        projectId: project.id,
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Get sections
    const sections = await db.boardSection.findMany({
      where: {
        boardId,
      },
      orderBy: {
        position: "asc",
      },
      include: {
        issues: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      sections,
    });
  } catch (error) {
    console.error("GET /boards/[boardId]/sections error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { slug, boardId } = await params;

    // Check session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devhub_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!session.userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Section name is required" },
        { status: 400 },
      );
    }

    // Find project
    const project = await db.project.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check project membership
    const membership = await db.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.userId,
          projectId: project.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 },
      );
    }

    // Only OWNER and ADMIN can create sections
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have permission to create a section" },
        { status: 403 },
      );
    }

    // Verify board exists in this project
    const board = await db.board.findFirst({
      where: {
        id: boardId,
        projectId: project.id,
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Determine position
    let targetPosition;
    if (
      typeof body.position === "number" &&
      !isNaN(body.position) &&
      body.position >= 0
    ) {
      targetPosition = Math.floor(body.position);
      // Shift existing sections at targetPosition or higher
      await db.boardSection.updateMany({
        where: {
          boardId,
          position: {
            gte: targetPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    } else {
      const lastSection = await db.boardSection.findFirst({
        where: {
          boardId,
        },
        orderBy: {
          position: "desc",
        },
        select: {
          position: true,
        },
      });
      targetPosition = lastSection ? lastSection.position + 1 : 0;
    }

    const section = await db.boardSection.create({
      data: {
        boardId,
        name,
        position: targetPosition,
      },
      include: {
        issues: true,
      },
    });

    return NextResponse.json(
      {
        message: "Section created successfully",
        section,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /boards/[boardId]/sections error:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 },
    );
  }
}
