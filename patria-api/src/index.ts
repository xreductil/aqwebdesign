interface Env {
  patria_db: D1Database;

  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CALLBACK_URL: string;

  LOGIN_SUCCESS_URL?: string;
}

interface LineTokenResponse {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;

  error?: string;
  error_description?: string;
}

interface LineVerifyResponse {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  nonce?: string;

  name?: string;
  picture?: string;

  error?: string;
  error_description?: string;
}

function randomString(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getCookie(
  request: Request,
  name: string
): string | null {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function createCookie(
  name: string,
  value: string,
  maxAge = 600
): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

function clearCookie(name: string): string {
  return [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

async function createSession(
  db: D1Database,
  userId: number
): Promise<string> {
  const token = randomString(48);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  await db
    .prepare(`
      INSERT INTO sessions (
        token_hash,
        user_id,
        expires_at
      ) VALUES (?, ?, ?)
    `)
    .bind(tokenHash, userId, expiresAt)
    .run();

  return token;
}

async function getCurrentUser(
  request: Request,
  db: D1Database
): Promise<{ sessionId: number; user: Record<string, unknown> } | null> {
  const sessionToken = getCookie(request, "patria_session");
  if (!sessionToken) return null;

  const tokenHash = await sha256(sessionToken);
  const row = await db
    .prepare(`
      SELECT
        sessions.id AS session_id,
        users.id,
        users.line_user_id,
        users.display_name,
        users.avatar_url,
        users.email,
        users.created_at,
        users.updated_at
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `)
    .bind(tokenHash)
    .first<Record<string, unknown>>();

  if (!row) return null;

  return {
    sessionId: Number(row.session_id),
    user: {
      id: row.id,
      lineUserId: row.line_user_id,
      name: row.display_name,
      avatar: row.avatar_url,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    const url = new URL(request.url);

    try {

      /*
       * --------------------------------
       * 首頁 / 健康檢查
       * --------------------------------
       */
      if (url.pathname === "/") {
        return Response.json({
          ok: true,
          service: "Patria API",
          lineLogin: "/auth/line",
        });
      }

      if (request.method === "GET" && url.pathname === "/api/me") {
        const current = await getCurrentUser(request, env.patria_db);

        if (!current) {
          return Response.json(
            { success: false, error: "Not logged in" },
            { status: 401 }
          );
        }

        return Response.json({ success: true, user: current.user });
      }

      if (
        (request.method === "POST" || request.method === "GET") &&
        url.pathname === "/api/logout"
      ) {
        const sessionToken = getCookie(request, "patria_session");

        if (sessionToken) {
          const tokenHash = await sha256(sessionToken);
          await env.patria_db
            .prepare("DELETE FROM sessions WHERE token_hash = ?")
            .bind(tokenHash)
            .run();
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Set-Cookie": clearCookie("patria_session"),
            },
          }
        );
      }


      /*
       * --------------------------------
       * STEP 1
       * 開始 LINE Login
       * --------------------------------
       */
      if (url.pathname === "/auth/line") {

        const state = randomString(32);
        const nonce = randomString(32);

        const params = new URLSearchParams({
          response_type: "code",

          client_id:
            env.LINE_CHANNEL_ID,

          redirect_uri:
            env.LINE_CALLBACK_URL,

          state,

          scope:
            "openid profile",

          nonce,
        });

        const lineLoginUrl =
          "https://access.line.me/oauth2/v2.1/authorize?" +
          params.toString();

        const headers = new Headers();

        headers.set(
          "Location",
          lineLoginUrl
        );

        headers.append(
          "Set-Cookie",
          createCookie(
            "line_login_state",
            state
          )
        );

        headers.append(
          "Set-Cookie",
          createCookie(
            "line_login_nonce",
            nonce
          )
        );

        return new Response(null, {
          status: 302,
          headers,
        });
      }


      /*
       * --------------------------------
       * STEP 2
       * LINE Callback
       * --------------------------------
       */
      if (
        url.pathname ===
        "/auth/line/callback"
      ) {

        const error =
          url.searchParams.get("error");

        const errorDescription =
          url.searchParams.get(
            "error_description"
          );

        if (error) {
          return Response.json(
            {
              success: false,
              error,
              error_description:
                errorDescription,
            },
            {
              status: 400,
            }
          );
        }


        const code =
          url.searchParams.get("code");

        const state =
          url.searchParams.get("state");


        if (!code || !state) {
          return Response.json(
            {
              success: false,
              error:
                "Missing code or state",
            },
            {
              status: 400,
            }
          );
        }


        /*
         * 驗證 state
         */

        const savedState =
          getCookie(
            request,
            "line_login_state"
          );

        if (
          !savedState ||
          savedState !== state
        ) {
          return Response.json(
            {
              success: false,
              error:
                "Invalid LINE login state",
            },
            {
              status: 400,
            }
          );
        }


        const savedNonce =
          getCookie(
            request,
            "line_login_nonce"
          );

        if (!savedNonce) {
          return Response.json(
            {
              success: false,
              error:
                "Missing LINE login nonce",
            },
            {
              status: 400,
            }
          );
        }


        /*
         * --------------------------------
         * STEP 3
         * authorization code
         * 換 token
         * --------------------------------
         */

        const tokenResponse =
          await fetch(
            "https://api.line.me/oauth2/v2.1/token",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded",
              },

              body:
                new URLSearchParams({
                  grant_type:
                    "authorization_code",

                  code,

                  redirect_uri:
                    env.LINE_CALLBACK_URL,

                  client_id:
                    env.LINE_CHANNEL_ID,

                  client_secret:
                    env.LINE_CHANNEL_SECRET,
                }),
            }
          );


        const tokenData =
          (await tokenResponse.json()) as LineTokenResponse;


        if (
          !tokenResponse.ok ||
          !tokenData.id_token
        ) {
          console.error(
            "LINE token error:",
            tokenData
          );

          return Response.json(
            {
              success: false,
              error:
                "Failed to get LINE token",
            },
            {
              status: 400,
            }
          );
        }


        /*
         * --------------------------------
         * STEP 4
         * 驗證 LINE ID Token
         * --------------------------------
         */

        const verifyResponse =
          await fetch(
            "https://api.line.me/oauth2/v2.1/verify",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded",
              },

              body:
                new URLSearchParams({
                  id_token:
                    tokenData.id_token,

                  client_id:
                    env.LINE_CHANNEL_ID,

                  nonce:
                    savedNonce,
                }),
            }
          );


        const lineUser =
          (await verifyResponse.json()) as LineVerifyResponse;


        if (
          !verifyResponse.ok ||
          !lineUser.sub ||
          lineUser.nonce !== savedNonce ||
          lineUser.aud !== env.LINE_CHANNEL_ID
        ) {
          console.error(
            "LINE verify error:",
            lineUser
          );

          return Response.json(
            {
              success: false,
              error:
                "Failed to verify LINE user",
            },
            {
              status: 400,
            }
          );
        }


        /*
         * --------------------------------
         * STEP 5
         * 取得 LINE 身分
         * --------------------------------
         */

        const lineUserId =
          lineUser.sub;

        const displayName =
          lineUser.name ?? null;

        const avatarUrl =
          lineUser.picture ?? null;


        /*
         * --------------------------------
         * STEP 6
         * 寫入 Cloudflare D1
         * --------------------------------
         *
         * 第一次登入：
         * INSERT
         *
         * 已存在：
         * UPDATE 名稱 / 頭像
         */

        await env.patria_db
          .prepare(`
            INSERT INTO users (
              line_user_id,
              display_name,
              avatar_url
            )
            VALUES (?, ?, ?)

            ON CONFLICT(line_user_id)
            DO UPDATE SET
              display_name =
                excluded.display_name,

              avatar_url =
                excluded.avatar_url,

              updated_at =
                CURRENT_TIMESTAMP
          `)

          .bind(
            lineUserId,
            displayName,
            avatarUrl
          )

          .run();


        /*
         * --------------------------------
         * STEP 7
         * 把會員重新查出來
         * --------------------------------
         */

        const user =
          await env.patria_db

            .prepare(`
              SELECT
                id,
                line_user_id,
                display_name,
                avatar_url,
                created_at,
                updated_at

              FROM users

              WHERE line_user_id = ?

              LIMIT 1
            `)

            .bind(lineUserId)

            .first();

        if (!user) {
          return Response.json(
            {
              success: false,
              error: "Unable to load member after LINE login",
            },
            { status: 500 }
          );
        }


        /*
         * 清掉 OAuth 暫存 Cookie
         */

        const responseHeaders =
          new Headers();

        await env.patria_db
          .prepare("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP")
          .run();

        const sessionToken = await createSession(
          env.patria_db,
          Number((user as { id: number }).id)
        );

        responseHeaders.append(
          "Set-Cookie",
          createCookie(
            "patria_session",
            sessionToken,
            30 * 24 * 60 * 60
          )
        );

        responseHeaders.append(
          "Set-Cookie",
          clearCookie(
            "line_login_state"
          )
        );

        responseHeaders.append(
          "Set-Cookie",
          clearCookie(
            "line_login_nonce"
          )
        );


        /*
         * 如果設定登入成功網址，
         * 就跳回前端
         */

        if (
          env.LOGIN_SUCCESS_URL
        ) {

          responseHeaders.set(
            "Location",
            env.LOGIN_SUCCESS_URL
          );

          return new Response(
            null,
            {
              status: 302,
              headers:
                responseHeaders,
            }
          );
        }


        /*
         * 測試階段先直接顯示結果
         */

        responseHeaders.set(
          "Content-Type",
          "application/json; charset=utf-8"
        );

        return new Response(
          JSON.stringify(
            {
              success: true,

              message:
                "LINE login successful",

              user,
            },
            null,
            2
          ),
          {
            status: 200,
            headers:
              responseHeaders,
          }
        );
      }


      /*
       * --------------------------------
       * 404
       * --------------------------------
       */

      return Response.json(
        {
          success: false,
          error: "Not found",
        },
        {
          status: 404,
        }
      );


    } catch (error) {

      console.error(
        "Worker error:",
        error
      );

      return Response.json(
        {
          success: false,
          error:
            "Internal server error",
        },
        {
          status: 500,
        }
      );
    }
  },
};
