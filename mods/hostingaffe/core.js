const statuses = ["planned", "active", "retired"];
const validKey = value => typeof value === "string" && value.length <= 64 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
const optional = value => value === null || typeof value === "string";

export function profile(text, name = "default") {
  let p;
  try {
    const profiles = JSON.parse(text.replace(/^\uFEFF/, ""))?.profiles;
    p = profiles && Object.hasOwn(profiles, name) ? profiles[name] : null;
  } catch { throw new Error("Invalid hostingaffe.local.json. Check the local profile."); }
  const url = typeof p?.url === "string" ? p.url.replace(/\/+$/, "") : "";
  if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(url) && !/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(url)) throw new Error("Configure an HTTPS origin in hostingaffe.local.json (HTTP only on loopback).");
  if (typeof p?.token !== "string" || !p.token.trim() || /[\r\n]/.test(p.token)) throw new Error("Set a user or agent token in hostingaffe.local.json. Machine tokens cannot read machines.");
  return { url, token: p.token };
}

export function machine(value, detail = false) {
  if (!value || !validKey(value.key) || typeof value.name !== "string" || !statuses.includes(value.status) || !["vps", "dedicated", "vm", "local"].includes(value.kind)) throw new Error("Invalid machine response. Check Hostingaffe compatibility.");
  if (detail && ![value.ipv4, value.ipv6, value.private_ip, value.hostname].every(optional)) throw new Error("Invalid machine addresses.");
  return { key: value.key, name: value.name || value.key, status: value.status, kind: value.kind,
    avatar: value.avatar, avatar_color: value.avatar_color,
    ipv4: detail ? value.ipv4 : null, ipv6: detail ? value.ipv6 : null,
    private_ip: detail ? value.private_ip : null, hostname: detail ? value.hostname : null,
    addresses: detail ? "ready" : "loading" };
}

export function installation(value) {
  if (!value || !validKey(value.key) || !validKey(value.machine) || !validKey(value.software) || typeof value.name !== "string" || !statuses.includes(value.status) || !["application", "platform"].includes(value.role)) throw new Error("Invalid installation response. Check Hostingaffe compatibility.");
  return { key: value.key, name: value.name || value.software, machine: value.machine, software: value.software, status: value.status, role: value.role };
}

export function list(value, decode) {
  if (!Array.isArray(value)) throw new Error("Invalid list response. Check Hostingaffe compatibility.");
  const rows = value.map(row => decode(row));
  if (new Set(rows.map(row => row.key)).size !== rows.length) throw new Error("Duplicate keys in response.");
  return rows;
}

export function applications(rows, machineKey) {
  return rows.filter(row => row.machine === machineKey && row.role === "application" && row.status === "active");
}

export function filtered(rows, query) {
  const q = query.trim().toLowerCase();
  return rows.filter(row => [row.name, row.key, row.hostname, row.ipv4, row.ipv6, row.private_ip,
    ...(row.apps || []).flatMap(app => [app.name, app.software])].filter(Boolean).join(" ").toLowerCase().includes(q));
}

export function demoMachines() {
  return [
    { key: "fox", name: "Fox server", kind: "vps", status: "active", avatar: "fox", avatar_color: "orange", ipv4: "192.0.2.10", ipv6: "2001:db8::10", private_ip: null, hostname: "fox.example.test", addresses: "ready", apps: [{ key: "notes-prod", name: "Notes", software: "notes" }, { key: "portal-prod", name: "Team portal", software: "portal" }] },
    { key: "owl", name: "Owl workstation", kind: "local", status: "active", avatar: "owl", avatar_color: "teal", ipv4: null, ipv6: null, private_ip: "192.0.2.20", hostname: null, addresses: "ready", apps: [{ key: "studio", name: "Studio", software: "studio" }] },
    { key: "rack", name: "Build machine", kind: "dedicated", status: "planned", avatar: "rack", avatar_color: "blue", ipv4: null, ipv6: null, private_ip: null, hostname: null, addresses: "ready", apps: [] }
  ];
}
