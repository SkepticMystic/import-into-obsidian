import { App, PluginSettingTab } from "obsidian";
import ImportPlugin from "./main";

export class SettingTab extends PluginSettingTab {
  plugin: ImportPlugin;

  constructor(app: App, plugin: ImportPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;
    containerEl.empty();
  }
}
