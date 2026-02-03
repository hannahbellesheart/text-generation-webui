
# Electron Fiddle wrapper

This folder contains a ready-to-use Electron Fiddle launcher that lets you search/download models and open the web UI inside Electron.

## Quick start (Windows)

1) Double-click `set-env.bat` in this folder to set the repository path.
2) Open Electron Fiddle.
3) File → Open… and select this `electron-fiddle` folder.
4) Run the Fiddle.
5) Use the launcher window to start the server, download models, and open the web UI.

**Alternative**: If you prefer to set it manually, run this in Command Prompt before opening Electron Fiddle:
```
set TEXTGEN_REPO_ROOT=C:\full\path\to\text-generation-webui
```

## Notes

- The web UI window points to `http://127.0.0.1:7860/?__theme=dark` by default.
- You can override the URL by setting an environment variable before launching Electron Fiddle:
  - `TEXTGEN_URL=http://127.0.0.1:7860/`
- To set the repository root path (if Electron Fiddle can't find server.py):
  - `TEXTGEN_REPO_ROOT=C:\path\to\text-generation-webui`
- To use a different Python executable:
  - `TEXTGEN_PYTHON=python`
- To pass args to the server (space-separated):
  - `TEXTGEN_SERVER_ARGS=--listen --chat`

**Important**: When running from Electron Fiddle, make sure to open the `electron-fiddle` folder that is located inside your text-generation-webui repository. If you get "server.py not found" errors, set the `TEXTGEN_REPO_ROOT` environment variable to the full path of your text-generation-webui folder.

## Downloading a model (Windows)

Run:

- `download-model.bat organization/model`

Example:

- `download-model.bat facebook/opt-1.3b`
