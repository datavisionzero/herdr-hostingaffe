import { View, div } from "gpui-kit";
import { panes, spaces, focused, run, nextCommand, theme } from "herdr";

export default class Launcher extends View {
  init(_props, cx) {
    cx.spawn(async cx => {
      for (;;) {
        const command = await nextCommand();
        if (command === "open") this.open();
      }
    });
  }
  open() {
    const f = focused(), space = spaces().find(s => s.active);
    const tab = f?.tab || space?.tabs?.find(tab => tab.active)?.id;
    const all = panes(), existing = all.find(p => p.tab === tab && p.mod === "hostingaffe");
    if (existing) { run("pane.focus", { pane: existing.pane }); return; }
    const pane = all.find(p => p.tab === tab && p.pane === f?.pane) || all.find(p => p.tab === tab);
    if (pane) run("pane.split", { pane: pane.pane, direction: "right", mod: "hostingaffe" });
    else run("tab.new", { name: "Machines", mod: "hostingaffe" });
  }
  render() {
    const t = theme();
    return div().id("hostingaffe-open").size_full().px(12).py(6).bg(t.chrome).text_color(t.accent).text_size(12)
      .hover(s => s.bg(t.hover)).on_click(() => this.open()).child("◉ hostingaffe: Machines");
  }
}
