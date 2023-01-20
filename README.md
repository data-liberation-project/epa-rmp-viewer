# EPA RMP Submission Viewer

This repository aims to build a simple viewer for the raw, submission-level data from the EPA database of Risk Management Plans received by the Data Liberation Project via FOIA. It consists of two components:

- A Python script ([`scripts/00-extract-json.py`](scripts/00-extract-json.py)) that converts each RMP submission in the database into a JSON file.

- A simple Svelte app ([`viewer/`](viewer/)) that renders a given JSON file of the type generated above.

Ultimately, it's possible that this repo becomes the basis of a more fully-fledged website. For now, though, the focus is on making it easier to view RMP data from single submissions.

## Local Development

### SQLite->JSON converter

Follow these instructions to run the converter yourself.

#### Copy the main RMP SQLite file into `data/raw/`

If the `data/raw/` directory does not already exist, create it. Then, copy `RMPData.sqlite` into that directory.

#### Install the Python requirements

This project requires Python 3, and a few Python libraries. To install them, create a Python virtual environment (`make venv`) and activate it (`source venv/bin/activate`).

#### Tweak the conversion process

There are two ways to alter the conversion process:

- Modify the converter script, [`scripts/00-extract-json.py`](scripts/00-extract-json.py)
- Edit [`data/manual/tablemap.json`](data/manual/tablemap.json), which specifies the relationships between the tables and how they should be extracted. The structure is (currently, hopefully not for long) undocumented, but is hopefully somewhat clear from what is already there.

#### Create JSON files for each submission

Running `make data/converted` is the default command to generate the files. It's an alias to `python scripts/00-extract-json.py --overwrite`. Run `python scripts/00-extract-json.py --help` for more options.

### Submission viewer

Follow these instructions to modify the submission viewer.

#### Install the JavaScript requirements

```sh
cd viewer && npm install
```

#### Edit the Svelte code

The viewer is written as a Svelte app, with all relevant files in the [`viewer/`](viewer/) directory. The main source files are in [`viewer/src/`](viewer/src/).

## Questions / suggestions?

File them as an issue in this repository or email Jeremy at jsvine@gmail.com. 
