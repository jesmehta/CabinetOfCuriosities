@rem Start the local Now editor, from this repository's own folder, wherever the repository lives.
@rem Then open http://127.0.0.1:5757/admin/
@rem If .venv exists (see DEPLOYMENT.md), activate it first so python and mkdocs are the
@rem pinned versions from requirements-lock.txt, the same as the site build.
cd /d "%~dp0"
if exist ".venv\Scripts\activate.bat" call ".venv\Scripts\activate.bat"
node tools\now-editor.js
