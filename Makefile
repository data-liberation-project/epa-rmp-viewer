.PHONY: venv date

date:
	@date

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
	mypy --strict --ignore-missing-imports scripts

viewer-serve:
	cd viewer && npm run dev

viewer-build:
	cd viewer && npm run build

submissions: date
	python scripts/00-extract-submissions.py --overwrite

facilities: date
	python scripts/01-extract-facilities.py

lookups: date
	python scripts/02-extract-lookups.py

gh-pages:
	git subtree push --prefix viewer/public origin gh-pages
