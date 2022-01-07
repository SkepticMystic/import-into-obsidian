import { Plugin, TFile } from "obsidian";
import { Link } from "obsidian-dataview";
import { DEFAULT_SETTINGS } from "./const";
import { Settings } from "./interfaces";
import { SettingTab } from "./SettingTab";
import { selectFile } from "./utils";
import helper from "csvtojson";
import { DateTime } from "luxon";

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

	getCorrespondingFile(name: string): TFile | null {
		const { app } = this;
		const firstLinkPath = app.metadataCache.getFirstLinkpathDest(name, "");

		if (firstLinkPath) return firstLinkPath;
		const date = DateTime.fromISO(name);
		if (date) {
			const dateFile = app.vault
				.getMarkdownFiles()
				.find((file) => file.basename.includes(name));

			if (date) return dateFile;
		}

		return null;
	}

	async createNewMDFile(currFile: TFile, basename: string, content: string) {
		const { app } = this;
		const newFileParent = app.fileManager.getNewFileParent(
			currFile?.path ?? ""
		);

		await app.vault.create(
			normalizePath(`${newFileParent.path}/${basename}.md`),
			content
		);
	}

	async appendToFile(file: TFile, append: string) {
		const { app } = this;
		const content = await app.vault.read(file);
		await app.vault.modify(
			file,
			`${content}${content.length ? "\n" : ""}${append}`
		);
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
