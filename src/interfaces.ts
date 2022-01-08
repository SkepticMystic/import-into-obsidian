import { TFile } from "obsidian";
import { FILE_EXISTING, FILE_DATED, FILE_NON_EXISTING } from "./const";

export interface Settings {
	fileColumnName: string;
	listDelimiter: string;
	importNestedFields: boolean;
	mergeSuperchargedLinks: boolean;
	makeWiki: boolean;
}

export type Cell = string | Record<string, any>;
export type Row = Record<string, Cell>;

export type FileType =
	| typeof FILE_EXISTING
	| typeof FILE_DATED
	| typeof FILE_NON_EXISTING;

export interface FileChange {
	input: string;
	file: TFile;
	type: FileType;
}

export interface PresetField {
	id: string;
	isCycle: boolean;
	isMulti: boolean;
	name: string;
	values: { [id: number]: string };
	valuesListNotePath: string;
}

export interface SuperchargedField {
	name: string;
	values: string[];
}
