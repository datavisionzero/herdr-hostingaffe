import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = (await readFile(new URL("../mods/hostingaffe/main.js", import.meta.url), "utf8"))
  .replace('import { View, div, image } from "gpui-kit";', 'const { View, div, image } = globalThis.__host;')
  .replace('import { v_flex, h_flex, InputState, Input } from "gpui-base";', 'const { v_flex, h_flex, InputState, Input } = globalThis.__host;')
  .replace('import { appHome, readTextFile, theme, props as hostProps } from "herdr";', 'const { appHome, readTextFile, theme, hostProps } = globalThis.__host;')
  .replace('"./core.js"', JSON.stringify(new URL("../mods/hostingaffe/core.js", import.meta.url).href))
  .replace('"./pictures.js"', JSON.stringify(new URL("../mods/hostingaffe/pictures.js", import.meta.url).href))
  .replace('import { Client } from "./client.js";', 'const {Client} = globalThis.__host;');

test("panel refresh and timeout ignore late loads; demo copies own their state", async () => {
  let props = { demo: true }, timer, jobs = [], loads = [];
  globalThis.__host = {
    View: class {}, InputState: { new: () => ({ on() {}, value: () => "" }) }, hostProps: () => props,
    appHome: () => "/fixture", readTextFile: async () => JSON.stringify({ profiles: { default: { url: "https://example.test", token: "fixture-only" } } }),
    Client: class { overview(update, current) { return new Promise(resolve => loads.push({ update, current, resolve })); } }
  };
  try {
    const { default: Panel } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    const cx = { notify() {}, spawn(fn) { jobs.push(fn(cx)); }, timer: { every(_ms, fn) { timer = fn; } } };
    const a = new Panel(), b = new Panel(); a.init({}, cx); b.init({}, cx); await Promise.all(jobs);
    a.rows[0].apps[0].name = "changed";
    assert.equal(b.rows[0].apps[0].name, "Notes"); assert.notEqual(a.input, b.input);
    props = {}; jobs = [];
    const panel = new Panel(); panel.init({}, cx); await Promise.resolve();
    const old = loads.shift(); panel.refresh(cx); await Promise.resolve(); const fresh = loads.shift();
    assert.equal(old.current(), false); old.update([{ key: "old" }], null); old.resolve(); await jobs[0];
    assert.equal(panel.rows.length, 0);
    fresh.update([{ key: "fresh", addresses: "loading" }], null);
    panel.deadline = 0; timer(cx);
    assert.equal(panel.rows[0].addresses, "error"); assert.match(panel.error, /timed out/);
    fresh.update([{ key: "late" }], null); fresh.resolve(); await jobs[1];
    assert.equal(panel.rows[0].key, "fresh"); assert.equal(panel.loading, false);
  } finally { delete globalThis.__host; }
});
