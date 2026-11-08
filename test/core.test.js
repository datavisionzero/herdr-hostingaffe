import test from "node:test";
import assert from "node:assert/strict";
import { profile, machine, installation, applications, filtered, list, demoMachines } from "../mods/hostingaffe/core.js";
import { picture, avatars, colors } from "../mods/hostingaffe/pictures.js";
import { readFile } from "node:fs/promises";

test("profiles accept trusted origins and never echo malformed secrets", () => {
  const input = (url, token = "fixture-only") => JSON.stringify({ profiles: { default: { url, token } } });
  assert.equal(profile(input("https://inventory.example/")).url, "https://inventory.example");
  assert.equal(profile(input("http://127.0.0.1:1234")).url, "http://127.0.0.1:1234");
  for (const url of ["http://remote.example", "https://name:password@example.test", "https://example.test/api", "https://example.test?secret", "https://example.test\n"]) assert.throws(() => profile(input(url)));
  for (const token of ["", "   ", "a\nb"]) assert.throws(() => profile(input("https://example.test", token)));
  assert.throws(() => profile(input("https://example.test"), "__proto__"));
  assert.throws(() => profile("sensitive-invalid-json"), error => !error.message.includes("sensitive"));
});

test("decoders discard descriptions and validate addresses and keys", () => {
  const value = { ...demoMachines()[0], description: "private", ssh: "private" };
  assert.equal(machine(value).addresses, "loading");
  assert.equal(machine(value, true).ipv4, "192.0.2.10");
  assert.equal(machine(value, true).description, undefined);
  assert.equal(machine(value, true).ssh, undefined);
  assert.throws(() => machine({ ...value, ipv4: {} }, true));
  assert.throws(() => machine({ ...value, key: "../other" }));
  assert.throws(() => list([value, value], machine));
  assert.throws(() => list({ items: [value] }, machine));
});

test("only active application installations belong in a machine card", () => {
  const base = { key: "app", name: "App", software: "notes", machine: "fox", role: "application", status: "active" };
  const rows = [base, { ...base, key: "db", role: "platform" }, { ...base, key: "retired", status: "retired" }, { ...base, key: "planned", status: "planned" }, { ...base, key: "elsewhere", machine: "owl" }].map(installation);
  assert.deepEqual(applications(rows, "fox").map(a => a.key), ["app"]);
  assert.throws(() => installation({ ...base, role: "unknown" }));
});

test("search includes IPs, private IPs, machine keys and application names", () => {
  const rows = demoMachines();
  for (const q of ["FOX", "192.0.2.10", "2001:db8", "portal"]) assert.equal(filtered(rows, q)[0].key, "fox");
  assert.equal(filtered(rows, "192.0.2.20")[0].key, "owl");
  assert.equal(filtered(rows, "missing").length, 0);
  rows[0].apps = null;
  assert.equal(filtered(rows, "fox").length, 1);
  rows[0].name = "changed";
  assert.equal(demoMachines()[0].name, "Fox server");
});

test("all original avatar choices have native full-color assets and safe fallbacks", async () => {
  assert.equal(picture({ key: "fox", avatar: "fox", avatar_color: "teal" }), "mods/hostingaffe/avatars/fox-teal.svg");
  assert.equal(picture({ key: "unchosen" }), picture({ key: "unchosen", avatar: "../../invalid", avatar_color: "__proto__" }));
  for (const avatar of avatars) for (const color of Object.keys(colors)) {
    const path = picture({ key: "fixture", avatar, avatar_color: color });
    const svg = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(svg, /viewBox="0 0 64 64"/);
    assert.ok(svg.includes(colors[color]));
    assert.ok(!/var\(|<script|https?:\/\/(?!www.w3.org)/.test(svg));
  }
});
