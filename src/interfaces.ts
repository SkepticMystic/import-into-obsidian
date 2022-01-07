export interface Settings {
	fileColumnName: string;
	listDelimiter: string;
}

export type Cell = string | Record<string, any>;
export type Row = Record<string, Cell>;
