import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password) {
  const salt = "devhub_salt_2026";
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export async function POST(request) {
  try {
    const { username, password, githubAuthorized } = await request.json();

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { message: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    // Create or update user in PostgreSQL database with passwordHash
    const user = await db.user.upsert({
      where: { username: username.trim() },
      update: {
        passwordHash,
        githubAuthorized: Boolean(githubAuthorized),
      },
      create: {
        username: username.trim(),
        name: username.trim(),
        passwordHash,
        githubAuthorized: Boolean(githubAuthorized),
      },
    });

    // Create session token
    const sessionData = JSON.stringify({
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          githubAuthorized: user.githubAuthorized,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only session cookie
    response.cookies.set("devhub_session", sessionData, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
