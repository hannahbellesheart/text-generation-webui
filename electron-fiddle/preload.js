const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('textgen', {
	startServer: () => ipcRenderer.invoke('start-server'),
	openWebUI: () => ipcRenderer.invoke('open-web-ui'),
	downloadModel: (modelId) => ipcRenderer.invoke('download-model', modelId),
	listLocalModels: () => ipcRenderer.invoke('list-local-models'),
	onDownloadOutput: (handler) => {
		ipcRenderer.removeAllListeners('download-output');
		ipcRenderer.on('download-output', (_event, data) => handler(data));
	},
});
