<script lang="ts">
	import { BreakdownModal } from "../BreakdownModal";
	import { FILE_DATED, FILE_EXISTING } from "../const";
	import { FileChange } from "../interfaces";

	export let modal: BreakdownModal;
	const { plugin } = modal;
	const { fileColumnName } = plugin.settings;

	let selectedFiles: FileChange[] = [];
	let [selectedCols, detectedCols]: string[][] = [[], []];

	const promiseBD = plugin.prepareBreakdown().then((bd) => {
		const [existings, nonExistings, dateds]: FileChange[][] = [[], [], []];
		detectedCols = bd.colNames.filter((col) => col != fileColumnName);
		selectedCols = detectedCols;

		bd.fileChanges.forEach((change) => {
			if (change.type === FILE_EXISTING) existings.push(change);
			else if (change.type === FILE_DATED) dateds.push(change);
			else nonExistings.push(change);
		});

		selectedFiles.push(...existings, ...nonExistings, ...dateds);
		return {
			existings,
			nonExistings,
			dateds,
			json: bd.json,
		};
	});

	function handleCheck(
		e: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		},
		change: FileChange
	) {
		const { checked } = e.target as HTMLInputElement;

		if (checked) {
			selectedFiles = [...selectedFiles, change];
		} else {
			selectedFiles = selectedFiles.filter((f) => {
				const { file, input } = f;
				return (
					input !== change.input &&
					(!file || !change.file || file.path !== change.file.path)
				);
			});
		}
	}

	/** Determine whether the button to toggle this array should empty or fill the array */
	const toNone = (arr: any[]) => arr.length;

	async function handleButton() {
		const bd = await promiseBD;
		const { json } = bd;
		await plugin.importData(json, selectedFiles, selectedCols);
		modal.close();
	}
</script>

<div class="breakdowns">
	{#await promiseBD}
		<div>Preparing...</div>
	{:then { existings, dateds, nonExistings, json }}
		<details class="breakdown existings">
			<summary>
				<h4 aria-label="An exact match was found for these files">
					Existing Files
				</h4>
				<span class="count">{existings.length}</span>
			</summary>
			{#each existings as change}
				<div class="file-change">
					<label>
						<input
							checked={true}
							type="checkbox"
							on:change={(e) => handleCheck(e, change)}
						/>
						<span class="file-change-name"
							>{change.file.basename}</span
						>
					</label>
				</div>
			{/each}
		</details>
		<details class="breakdown dateds">
			<summary>
				<h4
					aria-label="An exact match wasn't found, but a date could be parsed from the name and associated with an existing file"
				>
					Dated Files
				</h4>
				<span class="count">{dateds.length}</span>
			</summary>
			{#each dateds as change}
				<div class="file-change">
					<label>
						<input
							checked={true}
							type="checkbox"
							on:change={(e) => handleCheck(e, change)}
						/>
						<span class="file-change-input">{change.input}</span>
						→
						<span class="file-change-name"
							>{change.file.basename}</span
						>
					</label>
				</div>
			{/each}
		</details>
		<details class="breakdown non-existings">
			<summary>
				<h4
					aria-label="No exact match or daily note was found for these files. A new note will be created."
				>
					Non-existing Files
				</h4>
				<span class="count">{nonExistings.length}</span>
			</summary>
			{#each nonExistings as change}
				<div class="file-change">
					<label>
						<input
							checked={true}
							type="checkbox"
							on:change={(e) => handleCheck(e, change)}
						/>
						<span class="file-change-name">{change.input}</span>
					</label>
				</div>
			{/each}
		</details>
		<details class="breakdown detected-cols">
			<summary>
				<h4
					aria-label="List of detected columns. All selected columns will be imported."
				>
					Detected Columns
				</h4>
				<span class="count">{detectedCols.length}</span>
				<button
					class="toggle-button"
					on:click={() => {
						if (toNone(selectedCols)) selectedCols = [];
						else selectedCols = detectedCols;
					}}>{toNone(selectedCols) ? "None" : "All"}</button
				>
			</summary>
			<!-- TODO: add a "select/unselect all" button here-->
			{#each detectedCols as col}
				<div class="file-change">
					<label>
						<input
							checked={true}
							type="checkbox"
							value={col}
							bind:group={selectedCols}
						/>
						<span class="file-change-name">{col}</span>
					</label>
				</div>
			{/each}
		</details>

		<button class="import-button" on:click={async () => handleButton()}>
			Import Selected Files
		</button>
	{/await}
</div>

<style>
	h4 {
		text-align: center;
		display: inline-block;
		margin-top: 10px;
		margin-bottom: 0px;
	}

	.breakdown {
		border: 1px solid var(--background-modifier-border);
		border-radius: 5px;
		padding: 0px 0px 10px 10px;
	}

	span.count {
		background-color: var(--background-secondary-alt);
		padding: 2px 4px;
		border-radius: 3px;
		font-size: 12px;
		line-height: 12px;
	}
	span.count:hover {
		background-color: var(--interactive-accent);
	}

	button.toggle-button {
		padding: 2px 5px 3px 5px;
	}
	button.toggle-button:hover {
		background-color: var(--interactive-accent);
		cursor: pointer;
	}

	button.import-button {
		margin-top: 10px;
	}
</style>
