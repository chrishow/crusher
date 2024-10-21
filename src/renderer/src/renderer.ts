// import { ipcMain } from "electron";

const form = document.getElementById('form');
const step2 = document.getElementById('step-2');
const analyseButton = document.getElementById('analyse') as HTMLButtonElement;
const startCompressionButton = document.querySelector('#start-compression');
const cancelButton = document.querySelector('#start-over');

let currentlySelectedFile = null;

function init(): void {

	window.addEventListener('DOMContentLoaded', () => {
		doAThing()

		window.electron.ipcRenderer.send('get-output-folder');

		const fileInput = document.getElementById('file') as HTMLInputElement
		fileInput.addEventListener('change', () => {
			if (fileInput.files?.[0]) {
				console.log('File has changed to : ', fileInput.files?.[0])
				if (fileInput.files?.[0].type === 'video/mp4') {
					analyseButton.removeAttribute('disabled');
					analyse(fileInput.files?.[0]);
				} else {
					analyseButton.setAttribute('disabled', 'disabled');
					fileInput.value = '';
					alert('Please select a valid mp4 video file')
				}

			} else {
				analyseButton.setAttribute('disabled', 'disabled');
			}
		})

		analyseButton.addEventListener('click', (e) => {
			e.preventDefault()
			console.log('Analyse button clicked, file is ', fileInput.files?.[0])
			// window.electron.ipcRenderer.send('analyse', fileInput.files?.[0].path)

			analyse(fileInput.files?.[0]);

		});

		startCompressionButton?.addEventListener('click', () => {
			startCompression();
		});

		startCompressionButton?.addEventListener('update', () => {
			console.log('startCompressionButton: Update event received');
			const selectedSizes = document.querySelectorAll('#sizes input:checked');
			const outputFolder = document.getElementById('output-folder')?.textContent;
			console.log('Selected sizes: ', selectedSizes.length, 'Output folder: ', outputFolder);
			if (selectedSizes.length > 0 && outputFolder) {
				startCompressionButton?.removeAttribute('disabled');
			} else {
				startCompressionButton?.setAttribute('disabled', 'disabled');
			}
		});

		document.querySelectorAll('#sizes input').forEach((size) => {
			size.addEventListener('change', () => {
				startCompressionButton?.dispatchEvent(new Event('update'));
			});
		});

		document.querySelectorAll('#sizes > div').forEach((size) => {
			size.addEventListener('start-compression', () => {
				console.log('Starting compression for size: ', size.id);
				const resolution = size.id.split('-').pop();
				size.querySelector('input')!.setAttribute('disabled', 'disabled');

				window.electron.ipcRenderer.send('start-compression', { file: currentlySelectedFile, resolution: resolution, size_id: size.id });
			});
		});

		cancelButton?.addEventListener('click', () => {
			window.electron.ipcRenderer.send('start-over');
		});

		const chooseOutputFolderButton = document.getElementById('choose-output-folder-link');
		chooseOutputFolderButton?.addEventListener('click', (e) => {
			console.log('Choose output folder clicked');
			e.preventDefault();
			window.electron.ipcRenderer.send('choose-output-folder')
		});



	});


}


function analyse(file): void {
	window.electron.ipcRenderer.invoke('analyse', file.path).then((result) => {
		if (result.error === undefined) {
			console.log('Result from main process: ', result)
			showFileInformation(result)
		} else {
			showError(result.message);
		}
	});
}

function startCompression(): void {
	const selectedSizes = document.querySelectorAll('#sizes input:checked:not(:disabled)');
	selectedSizes.forEach((size) => {
		console.log('Compressing size: ', size);
		size.parentElement!.parentElement!.dispatchEvent(new Event('start-compression'));
	});
	startCompressionButton!.setAttribute('disabled', 'disabled');
	// cancelButton!.setAttribute('disabled', 'disabled');

}



function showFileInformation(metadata): void {
	form!.style.display = 'none';
	step2!.style.display = 'block';
	currentlySelectedFile = metadata;
	// const metadataDiv = document.getElementById('metadata')!
	document.getElementById('filename')!.textContent = metadata.format.filename.split('/').pop();
	document.getElementById('filesize')!.textContent = formatBytes(metadata.format.size);
	document.getElementById('width')!.textContent = metadata.streams[0].width;
	document.getElementById('height')!.textContent = metadata.streams[0].height;
	// metadataDiv.innerHTML = JSON.stringify(metadata, null, 2)
	[2160, 1080, 720].forEach((resolution) => {
		const sizeDiv = document.querySelector(`#sizes #size-${resolution}p`)!;

		if (Number(metadata.streams[0].height) >= resolution) {
			sizeDiv.removeAttribute('disabled');
			sizeDiv.querySelector('input')!.setAttribute('checked', 'checked');
			sizeDiv.querySelector('input')!.removeAttribute('disabled');
		} else {
			sizeDiv.setAttribute('disabled', 'disabled');
			sizeDiv.querySelector('input')!.removeAttribute('checked');
			sizeDiv.querySelector('input')!.setAttribute('disabled', 'disabled');
		}
	});

	startCompressionButton?.dispatchEvent(new Event('update'));
}

function doAThing(): void {
	const versions = window.electron.process.versions
	replaceText('.electron-version', `Electron v${versions.electron}`)
	replaceText('.chrome-version', `Chromium v${versions.chrome}`)
	replaceText('.node-version', `Node v${versions.node}`)

	const ipcHandlerBtn = document.getElementById('ipcHandler')
	ipcHandlerBtn?.addEventListener('click', () => {
		window.electron.ipcRenderer.send('ping')
	})
}

function replaceText(selector: string, text: string): void {
	const element = document.querySelector<HTMLElement>(selector)
	if (element) {
		element.innerText = text
	}
}

window.electron.ipcRenderer.on('set-output-folder', (_, message) => {

	const element = document.getElementById('output-folder');
	if (element) {
		element.textContent = message;
		console.log('Output folder set: ', message);
	}

	startCompressionButton?.dispatchEvent(new Event('update'));
});

window.electron.ipcRenderer.on('log', (_, message) => {
	console.log(message)
});


window.electron.ipcRenderer.on('showError', (_, message) => {
	showError(message)
});

function showError(message): void {
	alert("An error occurred!\n\nGuru meditation: \n\n " + message)
}

function formatBytes(bytes, decimals = 2): string {
	if (bytes == 0) return '0 Bytes';
	const k = 1024,
		dm = decimals || 2,
		sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Progress and completion events
window.electron.ipcRenderer.on('compression-progress', (_, message) => {
	console.log('Compression progress: ', message.progress.percent);
	const progressElement = document.querySelector(`#sizes #${message.size_id} progress`)! as HTMLProgressElement;
	console.log('Progress element: ', progressElement);
	if (message.progress.percent) {
		progressElement.style.display = 'block';
		progressElement.value = message.progress.percent;
	}

});

window.electron.ipcRenderer.on('compression-complete', (_, message) => {
	console.log('Compression complete: ', message)
	const sizeDiv = document.querySelector(`#sizes #${message.size_id}`)!;
	sizeDiv.classList.add('completed');
});


init()

