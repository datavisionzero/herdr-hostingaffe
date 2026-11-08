import { View, div, image } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { appHome, readTextFile, theme, props as hostProps } from "herdr";
import { profile, filtered, demoMachines } from "./core.js";
import { picture } from "./pictures.js";
import { Client } from "./client.js";

export default class Hostingaffe extends View {
  init(_props, cx) {
    const props = hostProps() ?? {};
    this.demo = props.demo === true;
    this.profileName = typeof props.profile === "string" ? props.profile : "default";
    this.serial = 0; this.rows = []; this.query = ""; this.copied = null;
    this.input = InputState.new({ placeholder: "Find a machine, IP or app" });
    this.input.on("change", (_event, cx) => { this.query = this.input.value(); cx.notify(); });
    this.refresh(cx);
    cx.timer.every(1000, cx => {
      if (this.loading && Date.now() > this.deadline) {
        this.serial++; this.loading = false;
        this.rows = this.rows.map(row => row.addresses === "loading" ? { ...row, addresses: "error" } : row);
        this.error = "Request timed out. Refresh to retry."; cx.notify();
      }
      if (this.copied && Date.now() > this.copyDeadline) { this.copied = null; cx.notify(); }
    });
  }

  refresh(cx) {
    const serial = ++this.serial;
    this.rows = []; this.error = null; this.warning = null; this.updated = null;
    this.loading = true; this.deadline = Date.now() + 60000; cx.notify();
    cx.spawn(async cx => {
      const current = () => this.serial === serial;
      try {
        if (this.demo) { this.rows = demoMachines(); return; }
        const local = await readTextFile(`${appHome()}/hostingaffe.local.json`);
        if (!current()) return;
        if (!local) throw new Error("Create hostingaffe.local.json in Herdr's home. See README for setup.");
        const client = new Client(profile(local, this.profileName));
        await client.overview((rows, warning) => {
          if (current()) { this.rows = rows; this.warning = warning; cx.notify(); }
        }, current);
      } catch (error) { if (current()) this.error = error.message || "Unable to load machines."; }
      finally {
        if (current()) { this.loading = false; this.updated = Date.now(); cx.notify(); }
      }
    });
  }

  render() {
    const t = theme(), rows = filtered(this.rows, this.query);
    const button = (id, label, action) => div().id(id).px(9).py(6).rounded(5).bg(t.raised)
      .hover(s => s.bg(t.hover)).on_click((_event, cx) => action(cx)).child(label);
    const address = (row, label, value) => h_flex().gap(8).items_center().children([
      div().w(48).flex_shrink_0().text_color(t.muted).text_size(11).child(label),
      div().id(`copy-${row.key}-${label}`).min_w(0).text_color(t.foreground).cursor_pointer()
        .hover(s => s.text_color(t.accent)).on_click((_event, cx) => {
          cx.write_to_clipboard(value); this.copied = `${row.key}-${label}`; this.copyDeadline = Date.now() + 1800; cx.notify();
        }).child(this.copied === `${row.key}-${label}` ? `${value} · Copied` : value)
    ]);
    return v_flex().id("hostingaffe-root").size_full().p(14).gap(12).bg(t.surface).text_color(t.foreground).text_size(13).children([
      h_flex().flex_shrink_0().items_center().justify_between().gap(8).children([
        v_flex().gap(3).children([div().font_semibold().text_size(17).child("hostingaffe"),
          div().text_color(t.muted).text_size(11).child(this.demo ? "MACHINES · DEMO" : "MACHINES")]),
        button("refresh", this.loading ? "Reload" : "Refresh", cx => this.refresh(cx))
      ]),
      Input.new(this.input).h(36).flex_shrink_0().px(10).py(7).rounded(5).bg(t.raised),
      div().flex_shrink_0().text_color(t.muted).text_size(11).child(this.loading ? "Loading machine records…" : `${rows.length} / ${this.rows.length} machines · active applications`),
      ...(this.error ? [div().flex_shrink_0().text_color(t.blocked).child(this.error)] : []),
      ...(this.warning ? [div().flex_shrink_0().text_color(t.blocked).child(this.warning)] : []),
      v_flex().id("machines-scroll").flex_1().min_h(0).overflow_y_scrollbar().child(
        v_flex().flex_shrink_0().gap(10).children([
          ...rows.map(row => v_flex().id(`machine-${row.key}`).flex_shrink_0().p(12).gap(10).rounded(7).bg(t.raised).children([
            h_flex().items_center().gap(12).children([
              image(picture(row)).w(48).h(48).flex_shrink_0(),
              v_flex().min_w(0).flex_1().gap(4).children([
                div().font_semibold().text_size(15).child(row.name),
                div().text_color(t.muted).text_size(11).child(`${row.key} · ${row.kind}${row.status === "planned" ? " · planned" : ""}`)
              ])
            ]),
            ...(row.addresses === "loading" ? [div().text_color(t.muted).child("Loading addresses…")]
              : row.addresses === "error" ? [div().text_color(t.blocked).child("Addresses unavailable · refresh to retry")]
              : [
                ...(row.ipv4 ? [address(row, "IPv4", row.ipv4)] : []),
                ...(row.ipv6 ? [address(row, "IPv6", row.ipv6)] : []),
                ...(row.private_ip ? [address(row, "Private", row.private_ip)] : []),
                ...(!row.ipv4 && !row.ipv6 && !row.private_ip ? [div().text_color(t.muted).child("No IP address recorded")] : [])
              ]),
            div().text_size(11).text_color(t.muted).child("APPLICATIONS"),
            ...(row.apps === null ? [div().text_color(t.blocked).child("Applications unavailable")]
              : !row.apps.length ? [div().text_color(t.muted).child("No active applications recorded")]
              : [h_flex().flex_wrap().gap(6).children(row.apps.map(app =>
                div().px(8).py(5).rounded(4).bg(t.surface).child(app.name)))] )
          ])),
          ...(!rows.length && !this.loading && !this.error ? [div().p(10).text_color(t.muted).child(this.query ? "No matching machines or apps." : "No machines recorded.")] : [])
        ])),
      div().flex_shrink_0().text_size(11).text_color(t.dim).child("Recorded inventory · click an IP to copy")
    ]);
  }
}
