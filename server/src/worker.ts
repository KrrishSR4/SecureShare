export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const FRONTEND_URL = env.FRONTEND_URL || "https://secureshare-frontend-dev.pages.dev";
    const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || "99861091790-hfhln1sf4coagbpt15mm5v4hopbqu5dm.apps.googleusercontent.com";
    const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID || "Ov23lieHfdnNxJV0Rnfn";
    const WORKER_URL = `${url.protocol}//${url.host}`;

    // 1. Google OAuth Initiation
    if (url.pathname === "/api/auth/google") {
      const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.set("redirect_uri", `${WORKER_URL}/api/auth/google/callback`);
      googleAuthUrl.searchParams.set("response_type", "code");
      googleAuthUrl.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
      googleAuthUrl.searchParams.set("access_type", "offline");
      googleAuthUrl.searchParams.set("prompt", "consent");

      return Response.redirect(googleAuthUrl.toString(), 302);
    }

    // 2. GitHub OAuth Initiation
    if (url.pathname === "/api/auth/github") {
      const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
      githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
      githubAuthUrl.searchParams.set("redirect_uri", `${WORKER_URL}/api/auth/github/callback`);
      githubAuthUrl.searchParams.set("scope", "user:email");

      return Response.redirect(githubAuthUrl.toString(), 302);
    }

    // 3. Health Check
    if (url.pathname === "/api/health" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          runtime: "cloudflare-workers",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
          },
        }
      );
    }

    // Default Fallback
    return new Response(
      JSON.stringify({
        status: "ok",
        message: "SecureShare Cloudflare Worker API running successfully",
        path: url.pathname,
      }),
      {
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
      }
    );
  },
};
