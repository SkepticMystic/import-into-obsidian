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
		new Setting(containerEl)
			.setName("Import Nested Fields")
			.setDesc(
				"A nested field is something like `foods.apple`. Toggle this off to avoid importing these fields."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(settings.importNestedFields)
					.onChange(async (val) => {
						settings.importNestedFields = val;
						await plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Merge Fields Using Supercharged-Links Lists")
			.setDesc(
				"Supercharged Links allows you to give a list of predefined values to a field. This will merge the values into a single list."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(settings.mergeSuperchargedLinks)
					.onChange(async (val) => {
						settings.mergeSuperchargedLinks = val;
						await plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName("Make Merged Fields Wikilinks")
			.setDesc(
				"For the fields that get merged under Supercharged Links fields, should they be [[wikilinks]], or just the original cell value?"
			)
			.addToggle((toggle) => {
				toggle.setValue(settings.makeWiki).onChange(async (val) => {
					settings.makeWiki = val;
					await plugin.saveSettings();
				});
			});
	}
}
