import { NodePickedFile, WebPickedFile } from 'filesystem';
import { Platform, Plugin, normalizePath } from 'obsidian';


export default class FileImporterPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'import',
			name: 'Import file to current folder',
			checkCallback: (checking: boolean) => {
				const folder = this.app.workspace.getActiveFile()?.parent;
				if (!folder) return false;

				if (!checking) {
					for (const file of this.getFile() ?? []) {
						file.read()
							.then(async (buffer) => {
								const tFile = await this.app.vault.createBinary(
									// @ts-ignore
									this.app.vault.getAvailablePath(normalizePath(folder.path + '/' + file.basename), file.extension),
									buffer
								);

								this.app.workspace.getLeaf(true).openFile(tFile);
							})
					}
				}

				return true;
			}
		});
	}

	/**
	 * Taken from Obsidian Importer, which is distributed under the MIT license:
	 * https://github.com/obsidianmd/obsidian-importer?tab=MIT-1-ov-file#readme
	 * 
	 * Original: https://github.com/obsidianmd/obsidian-importer/blob/13604d6fb2d103b25cca4899aba9fc236825c5a7/src/format-importer.ts#L37
	 */
	getFile(options?: { name?: string, extensions?: string[], allowMultiple?: boolean }) {
		const name = options?.name;
		const extensions = options?.extensions;
		const allowMultiple = options?.allowMultiple ?? false;

		if (Platform.isDesktopApp) {
			let properties = ['openFile', 'dontAddToRecent'];
			if (allowMultiple) {
				properties.push('multiSelections');
			}
			// @ts-ignore
			let filePaths: string[] = window.electron.remote.dialog.showOpenDialogSync({
				title: 'Pick files to import', properties,
				filters: name && extensions ? [{ name, extensions }] : [],
			});

			if (filePaths && filePaths.length > 0) {
				return filePaths.map((filepath: string) => new NodePickedFile(filepath));
			}
		}
		else {
			let inputEl = createEl('input');
			inputEl.type = 'file';
			if (extensions) {
				inputEl.accept = extensions.map(e => '.' + e.toLowerCase()).join(',');
			}
			inputEl.addEventListener('change', () => {
				if (!inputEl.files) return;
				let files = Array.from(inputEl.files);
				if (files.length > 0) {
					return files.map(file => new WebPickedFile(file))
						.filter(file => extensions ? extensions.contains(file.extension) : true);
				}
			});
			inputEl.click();
		}
	}
}
