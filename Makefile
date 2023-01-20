.PHONY: venv data/converted

requirements.txt: requirements.in
	pip-compile requirements.in

venv:
	python -m venv venv
	venv/bin/pip install -r requirements.txt

format:
	black scripts
	isort scripts

lint:
	black --check scripts
	isort --check scripts
	flake8 scripts
	mypy --strict scripts

viewer-serve:
	cd viewer && npm run dev

viewer-build:
	cd viewer && npm run build

data/converted:
	python scripts/00-extract-json.py --overwrite

gh-pages:
	git subtree push --prefix viewer/public origin gh-pages
