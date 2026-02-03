const modelsList = document.querySelector('[data-models-list]');
const searchInput = document.querySelector('[data-search-input]');
const searchButton = document.querySelector('[data-search-button]');
const searchResults = document.querySelector('[data-search-results]');
const downloadIdInput = document.querySelector('[data-download-id-input]');
const downloadIdButton = document.querySelector('[data-download-id-button]');
const downloadLog = document.querySelector('[data-download-log]');
const startServerButton = document.querySelector('[data-start-server]');
const openWebUiButton = document.querySelector('[data-open-webui]');
const statusLine = document.querySelector('[data-status-line]');
const refreshModelsButton = document.querySelector('[data-refresh-models]');

const setStatus = (text) => {
	statusLine.textContent = text;
};

const renderLocalModels = (models) => {
	modelsList.innerHTML = '';
	if (!models || !models.length) {
		const li = document.createElement('li');
		li.className = 'list-group-item';
		li.textContent = 'No local models found.';
		modelsList.appendChild(li);
		return;
	}

	models.forEach((name) => {
		const li = document.createElement('li');
		li.className = 'list-group-item';
		li.textContent = name;
		modelsList.appendChild(li);
	});
};

const searchModels = async (query) => {
	const url = new URL('https://huggingface.co/api/models');
	url.searchParams.set('pipeline_tag', 'text-generation');
	url.searchParams.set('sort', 'downloads');
	url.searchParams.set('direction', '-1');
	url.searchParams.set('limit', '20');
	if (query) {
		url.searchParams.set('search', query);
	}

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error('Failed to fetch model list');
	}
	return response.json();
};

const renderSearchResults = (models) => {
	searchResults.innerHTML = '';
	if (!models || !models.length) {
		const li = document.createElement('li');
		li.className = 'list-group-item';
		li.textContent = 'No models found.';
		searchResults.appendChild(li);
		return;
	}

	models.forEach((model) => {
		const li = document.createElement('li');
		li.className = 'list-group-item result-item';

		const label = document.createElement('div');
		label.className = 'fw-bold';
		label.textContent = model.id || 'Unknown model';

		const meta = document.createElement('div');
		meta.className = 'text-muted small';
		meta.textContent = `Downloads: ${model.downloads ?? 0}`;

		li.appendChild(label);
		li.appendChild(meta);
		li.addEventListener('click', () => {
			downloadIdInput.value = model.id || '';
			downloadIdInput.focus();
		});
		searchResults.appendChild(li);
	});
};

const handleDownload = async (modelId) => {
	if (!modelId || !modelId.trim()) {
		setStatus('Enter a valid model id.');
		return;
	}

	const trimmedId = modelId.trim();
	downloadLog.textContent = '';
	setStatus(`Downloading ${trimmedId}...`);
	
	try {
		const exitCode = await window.textgen.downloadModel(trimmedId);
		if (exitCode === 0) {
			setStatus(`Download complete: ${trimmedId}`);
			const localModels = await window.textgen.listLocalModels();
			renderLocalModels(localModels);
		} else {
			setStatus(`Download may have failed (exit code ${exitCode}). Check log.`);
		}
	} catch (error) {
		setStatus(`Download failed: ${error.message}`);
	}
};

window.textgen.onDownloadOutput((data) => {
	downloadLog.textContent += data;
	downloadLog.scrollTop = downloadLog.scrollHeight;
});

startServerButton.addEventListener('click', async () => {
	setStatus('Starting server...');
	try {
		const result = await window.textgen.startServer();
		if (result.success) {
			setStatus(result.message || 'Server started.');
		} else {
			setStatus(`Failed to start server: ${result.message}`);
		}
	} catch (error) {
		setStatus(`Error starting server: ${error.message}`);
	}
});

openWebUiButton.addEventListener('click', async () => {
	setStatus('Opening web UI...');
	try {
		const result = await window.textgen.openWebUI();
		if (result.success) {
			setStatus(result.message || 'Web UI opened.');
		} else {
			setStatus(`Failed to open web UI: ${result.message}`);
		}
	} catch (error) {
		setStatus(`Error opening web UI: ${error.message}`);
	}
});

searchButton.addEventListener('click', async () => {
	const query = searchInput.value.trim();
	setStatus('Searching models...');
	try {
		const results = await searchModels(query);
		if (results && Array.isArray(results)) {
			renderSearchResults(results);
			setStatus(`Found ${results.length} models.`);
		} else {
			setStatus('Invalid response from search.');
		}
	} catch (error) {
		setStatus(`Search failed: ${error.message}`);
		renderSearchResults([]);
	}
});

downloadIdButton.addEventListener('click', async () => {
	await handleDownload(downloadIdInput.value.trim());
});

searchInput.addEventListener('keydown', async (event) => {
	if (event.key === 'Enter') {
		await searchButton.click();
	}
});

downloadIdInput.addEventListener('keydown', async (event) => {
	if (event.key === 'Enter') {
		await downloadIdButton.click();
	}
});

refreshModelsButton.addEventListener('click', async () => {
	setStatus('Refreshing local models...');
	try {
		const localModels = await window.textgen.listLocalModels();
		if (localModels && Array.isArray(localModels)) {
			renderLocalModels(localModels);
			setStatus('Local models updated.');
		} else {
			setStatus('Warning: Invalid response from list-local-models.');
			renderLocalModels([]);
		}
	} catch (error) {
		setStatus(`Failed to read local models: ${error.message}`);
		renderLocalModels([]);
	}
});

const init = async () => {
	setStatus('Ready.');
	try {
		const localModels = await window.textgen.listLocalModels();
		if (localModels && Array.isArray(localModels)) {
			renderLocalModels(localModels);
		} else {
			setStatus('Warning: Could not load local models.');
			renderLocalModels([]);
		}
	} catch (error) {
		setStatus(`Warning: ${error.message}`);
		renderLocalModels([]);
	}
};

init();
