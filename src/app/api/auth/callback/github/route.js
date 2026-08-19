import { GET as handleGitHubCallback } from "@/app/api/auth/github/callback/route";

export async function GET(request) {
  return handleGitHubCallback(request);
}
