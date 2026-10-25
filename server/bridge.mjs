import http from "node:http";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
const PORT = 8766,
  ORIGINS = new Set([
    "http://127.0.0.1:4191",
    "http://localhost:4191",
    "http://127.0.0.1:4198",
    "http://localhost:4198",
    "http://127.0.0.1:4173",
    "http://localhost:4173",
  ]);
export function gatewayURL(value = "http://127.0.0.1:8642") {
  const u = new URL(value);
  if (
    !["http:", "https:"].includes(u.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(u.hostname) ||
    u.username ||
    u.password ||
    u.search ||
    u.hash
  )
    throw Error(
      "HERMES_URL must be a loopback HTTP(S) gateway, without credentials or query.",
    );
  return u.origin;
}
export function validSubmission(data) {
  if (
    !data ||
    typeof data.input !== "string" ||
    !data.input.trim() ||
    data.input.length > 100000 ||
    typeof data.key !== "string" ||
    !/^[a-zA-Z0-9_-]{16,100}$/.test(data.key)
  )
    throw Error(
      "Use a nonempty note/context under 100,000 characters and a valid request key.",
    );
  return {
    input: data.input,
    instructions:
      "You are responding to a personal pinboard note. Return a useful final note. Separate completed work, proposals, and blockers. Never fabricate tool results or claim completion of unperformed work.",
  };
}
async function body(req) {
  let text = "";
  for await (const part of req) {
    text += part;
    if (Buffer.byteLength(text) > 450000)
      throw Error("Request exceeds 450 KB.");
  }
  return JSON.parse(text || "{}");
}
export function createBridge({
  base = gatewayURL(process.env.HERMES_URL),
  key = process.env.HERMES_API_KEY ?? "",
  fetcher = fetch,
} = {}) {
  const token = randomBytes(32).toString("hex");
  let inFlight = 0;
  const upstream = async (path, method = "GET", payload, idempotency) => {
    const r = await fetcher(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(idempotency ? { "Idempotency-Key": idempotency } : {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(20000),
      redirect: "error",
    });
    if (!r.ok) {
      const error = Error(
        `Hermes returned HTTP ${r.status}. Check the gateway, model provider and local Hermes logs.`,
      );
      error.status = r.status;
      throw error;
    }
    return await r.json();
  };
  return http.createServer(async (req, res) => {
    const reply = (status, data) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(data));
    };
    try {
      if (
        ![`127.0.0.1:${PORT}`, `localhost:${PORT}`, `[::1]:${PORT}`].includes(
          req.headers.host ?? "",
        )
      ) {
        reply(403, { error: "Invalid bridge host" });
        return;
      }
      const url = new URL(req.url, "http://127.0.0.1"),
        path = url.pathname;
      if (req.method === "GET" && path === "/agent/health") {
        if (!key) {
          reply(200, {
            connected: false,
            configured: false,
            message:
              "Hermes is not configured. Set HERMES_API_KEY in .env.local, enable the Hermes API server, then start the local board.",
            token,
          });
          return;
        }
        try {
          const models = await upstream("/v1/models");
          reply(200, {
            connected: true,
            configured: true,
            message:
              "Hermes gateway connected. Tasks run only when you send a note.",
            token,
            models: Array.isArray(models.data)
              ? models.data.map((m) => String(m.id)).slice(0, 10)
              : [],
          });
        } catch (e) {
          reply(200, {
            connected: false,
            configured: true,
            message: e.message,
            token,
          });
        }
        return;
      }
      if (!key) {
        reply(503, {
          error: "No Hermes gateway configured. Follow the setup guide first.",
        });
        return;
      }
      if (req.headers["x-board-token"] !== token) {
        reply(403, {
          error: "Reconnect the board before requesting agent work.",
        });
        return;
      }
      const run = /^\/agent\/runs\/([a-zA-Z0-9_-]{1,150})$/.exec(path),
        stop = /^\/agent\/runs\/([a-zA-Z0-9_-]{1,150})\/stop$/.exec(path);
      if (req.method === "GET" && run) {
        reply(200, await upstream("/v1/runs/" + run[1]));
        return;
      }
      if (
        req.method !== "POST" ||
        !ORIGINS.has(req.headers.origin ?? "") ||
        !(req.headers["content-type"] ?? "").startsWith("application/json")
      ) {
        reply(403, { error: "Use the local board origin and JSON requests." });
        return;
      }
      if (path === "/agent/runs") {
        if (inFlight >= 4) {
          reply(429, {
            error: "Too many simultaneous submissions. Try again shortly.",
          });
          return;
        }
        const d = await body(req),
          payload = validSubmission(d);
        inFlight++;
        try {
          reply(202, await upstream("/v1/runs", "POST", payload, d.key));
        } finally {
          inFlight--;
        }
        return;
      }
      if (stop) {
        await body(req);
        reply(200, await upstream("/v1/runs/" + stop[1] + "/stop", "POST", {}));
        return;
      }
      reply(404, { error: "Unknown bridge endpoint" });
    } catch (e) {
      reply(e.status ?? 400, {
        error:
          e.name === "TimeoutError"
            ? "Gateway request timed out. A submitted run may still exist; use the same request key to recover it."
            : e.message,
      });
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createBridge();
  server.listen(PORT, "127.0.0.1", () =>
    console.log(
      `Afterthought bridge: http://127.0.0.1:${PORT}. Credentials stay in this process.`,
    ),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => server.close(() => process.exit(0)));
}
