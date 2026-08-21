import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const { slug, issueId } = await params;

    // Check session
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
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
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
        { message: "You are not a member of this project" },
        { status: 403 },
      );
    }

    // Find existing issue
    const existingIssue = await db.issue.findFirst({
      where: {
        id: issueId,
        projectId: project.id,
      },
    });

    if (!existingIssue) {
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });
    }

    const body = await request.json();
    const { sectionId, position, title, description } = body;

    const updateData = {};

    if (typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description =
        typeof description === "string" && description.trim()
          ? description.trim()
          : null;
    }

    // Handle section move or position change
    if (sectionId && sectionId !== existingIssue.sectionId) {
      // Verify destination section belongs to this project
      const targetSection = await db.boardSection.findFirst({
        where: {
          id: sectionId,
          board: {
            projectId: project.id,
          },
        },
      });

      if (!targetSection) {
        return NextResponse.json(
          { message: "Target section not found" },
          { status: 404 },
        );
      }

      updateData.sectionId = sectionId;

      if (typeof position === "number" && !isNaN(position) && position >= 0) {
        updateData.position = Math.floor(position);
      } else {
        const lastIssue = await db.issue.findFirst({
          where: {
            sectionId,
          },
          orderBy: {
            position: "desc",
          },
          select: {
            position: true,
          },
        });
        updateData.position = lastIssue ? lastIssue.position + 1 : 0;
      }
    } else if (
      typeof position === "number" &&
      !isNaN(position) &&
      position >= 0
    ) {
      updateData.position = Math.floor(position);
    }

    const updatedIssue = await db.issue.update({
      where: {
        id: issueId,
      },
      data: updateData,
    });

    return NextResponse.json({
      message: "Issue updated successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("PATCH /issues/[issueId] error:", error);
    return NextResponse.json(
      { message: "Failed to update issue" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug, issueId } = await params;

    // Check session
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
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
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
        { message: "You are not a member of this project" },
        { status: 403 },
      );
    }

    const existingIssue = await db.issue.findFirst({
      where: {
        id: issueId,
        projectId: project.id,
      },
    });

    if (!existingIssue) {
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });
    }

    await db.issue.delete({
      where: {
        id: issueId,
      },
    });

    return NextResponse.json({
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /issues/[issueId] error:", error);
    return NextResponse.json(
      { message: "Failed to delete issue" },
      { status: 500 },
    );
  }
}
