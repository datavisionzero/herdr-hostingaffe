import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = (await readFile(new URL("../mods/hostingaffe-launcher/main.js", import.meta.url), "utf8"))
  .replace('import { View, div } from "gpui-kit";', 'const {View, div} = globalThis.__launcher;')
  .replace('import { panes, spaces, focused, run, nextCommand, theme } from "herdr";', 'const {panes, spaces, focused, run, nextCommand, theme} = globalThis.__launcher;');
test("launcher focuses this tab's overview, splits a pane or opens a dedicated tab", async () => {
  let all = [], focus = { tab: "current", pane: "terminal" }, calls = [];
  globalThis.__launcher = { View: class {}, panes: () => all, spaces: () => [], focused: () => focus,
    run: (name, args) => calls.push({ name, args }) };
  try {
    const { default: Launcher } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    const launcher = new Launcher();
    all = [{ tab: "current", pane: "terminal" }, { tab: "other", pane: "other-panel", mod: "hostingaffe" }];
    launcher.open(); assert.equal(calls.at(-1).name, "pane.split"); assert.equal(calls.at(-1).args.pane, "terminal");
    all.push({ tab: "current", pane: "panel", mod: "hostingaffe" });
    launcher.open(); assert.deepEqual(calls.at(-1), { name: "pane.focus", args: { pane: "panel" } });
    all = []; focus = null; launcher.open();
    assert.deepEqual(calls.at(-1), { name: "tab.new", args: { name: "Machines", mod: "hostingaffe" } });
  } finally { delete globalThis.__launcher; }
});
