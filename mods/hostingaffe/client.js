import { machine, installation, list, applications } from "./core.js";

// Only GET requests. Credentials and full machine responses stay in memory.
export class Client {
  constructor(profile, fetcher = fetch) { this.profile = profile; this.fetcher = fetcher; }
  async get(path) {
    let response;
    try {
      response = await this.fetcher(this.profile.url + path, { method: "GET", headers: { Accept: "application/json", Authorization: `Bearer ${this.profile.token}` } });
    } catch { throw new Error("Cannot reach Hostingaffe. Check the local profile and connection."); }
    if (!response.ok) throw new Error(`Hostingaffe returned HTTP ${response.status}. Check access and refresh.`);
    try { return await response.json(); }
    catch { throw new Error("Hostingaffe returned invalid JSON."); }
  }

  async overview(update, current) {
    const [machinesResult, appsResult] = await Promise.allSettled([
      this.get("/api/machines").then(value => list(value, machine)),
      this.get("/api/installations?role=application&status=active").then(value => list(value, installation))
    ]);
    if (!current()) return;
    if (machinesResult.status === "rejected") throw machinesResult.reason;
    const appsError = appsResult.status === "rejected";
    const rows = machinesResult.value.filter(row => row.status !== "retired").map(row => ({ ...row,
      apps: appsError ? null : applications(appsResult.value, row.key) }));
    update(rows, appsError ? "Applications could not be loaded. Refresh to retry." : null);
    let next = 0;
    const worker = async () => {
      while (current() && next < rows.length) {
        const index = next++, row = rows[index];
        try {
          const detail = machine(await this.get(`/api/machines/${encodeURIComponent(row.key)}`), true);
          if (detail.key !== row.key) throw new Error("Machine mismatch");
          if (!current()) return;
          rows[index] = { ...detail, apps: row.apps };
        } catch {
          if (!current()) return;
          rows[index] = { ...row, addresses: "error" };
        }
        update([...rows], appsError ? "Applications could not be loaded. Refresh to retry." : null);
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, rows.length) }, worker));
  }
}
