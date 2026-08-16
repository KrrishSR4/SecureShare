export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const FRONTEND_URL = env.FRONTEND_URL || "https://secureshare-frontend-dev.pages.dev";
    const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
    const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET;
    const WORKER_URL = `${url.protocol}//${url.host}`;

    // 1. Google OAuth Initiation
    if (url.pathname === "/api/auth/google") {
      const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID || "");
      googleAuthUrl.searchParams.set("redirect_uri", `${WORKER_URL}/api/auth/google/callback`);
      googleAuthUrl.searchParams.set("response_type", "code");
      googleAuthUrl.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
      googleAuthUrl.searchParams.set("access_type", "offline");
      googleAuthUrl.searchParams.set("prompt", "consent");

      return Response.redirect(googleAuthUrl.toString(), 302);
    }

    // 2. Google OAuth Callback
    if (url.pathname === "/api/auth/google/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return Response.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthCodeMissing`, 302);
      }

      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID || "",
            client_secret: GOOGLE_CLIENT_SECRET || "",
            redirect_uri: `${WORKER_URL}/api/auth/google/callback`,
            grant_type: "authorization_code",
          }),
        });

        const tokenData = (await tokenRes.json()) as any;
        if (!tokenData.access_token) {
          throw new Error("Failed to obtain Google access token");
        }

        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const googleUser = (await userRes.json()) as any;

        const userString = encodeURIComponent(
          JSON.stringify({
            id: googleUser.id || "google_user",
            name: googleUser.name || "Google User",
            email: googleUser.email,
            profilePictureUrl: googleUser.picture,
            role: "USER",
          })
        );

        const accessToken = "secureshare_jwt_" + btoa(googleUser.email || "user");

        return Response.redirect(
          `${FRONTEND_URL}/auth/oauth-callback?accessToken=${accessToken}&user=${userString}`,
          302
        );
      } catch (err) {
        console.error("Google Callback Error:", err);
        return Response.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthFailed`, 302);
      }
    }

    // 3. GitHub OAuth Initiation
    if (url.pathname === "/api/auth/github") {
      const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
      githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID || "");
      githubAuthUrl.searchParams.set("redirect_uri", `${WORKER_URL}/api/auth/github/callback`);
      githubAuthUrl.searchParams.set("scope", "user:email");

      return Response.redirect(githubAuthUrl.toString(), 302);
    }

    // 4. GitHub OAuth Callback
    if (url.pathname === "/api/auth/github/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return Response.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthCodeMissing`, 302);
      }

      try {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "SecureShare-Cloudflare-Worker",
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
          }),
        });

        const tokenData = (await tokenRes.json()) as any;
        if (!tokenData.access_token) {
          throw new Error("Failed to obtain GitHub access token");
        }

        const userRes = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "SecureShare-Cloudflare-Worker",
          },
        });
        const githubUser = (await userRes.json()) as any;

        const emailRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "SecureShare-Cloudflare-Worker",
          },
        });
        const emails = (await emailRes.json()) as any[];
        const primaryEmail =
          emails.find((e) => e.primary)?.email || emails[0]?.email || `${githubUser.login}@github.com`;

        const userString = encodeURIComponent(
          JSON.stringify({
            id: String(githubUser.id),
            name: githubUser.name || githubUser.login,
            email: primaryEmail,
            profilePictureUrl: githubUser.avatar_url,
            role: "USER",
          })
        );

        const accessToken = "secureshare_jwt_" + btoa(primaryEmail);

        return Response.redirect(
          `${FRONTEND_URL}/auth/oauth-callback?accessToken=${accessToken}&user=${userString}`,
          302
        );
      } catch (err) {
        console.error("GitHub Callback Error:", err);
        return Response.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthFailed`, 302);
      }
    }

    // 5. Health Check
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
