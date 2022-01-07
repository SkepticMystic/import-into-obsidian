/**
 * Select file(s).
 * @param {string} contentType The content type of files you wish to select. For instance, use "image/*" to select all types of images.
 * @param {boolean} multiple Indicates if the user can select multiple files.
 * @returns {Promise<File[]>} A promise of a file or array of files in case the multiple parameter is true.
 */
export function selectFile(
	contentType: string,
	multiple: boolean = false
): Promise<File[]> {
	return new Promise((resolve) => {
		let input = document.createElement("input");
		input.type = "file";
		input.multiple = multiple;
		input.accept = contentType;

		input.onchange = (_) => {
			let files = Array.from(input.files);
			if (multiple) resolve(files);
			else resolve(files);
		};

		input.click();
	});
}
