import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { avatars, colors } from "../mods/hostingaffe/pictures.js";
const revision = "21dcec4eb670ff69818c24faa7951e2d84b6bf14";
let contract;
if (process.argv[2]) contract = JSON.parse(await readFile(process.argv[2], "utf8"));
else {
  const response = await fetch(`https://raw.githubusercontent.com/datavisionzero/hostingaffe/${revision}/docs/api/openapi.json`, { signal: AbortSignal.timeout(30000) });
  assert.ok(response.ok, `Contract HTTP ${response.status}`);
  contract = await response.json();
}
const schemas = contract.components.schemas;
for (const [name, fields] of Object.entries({
  MachineSummary: ["key", "name", "kind", "status", "avatar", "avatar_color"],
  Machine: ["key", "name", "kind", "status", "avatar", "avatar_color", "ipv4", "ipv6", "private_ip", "hostname"],
  InstallationSummary: ["key", "name", "machine", "software", "status", "role"]
})) for (const field of fields) assert.ok(schemas[name].required.includes(field), `${name}.${field}`);
for (const [path, type, array] of [["/api/machines", "MachineSummary", true], ["/api/machines/{key}", "Machine", false], ["/api/installations", "InstallationSummary", true]]) {
  const result = contract.paths[path].get.responses["200"].content["application/json"].schema;
  assert.equal((array ? result.items : result).$ref, `#/components/schemas/${type}`);
}
for (const field of ["ipv4", "ipv6", "private_ip", "hostname"]) assert.deepEqual(schemas.Machine.properties[field].type, ["null", "string"]);
assert.deepEqual(schemas.Status.enum, ["planned", "active", "retired"]);
assert.deepEqual(schemas.MachineKind.enum, ["vps", "dedicated", "vm", "local"]);
assert.deepEqual(schemas.Role.enum, ["application", "platform"]);
assert.deepEqual(schemas.Avatar.enum.filter(Boolean), avatars);
assert.deepEqual(schemas.AvatarColor.enum.filter(Boolean), Object.keys(colors));
const parameters = contract.paths["/api/installations"].get.parameters.map(p => p.name);
assert.ok(parameters.includes("role") && parameters.includes("status"));
console.log(`Consumed Hostingaffe contract verified against ${revision}.`);
