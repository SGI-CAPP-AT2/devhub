import { NextResponse } from "next/server";

export async function GET(request) {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "";

  if (!clientId) {
    return NextResponse.json(
      { message: "GitHub Client ID is not configured" },
      { status: 500 }
    );
  }

  // Redirect to GitHub OAuth Authorization Page
  const requestUrl = new URL(request.url);
  const redirectUri = `${requestUrl.origin}/api/auth/callback/github`;

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "user repo read:user");

  const response = NextResponse.redirect(githubAuthUrl.toString());

  // Store draft username if provided
  if (username) {
    response.cookies.set("devhub_draft_username", username, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 15, // 15 mins
    });
  }

  return response;
}
