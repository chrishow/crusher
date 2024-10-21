import { app, shell, BrowserWindow, ipcMain, Menu, MenuItem, dialog } from 'electron'
import * as fs from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { binaryPath } from './binary-path'
import { fileConverter } from './fileConverter';
import { readUserData, writeUserData } from './userData';


app.commandLine.appendSwitch('js-flags', '--max-old-space-size=81920')


let userData = readUserData();

function createWindow(): BrowserWindow {
	const binaryPathString: string = binaryPath();

	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 650,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		...(process.platform === 'linux' ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, '../preload/preload.js'),
			sandbox: false
		}
	})


	mainWindow.on('ready-to-show', () => {
		mainWindow.show()
		// mainWindow.webContents.openDevTools()

		// TEST: Send message to renderer
		mainWindow.webContents.send('log', join(binaryPathString, 'ffprobe'))

	})

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: 'deny' }
	})

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
	}

	// Context menu for 'inspect element'
	let rightClickPosition;
	const contextMenu = new Menu();
	const menuItem = new MenuItem
		(
			{
				label: 'Inspect Element',
				click: (): void => {
					mainWindow.webContents.inspectElement(rightClickPosition.x, rightClickPosition.y);
				}
			}
		);
	contextMenu.append(menuItem);

	mainWindow.webContents.on('context-menu', (_, params) => {
		rightClickPosition = { x: params.x, y: params.y };
		contextMenu.popup({ window: mainWindow });
	});

	return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId('com.electron')

	const mainWindow = createWindow();

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window)
	})

	// IPC test
	ipcMain.on('ping', () => console.log('pong'))

	ipcMain.on('start-compression', (_, args) => {
		console.log('Start compression event received: ', args.file.format.filename, args.resolution, args.size_id);
		let outputFile = '';

		const progressCallback = (progress): void => {
			mainWindow.webContents.send('compression-progress', { progress: progress, size_id: args.size_id });
		};

		const endCallback = (): void => {
			// Move file to ouput folder with new name
			// console.log('Compression complete, output file: ', outputFile);
			const newFileName = args.file.format.filename.split('/').pop().split('.').shift() + '-crushed-' + args.resolution + '.mp4';

			const newFilePath = join(userData.outputFolder, newFileName);

			// Move output file to new file path
			try {
				fs.renameSync(outputFile, newFilePath);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'EXDEV') {
					fs.copyFileSync(outputFile, newFilePath);
					fs.unlinkSync(outputFile);
				} else {
					throw error;
				}
			}
			mainWindow.webContents.send('compression-complete', { size_id: args.size_id, output_file: outputFile });
		};
		outputFile = fileConverter.compress(args.file.format.filename, args.resolution, progressCallback, endCallback);

	});

	ipcMain.on('start-over', () => {
		mainWindow.reload();
	});

	ipcMain.on('save-user-data', (_, data) => {
		writeUserData(data);
	});

	ipcMain.on('get-user-data', () => {
		return readUserData();
	});

	ipcMain.handle('download-file', (_, file) => {
		console.log('Download file event received: ', file);
		mainWindow.webContents.downloadURL('file://' + file);
	});

	ipcMain.handle('analyse', async (_, args) => {
		// console.log('Analyse event received, file is ', args)

		try {
			const result = await fileConverter.getMetadata(args);
			return result;
		} catch (error) {
			return { error: true, message: error };
		}
	});

	ipcMain.on('choose-output-folder', async () => {
		// console.log('Choose output folder event received: ', args);
		const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
			properties: ['openDirectory']
		})
		if (canceled) {
			return
		} else {
			const userData = readUserData();
			userData.outputFolder = filePaths[0];
			writeUserData(userData);
			mainWindow.webContents.send('set-output-folder', userData.outputFolder);
		}
	});

	ipcMain.on('get-output-folder', () => {
		userData = readUserData();
		mainWindow.webContents.send('set-output-folder', userData.outputFolder);
	});

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	});

	// mainWindow.webContents.session.on('x-will-download', (event, item, webContents) => {
	// 	// Set the save path, making Electron not to prompt a save dialog.
	// 	// item.setSavePath('/tmp/save.pdf')

	// 	item.on('updated', (event, state) => {
	// 		if (state === 'interrupted') {
	// 			console.log('Download is interrupted but can be resumed')
	// 		} else if (state === 'progressing') {
	// 			if (item.isPaused()) {
	// 				console.log('Download is paused')
	// 			} else {
	// 				console.log(`Received bytes: ${item.getReceivedBytes()}`)
	// 			}
	// 		}
	// 	})
	// 	item.once('done', (event, state) => {
	// 		if (state === 'completed') {
	// 			console.log('Download successfully')
	// 		} else {
	// 			console.log(`Download failed: ${state}`)
	// 		}
	// 	})
	// })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
