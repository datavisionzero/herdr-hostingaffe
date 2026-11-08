import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Client } from "../mods/hostingaffe/client.js";
import { demoMachines } from "../mods/hostingaffe/core.js";

test("real HTTP reads machines, active applications and IPs without write calls", async () => {
  const requests = [], fixtures = demoMachines();
  const server = createServer((req, res) => {
    assert.equal(req.method, "GET"); assert.equal(req.headers.authorization, "Bearer fixture-only");
    requests.push(req.url); res.setHeader("Content-Type", "application/json");
    if (req.url === "/api/machines") res.end(JSON.stringify(fixtures));
    else if (req.url === "/api/installations?role=application&status=active") res.end(JSON.stringify([{ key: "app", name: "Notes", software: "notes", machine: "fox", role: "application", status: "active" }]));
    else res.end(JSON.stringify(fixtures.find(m => req.url === `/api/machines/${m.key}`)));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    let last;
    await new Client({ url: `http://127.0.0.1:${server.address().port}`, token: "fixture-only" }).overview(rows => last = rows, () => true);
    assert.equal(last.length, 3); assert.equal(last[0].ipv4, "192.0.2.10");
    assert.equal(last[0].apps[0].name, "Notes"); assert.deepEqual(last[1].apps, []);
    assert.ok(last.every(row => row.addresses === "ready")); assert.equal(requests.length, 5);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("partial failures are unavailable data, not empty apps or addresses", async () => {
  const client = new Client({ url: "https://example.test", token: "fixture-only" }, async url => {
    if (url.endsWith("/api/machines")) return { ok: true, json: async () => demoMachines() };
    if (url.includes("installations")) return { ok: false, status: 503 };
    return { ok: true, json: async () => ({ ...demoMachines()[0], key: "wrong" }) };
  });
  let last, warning;
  await client.overview((rows, message) => { last = rows; warning = message; }, () => true);
  assert.ok(warning); assert.ok(last.every(row => row.apps === null && row.addresses === "error"));
});

test("errors do not echo responses or credentials; stale loads stop publishing", async () => {
  const client = new Client({ url: "https://example.test", token: "fixture-only" }, async () => { throw Error("secret-body"); });
  await assert.rejects(client.get("/api/machines"), error => !error.message.includes("secret-body"));
  let updates = 0, calls = 0;
  client.fetcher = async () => { calls++; return { ok: true, json: async () => [] }; };
  await client.overview(() => updates++, () => false);
  assert.equal(updates, 0); assert.equal(calls, 2);
});

test("machine detail concurrency stays bounded and cancellation stops new work", async () => {
  const machines = Array.from({ length: 12 }, (_, i) => ({ ...demoMachines()[0], key: `machine-${i}` }));
  let running = 0, maximum = 0, live = true, reads = 0;
  const client = new Client({ url: "https://example.test", token: "fixture-only" }, async url => {
    if (url.endsWith("/api/machines")) return { ok: true, json: async () => machines };
    if (url.includes("installations")) return { ok: true, json: async () => [] };
    reads++; running++; maximum = Math.max(maximum, running);
    await new Promise(resolve => setTimeout(resolve, 5)); running--; live = false;
    return { ok: true, json: async () => machines.find(m => url.endsWith('/' + m.key)) };
  });
  await client.overview(() => {}, () => live);
  assert.equal(maximum, 4); assert.equal(reads, 4);
});
