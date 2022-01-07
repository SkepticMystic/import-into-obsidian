import { Link } from "obsidian-dataview";
import { DEFAULT_SETTINGS } from "./const";
import { Settings } from "./interfaces";
import { SettingTab } from "./SettingTab";
import helper from "csvtojson";

export default class ImportPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {}

	async parseCSV(
		file: File
	): Promise<
		Record<string, string | number | string[] | number[] | DateTime | Link>
	> {
		const csv = await file.text();
		const parser = helper();

		return await parser.fromString(csv).then((json) => json);
	}
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
