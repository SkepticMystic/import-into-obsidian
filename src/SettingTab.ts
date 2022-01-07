import { App, PluginSettingTab, Setting } from "obsidian";
import ImportPlugin from "./main";

export class SettingTab extends PluginSettingTab {
	plugin: ImportPlugin;

	constructor(app: App, plugin: ImportPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;
		const { plugin } = this;
		const { settings } = plugin;
		containerEl.empty();

		new Setting(containerEl)
			.setName("File Column Name")
			.setDesc("The name of the column that contains the file name.")
			.addText((text) => {
				text.setValue(settings.fileColumnName);
				text.inputEl.onblur = async () => {
					settings.fileColumnName = text.getValue();
					await plugin.saveSettings();
				};
			});
		new Setting(containerEl)
			.setName("List Delimiter")
			.setDesc(
				"The character used to split up lists of items in a single cell."
			)
			.addText((text) => {
				text.setValue(settings.listDelimiter);
				text.inputEl.onblur = async () => {
					settings.listDelimiter = text.getValue();
					await plugin.saveSettings();
				};
			});
	}
}
