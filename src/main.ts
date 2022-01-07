import helper from "csvtojson";
import { DateTime } from "luxon";
import { normalizePath, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "./const";
import { Cell, Row, Settings } from "./interfaces";
import { SettingTab } from "./SettingTab";
import { selectFile } from "./utils";

export default class ImportPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		this.addCommand({
			id: "import-data",
			name: "Import data",
			callback: async () => await this.importData(),
		});
	}

	onunload() {}

	async parseCSV(file: File): Promise<Row[]> {
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

	toMDField(key: string, val: string, listQ = false) {
		if (listQ) return `${key}:: [${val}]`;
		return `${key}:: ${val}`;
	}

	parseCell(field: string, cell: Cell) {
		const { listDelimiter } = this.settings;

		if (typeof cell === "string") {
			if (cell.includes(listDelimiter))
				return [this.toMDField(field, cell, true)];
			else return [this.toMDField(field, cell, false)];
		} else {
			return Object.keys(cell).map((subF) =>
				this.toMDField(field + "." + subF, cell[subF])
			);
		}
	}

	rowToStr(row: Row): string {
		const { listDelimiter, fileColumnName } = this.settings;
		const cols = Object.keys(row);

		let output = "";
		for (const col of cols) {
			if (col === fileColumnName) continue;
			const cell = row[col];
			const pairs = this.parseCell(col, cell);

			output += pairs.join("\n") + "\n";
		}

		return output;
	}

	async importData() {
		const { fileColumnName } = this.settings;
		const file = await selectFile(".csv", false);
		if (!file) return;

		const json = await this.parseCSV(file[0]);
		console.log(json);

		json.forEach(async (row: { [col: string]: Cell }) => {
			const fileName = row[fileColumnName] as string;
			const file = this.getCorrespondingFile(fileName);

			const toAppend = this.rowToStr(row);
			if (file) {
				this.appendToFile(file, toAppend);
			} else {
				const currFile = this.app.workspace.getActiveFile();
				this.createNewMDFile(currFile, fileName, toAppend);
			}
		});
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
