// Palette, order and fallback hash from Hostingaffe (MIT). See NOTICE.md.
export const avatars = ["monkey", "gorilla", "sloth", "raccoon", "fox", "owl", "penguin", "octopus", "cat", "frog", "bear", "wolf", "lion", "puma", "robot", "rack", "turbo", "tower", "minipc", "minimac", "desktop", "laptop", "devbook", "aibox", "monitor", "router", "proxy", "signpost", "firewall", "cloud", "container", "database", "harddrive", "bucket", "floppy", "tape", "logbook", "gauge"];
export const colors = { brown: "#9a6b45", slate: "#5b6b7a", teal: "#2f8f8a", orange: "#e0843a", berry: "#a14a7a", sage: "#7c9a5a", blue: "#4a7bd0", red: "#d0584a", mustard: "#d4a02f", lavender: "#8a6fc4" };
function hash(text, seed) {
  let value = seed >>> 0;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return value;
}
export function picture(machine) {
  const names = Object.keys(colors);
  const avatar = avatars.includes(machine.avatar) ? machine.avatar : avatars[hash(machine.key, 0x811c9dc5) % avatars.length];
  const color = names.includes(machine.avatar_color) ? machine.avatar_color : names[hash(machine.key, 0x9e3779b9) % names.length];
  return `mods/hostingaffe/avatars/${avatar}-${color}.svg`;
}
