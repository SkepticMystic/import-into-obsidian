import { TFile } from "obsidian";
import { FILE_EXISTING, FILE_DATED, FILE_NON_EXISTING } from "./const";

export interface Settings {
	fileColumnName: string;
	listDelimiter: string;
	importNestedFields: boolean;
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
