import { App, Modal } from "obsidian";
import Breakdown from "./Components/Breakdown.svelte";
import ImportPlugin from "./main";

export class BreakdownModal extends Modal {
	plugin: ImportPlugin;

	constructor(app: App, plugin: ImportPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		new Breakdown({
			target: contentEl,
			props: {
				modal: this,
			},
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
