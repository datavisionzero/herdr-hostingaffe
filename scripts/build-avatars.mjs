import { readFile, writeFile, mkdir } from "node:fs/promises";
import { avatars, colors } from "../mods/hostingaffe/pictures.js";
const output = new URL("../mods/hostingaffe/avatars/", import.meta.url);
await mkdir(output, { recursive: true });
for (const avatar of avatars) {
  const source = await readFile(new URL(`../assets/upstream/${avatar}.svg`, import.meta.url), "utf8");
  for (const [color, hex] of Object.entries(colors)) {
    // Native SVG loaders do not implement CSS custom properties.
    const svg = source.replace(/ style="[^"]*"/g, "").replace(/var\(--[a-z-]+(?:,\s*#[a-fA-F0-9]+)?\)/g, hex);
    if (svg.includes("var(")) throw new Error(`Unresolved color in ${avatar}`);
    await writeFile(new URL(`${avatar}-${color}.svg`, output), svg);
  }
}
console.log(`Generated ${avatars.length * Object.keys(colors).length} native avatar variants.`);
