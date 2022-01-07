<script lang="ts">
	import { BreakdownModal } from "../BreakdownModal";
	import { FILE_DATED, FILE_EXISTING } from "../const";
	import { FileChange } from "../interfaces";

	export let modal: BreakdownModal;
	const { plugin } = modal;

	let selectedFiles: FileChange[] = [];

	const promiseBD = plugin.prepareBreakdown().then((bd) => {
		const [existings, nonExistings, dateds]: FileChange[][] = [[], [], []];

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
				const { file, input, type } = f;

				return (
					input !== change.input &&
					(!file || !change.file || file.path !== change.file.path)
				);
			});
		}
	}

	async function handleButton() {
		const bd = await promiseBD;
		const { json } = bd;
		await plugin.importData(json, selectedFiles);
		modal.close();
	}

	$: console.log(selectedFiles);
</script>

<div class="breakdown">
	{#await promiseBD}
		<div>Preparing...</div>
	{:then { existings, dateds, nonExistings, json }}
		<div class="existings">
			<h3 aria-label="An exact match was found for these files">
				Existing Files
			</h3>
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
		</div>
		<div class="dateds">
			<h3
				aria-label="An exact match wasn't found, but a date could be parsed from the name and succesfully associated with an existing file"
			>
				Dated Files
			</h3>
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
		</div>
		<div class="non-existings">
			<h3
				aria-label="No exact match or daily note was found for these files"
			>
				Non-existing Files
			</h3>
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
		</div>

		<button on:click={async () => handleButton()}>
			Import Selected Files
		</button>
	{/await}
</div>

<style>
	h3 {
		text-align: center;
	}

	.existings,
	.non-existings,
	.dateds {
		border: 1px solid var(--background-modifier-border);
		border-radius: 5px;
		padding: 0px 0px 10px 10px;
	}
</style>
