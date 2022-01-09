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
import {
	Cell,
	FileChange,
	PresetField,
	Row,
	Settings,
	SuperchargedField,
} from "./interfaces";
import { SettingTab } from "./SettingTab";
import { selectFile } from "./utils";

export default class ImportPlugin extends Plugin {
	settings: Settings;
	superchargedFields: SuperchargedField[] = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		this.addCommand({
			id: "import-data",
			name: "Import Data",
			callback: async () => new BreakdownModal(this.app, this).open(),
		});

		this.app.workspace.onLayoutReady(async () => {
			this.superchargedFields = await this.getSuperchargedFields();
		});
	}

	onunload() {}

	async parseCSV(file: File): Promise<Row[]> {
		const csv = await file.text();
		const parser = helper();

		return await parser.fromString(csv).then((json) => json);
	}

	async getSuperchargedFields(): Promise<SuperchargedField[]> {
		const { app, settings } = this;
		if (!settings.mergeSuperchargedLinks) return null;

		const presetFields: PresetField[] =
			app.plugins.plugins["supercharged-links-obsidian"]?.settings
				.presetFields;

		if (!presetFields) return null;
		return Promise.all(
			presetFields.map(async (field) => {
				const { valuesListNotePath, values, name } = field;
				const newValues = Object.values(values);

				if (valuesListNotePath) {
					const file = this.app.metadataCache.getFirstLinkpathDest(
						valuesListNotePath,
						""
					);
					if (!file) return;
					const content = await this.app.vault.cachedRead(file);
					const lines = content.split("\n");

					lines.forEach((line) => newValues.push(line));
				}

				return { name, values: newValues };
			})
		);
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

	parseCell(field: string, cell: Cell) {
		const { listDelimiter, importNestedFields } = this.settings;

		const toMDField = (key: string, val: string, listQ = false) =>
			listQ ? `${key}:: [${val}]` : `${key}:: ${val}`;

		if (typeof cell === "string") {
			return [toMDField(field, cell, cell.includes(listDelimiter))];
		} else if (importNestedFields) {
			return Object.keys(cell).map((subF) =>
				toMDField(field + "." + subF, cell[subF])
			);
		} else return [];
	}

	makeWiki = (input: string) =>
		this.settings.makeWiki ? `[[${input}]]` : input;
	dropWiki = (input: string) =>
		input.startsWith("[[") && input.endsWith("]]")
			? input.slice(2, -2)
			: input;

	rowToStr(row: Row): string {
		const { superchargedFields } = this;
		const { fileColumnName } = this.settings;
		const cols = Object.keys(row);

		const toMerge: { [parent: string]: string[] } = {};
		let output = "";
		for (const col of cols) {
			if (col === fileColumnName) continue;
			const cell = row[col];
			// console.log({ col, cell });

			if (superchargedFields && typeof cell === "string") {
				const scField = superchargedFields.find(
					(field) =>
						field &&
						field.values
							.map((val) => this.dropWiki(val))
							.includes(col)
				);
				if (scField) {
					if (cell === "true" || cell === "1") {
						if (!toMerge[scField.name]) toMerge[scField.name] = [];
						toMerge[scField.name].push(col);
					}
				} else {
					const pairs = this.parseCell(col, cell);
					output += pairs.join("\n") + (pairs.length ? "\n" : "");
				}
			} else {
				const pairs = this.parseCell(col, cell);
				output += pairs.join("\n") + (pairs.length ? "\n" : "");
			}
		}

		Object.keys(toMerge).forEach((parent) => {
			output += `${parent}:: ${toMerge[parent]
				.map((x) => this.makeWiki(x))
				.join(", ")}\n`;
		});

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
		this.superchargedFields = await this.getSuperchargedFields();

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
