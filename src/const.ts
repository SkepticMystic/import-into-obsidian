import { Settings } from "./interfaces";

export const DEFAULT_SETTINGS: Settings = {
	fileColumnName: "file",
	listDelimiter: ",",
	importNestedFields: true,
};

export const FILE_EXISTING = "existing-file";
export const FILE_DATED = "dated-file";
export const FILE_NON_EXISTING = "non-existing-file";
