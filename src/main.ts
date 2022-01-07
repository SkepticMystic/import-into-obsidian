import { Link } from "obsidian-dataview";
import { DEFAULT_SETTINGS } from "./const";
import { Settings } from "./interfaces";
import { SettingTab } from "./SettingTab";

export default class ImportPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {}

		Record<string, string | number | string[] | number[] | DateTime | Link>
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
