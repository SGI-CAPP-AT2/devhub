import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const { slug, boardId, sectionId } = await params;

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

    // Only OWNER and ADMIN can update sections
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have permission to update this section" },
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

    // Verify section exists in this board
    const currentSection = await db.boardSection.findFirst({
      where: {
        id: sectionId,
        boardId,
      },
    });

    if (!currentSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Parse body
    const body = await request.json();
    const hasName = typeof body.name === "string";
    const newName = hasName ? body.name.trim() : null;

    if (hasName && !newName) {
      return NextResponse.json(
        { error: "Section name cannot be empty" },
        { status: 400 },
      );
    }

    const hasPosition =
      typeof body.position === "number" &&
      !isNaN(body.position) &&
      body.position >= 0;

    if (!hasName && !hasPosition) {
      return NextResponse.json(
        { error: "Nothing to update. Provide name or position." },
        { status: 400 },
      );
    }

    // If reordering position
    if (hasPosition) {
      const allSections = await db.boardSection.findMany({
        where: {
          boardId,
        },
        orderBy: {
          position: "asc",
        },
      });

      const currentIdx = allSections.findIndex((s) => s.id === sectionId);
      if (currentIdx !== -1) {
        const [movedSection] = allSections.splice(currentIdx, 1);
        const targetIdx = Math.max(
          0,
          Math.min(Math.floor(body.position), allSections.length),
        );
        allSections.splice(targetIdx, 0, movedSection);

        await db.$transaction(
          allSections.map((s, index) =>
            db.boardSection.update({
              where: {
                id: s.id,
              },
              data: {
                position: index,
                ...(s.id === sectionId && hasName ? { name: newName } : {}),
              },
            }),
          ),
        );
      }
    } else if (hasName) {
      await db.boardSection.update({
        where: {
          id: sectionId,
        },
        data: {
          name: newName,
        },
      });
    }

    // Fetch updated section
    const updatedSection = await db.boardSection.findUnique({
      where: {
        id: sectionId,
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
      message: "Section updated successfully",
      section: updatedSection,
    });
  } catch (error) {
    console.error("PATCH /boards/[boardId]/sections/[sectionId] error:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug, boardId, sectionId } = await params;

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

    // Only OWNER and ADMIN can delete sections
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have permission to delete this section" },
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

    // Verify section exists
    const section = await db.boardSection.findFirst({
      where: {
        id: sectionId,
        boardId,
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Delete section (issues cascade deleted)
    await db.boardSection.delete({
      where: {
        id: sectionId,
      },
    });

    // Re-index remaining sections cleanly
    const remainingSections = await db.boardSection.findMany({
      where: {
        boardId,
      },
      orderBy: {
        position: "asc",
      },
    });

    if (remainingSections.length > 0) {
      await db.$transaction(
        remainingSections.map((s, index) =>
          db.boardSection.update({
            where: {
              id: s.id,
            },
            data: {
              position: index,
            },
          }),
        ),
      );
    }

    return NextResponse.json({
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /boards/[boardId]/sections/[sectionId] error:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 },
    );
  }
}
