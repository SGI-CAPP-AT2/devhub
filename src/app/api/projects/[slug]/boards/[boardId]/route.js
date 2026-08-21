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

    // Find board
    const board = await db.board.findFirst({
      where: {
        id: boardId,
        projectId: project.id,
      },
      include: {
        sections: {
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
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({
      board,
    });
  } catch (error) {
    console.error("GET /boards/[boardId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
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
        { error: "Board name is required" },
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

    // Only OWNER and ADMIN can update boards
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have permission to update this board" },
        { status: 403 },
      );
    }

    // Verify board exists in this project
    const existingBoard = await db.board.findFirst({
      where: {
        id: boardId,
        projectId: project.id,
      },
    });

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Update board
    const board = await db.board.update({
      where: {
        id: boardId,
      },
      data: {
        name,
      },
      include: {
        sections: {
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
        },
      },
    });

    return NextResponse.json({
      message: "Board updated successfully",
      board,
    });
  } catch (error) {
    console.error("PATCH /boards/[boardId] error:", error);
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
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

    // Only OWNER and ADMIN can delete boards
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have permission to delete this board" },
        { status: 403 },
      );
    }

    // Verify board exists in this project
    const existingBoard = await db.board.findFirst({
      where: {
        id: boardId,
        projectId: project.id,
      },
    });

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Delete board (sections and issues cascade deleted)
    await db.board.delete({
      where: {
        id: boardId,
      },
    });

    return NextResponse.json({
      message: "Board deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /boards/[boardId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 },
    );
  }
}
