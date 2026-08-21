import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

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

    // Get boards
    const boards = await db.board.findMany({
      where: {
        projectId: project.id,
      },
      include: {
        sections: {
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      boards,
    });
  } catch (error) {
    console.error("GET /boards error:", error);

    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params;

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

    // Only OWNER and ADMIN can create boards
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have permission to create a board" },
        { status: 403 },
      );
    }

    // Create board with default sections
    const board = await db.board.create({
      data: {
        projectId: project.id,
        name,

        sections: {
          create: [
            {
              name: "Reported",
              position: 0,
            },
            {
              name: "In Progress",
              position: 1,
            },
            {
              name: "Done",
              position: 2,
            },
          ],
        },
      },

      include: {
        sections: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Board created successfully",
        board,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /boards error:", error);

    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 },
    );
  }
}
