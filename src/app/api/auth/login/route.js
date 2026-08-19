import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password) {
  const salt = "devhub_salt_2026";
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    // Query user by username or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: trimmedUsername },
          { email: trimmedUsername },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const inputHash = hashPassword(password);

    if (inputHash !== user.passwordHash) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create session cookie
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
      { status: 200 }
    );

    response.cookies.set("devhub_session", sessionData, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Failed to sign in" },
      { status: 500 }
    );
  }
}
