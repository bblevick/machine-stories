import { test } from "node:test";
import http from "node:http";
import assert from "node:assert/strict";
import { createBridge, gatewayURL, validSubmission } from "./bridge.mjs";
async function fixture(fn, key = "test-secret") {
  const calls = [],
    server = createBridge({
      base: "http://127.0.0.1:8642",
      key,
      fetcher: async (url, options) => {
        calls.push({ url, options });
        const data = url.endsWith("/models")
          ? { data: [{ id: "hermes-agent" }] }
          : url.endsWith("/stop")
            ? { status: "stopping" }
            : options.method === "POST"
              ? { run_id: "run_contract", status: "started" }
              : {
                  status: "completed",
                  output: "CONTRACT FIXTURE — not a live agent",
                };
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`,
    headers = { Host: "127.0.0.1:8766" };
  try {
    await fn({
      calls,
      request: (path, opts = {}) =>
        new Promise((resolve, reject) => {
          const req = http.request(
            base + path,
            { ...opts, headers: { ...headers, ...opts.headers } },
            (res) => {
              const chunks = [];
              res.on("data", (p) => chunks.push(p));
              res.on("end", () =>
                resolve(
                  new Response(Buffer.concat(chunks), {
                    status: res.statusCode,
                  }),
                ),
              );
            },
          );
          req.on("error", reject);
          if (opts.body) req.write(opts.body);
          req.end();
        }),
    });
  } finally {
    await new Promise((r) => server.close(r));
  }
}
test("only accepts loopback gateway configuration and bounded immutable submissions", () => {
  assert.equal(gatewayURL("http://localhost:8642"), "http://localhost:8642");
  assert.throws(() => gatewayURL("https://example.org"));
  assert.throws(() => gatewayURL("http://user:pass@localhost"));
  assert.throws(() => validSubmission({ input: "x", key: "short" }));
  assert.equal(
    validSubmission({ input: "request", key: "1234567890123456" }).input,
    "request",
  );
});
test("fresh setup reports disconnected without making an upstream call", async () =>
  fixture(async ({ request, calls }) => {
    const d = await (await request("/agent/health")).json();
    assert.equal(d.configured, false);
    assert.equal(d.connected, false);
    assert.equal(calls.length, 0);
  }, ""));
test("keeps upstream credentials out of browser responses and forwards the same idempotency key", async () =>
  fixture(async ({ request, calls }) => {
    const health = await (await request("/agent/health")).json();
    assert.equal(health.connected, true);
    assert.ok(!JSON.stringify(health).includes("test-secret"));
    const headers = {
      Origin: "http://127.0.0.1:4198",
      "Content-Type": "application/json",
      "X-Board-Token": health.token,
    };
    const body = JSON.stringify({
      input: "A contract-test note",
      key: "request_1234567890123456",
    });
    for (let i = 0; i < 2; i++)
      assert.equal(
        (await request("/agent/runs", { method: "POST", headers, body }))
          .status,
        202,
      );
    assert.equal(
      calls[1].options.headers["Idempotency-Key"],
      calls[2].options.headers["Idempotency-Key"],
    );
    assert.equal(calls[1].options.headers.Authorization, "Bearer test-secret");
  }));
test("rejects foreign origins, missing tokens and arbitrary proxy paths", async () =>
  fixture(async ({ request }) => {
    const health = await (await request("/agent/health")).json(),
      body = JSON.stringify({ input: "x", key: "request_1234567890123456" });
    assert.equal(
      (
        await request("/agent/runs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://foreign.example",
            "X-Board-Token": health.token,
          },
          body,
        })
      ).status,
      403,
    );
    assert.equal((await request("/agent/runs/x")).status, 403);
    assert.equal(
      (
        await request("/agent/../../anything", {
          headers: { "X-Board-Token": health.token },
        })
      ).status,
      403,
    );
  }));
test("forwards polling and stop receipts without claiming cancellation completed", async () =>
  fixture(async ({ request }) => {
    const health = await (await request("/agent/health")).json(),
      headers = {
        "X-Board-Token": health.token,
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:4198",
      };
    assert.equal(
      (await (await request("/agent/runs/run_contract", { headers })).json())
        .status,
      "completed",
    );
    const stop = await (
      await request("/agent/runs/run_contract/stop", {
        method: "POST",
        headers,
        body: "{}",
      })
    ).json();
    assert.equal(stop.status, "stopping");
  }));
