import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

  try {
    // 1. Exchange code for access_token with GitHub
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("GitHub Token Exchange Failed:", tokenData);
      return NextResponse.redirect(
        new URL("/login?error=token_failed", request.url),
      );
    }

    // 2. Fetch authenticated GitHub User Info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "DevHub-App",
      },
    });

    const ghUser = await userRes.json();
    const ghUserId = String(ghUser.id);
    const ghEmail = ghUser.email;
    const ghUsername = ghUser.login || `gh_user_${Date.now()}`;

    // Check active session cookie or draft username cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devhub_session");
    const draftUsernameCookie = cookieStore.get("devhub_draft_username");

    let sessionUserId = null;
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        sessionUserId = session.userId;
      } catch (e) {
        // Invalid session format
      }
    }

    // Look for existing user linked by githubId or email
    let user = await db.user.findFirst({
      where: {
        OR: [{ githubId: ghUserId }, ...(ghEmail ? [{ email: ghEmail }] : [])],
      },
    });

    if (sessionUserId) {
      // 1. User is currently logged in -> Link GitHub account to current session user
      user = await db.user.update({
        where: { id: sessionUserId },
        data: {
          githubId: ghUserId,
          githubAuthorized: true,
          githubAccessToken: accessToken,
          image: ghUser.avatar_url || undefined,
        },
      });
    } else if (draftUsernameCookie?.value) {
      // 2. User is completing signup flow with draft username -> Link GitHub account to signup user
      const draftUsername = draftUsernameCookie.value;
      user = await db.user.upsert({
        where: { username: draftUsername },
        update: {
          githubId: ghUserId,
          githubAuthorized: true,
          githubAccessToken: accessToken,
          image: ghUser.avatar_url || undefined,
        },
        create: {
          username: draftUsername,
          name: ghUser.name || ghUsername,
          email: ghUser.email || `${ghUsername}@users.noreply.github.com`,
          image: ghUser.avatar_url || null,
          githubId: ghUserId,
          githubAuthorized: true,
          githubAccessToken: accessToken,
        },
      });
    } else if (user) {
      // 3. User clicked "Sign in with GitHub" on /login AND an account linked to this GitHub exists -> Sign in to that account!
      user = await db.user.update({
        where: { id: user.id },
        data: {
          githubId: ghUserId,
          githubAuthorized: true,
          githubAccessToken: accessToken,
          image: user.image || ghUser.avatar_url || null,
        },
      });
    } else {
      // 4. User clicked "Sign in with GitHub" BUT no account exists linked to this GitHub -> Redirect to login with error!
      console.warn(`No account found linked to GitHub user ID ${ghUserId}`);
      const response = NextResponse.redirect(
        new URL("/login?error=no_account_linked", request.url),
      );
      response.cookies.delete("devhub_draft_username");
      return response;
    }

    // Set HTTP-only session cookie
    const sessionData = JSON.stringify({
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("devhub_session", sessionData, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear draft cookie
    response.cookies.delete("devhub_draft_username");

    return response;
  } catch (error) {
    console.error("GitHub OAuth Callback Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url),
    );
  }
}
