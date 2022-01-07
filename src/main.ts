import helper from "csvtojson";
import { DateTime } from "luxon";
import { normalizePath, Plugin, TFile } from "obsidian";
import { BreakdownModal } from "./BreakdownModal";
import {
	DEFAULT_SETTINGS,
	FILE_DATED,
	FILE_EXISTING,
	FILE_NON_EXISTING,
} from "./const";
import { Cell, FileChange, Row, Settings } from "./interfaces";
import { SettingTab } from "./SettingTab";
import { selectFile } from "./utils";

export default class ImportPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		this.addCommand({
			id: "import-data",
			name: "Import Data",
			callback: async () => new BreakdownModal(this.app, this).open(),
		});
	}

	onunload() {}

	async parseCSV(file: File): Promise<Row[]> {
		const csv = await file.text();
		const parser = helper();

		return await parser.fromString(csv).then((json) => json);
	}

	getCorrespondingFile(input: string): FileChange {
		const { app } = this;
		const firstLinkPath = app.metadataCache.getFirstLinkpathDest(input, "");

		if (firstLinkPath)
			return { input, file: firstLinkPath, type: FILE_EXISTING };
		const date = DateTime.fromISO(input);
		if (date) {
			const dateFile = app.vault
				.getMarkdownFiles()
				.find((file) => file.basename.includes(input));

			if (dateFile) return { input, file: dateFile, type: FILE_DATED };
			else return { input, file: null, type: FILE_NON_EXISTING };
		}

		return { input, file: null, type: FILE_NON_EXISTING };
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
		const { listDelimiter, importNestedFields } = this.settings;

		if (typeof cell === "string") {
			if (cell.includes(listDelimiter))
				return [this.toMDField(field, cell, true)];
			else return [this.toMDField(field, cell, false)];
		} else if (importNestedFields) {
			return Object.keys(cell).map((subF) =>
				this.toMDField(field + "." + subF, cell[subF])
			);
		} else return [];
	}

	rowToStr(row: Row): string {
		const { listDelimiter, fileColumnName } = this.settings;
		const cols = Object.keys(row);

		let output = "";
		for (const col of cols) {
			if (col === fileColumnName) continue;
			const cell = row[col];
			const pairs = this.parseCell(col, cell);

			output += pairs.join("\n") + (pairs.length ? "\n" : "");
		}

		return output;
	}

	async prepareBreakdown() {
		const { fileColumnName } = this.settings;
		const file = await selectFile(".csv", false);
		if (!file) return;

		const json = await this.parseCSV(file[0]);
		console.log(json);

		const fileChanges = json.map((row) => {
			const fileName = row[fileColumnName] as string;
			return this.getCorrespondingFile(fileName);
		});

		return { json, fileChanges };
	}

	async importData(json: Row[], selectedFiles: FileChange[]) {
		const { fileColumnName } = this.settings;

		json.forEach(async (row) => {
			const fileName = row[fileColumnName] as string;
			const fileChange = selectedFiles.find(
				(change) => change.input === fileName
			);

			// Then file wasn't selected
			if (!fileChange) return;
			const { file } = fileChange;

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
