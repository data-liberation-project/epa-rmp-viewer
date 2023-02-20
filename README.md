# EPA RMP Submission Viewer

🌐 [data-liberation-project.github.io/epa-rmp-viewer](https://data-liberation-project.github.io/epa-rmp-viewer/)

This repository aims to build a simple browser and viewer for raw data extracted from [the EPA's Risk Management Program database, obtained by the Data Liberation Project via FOIA](https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit).

## Structure

The repository consists of two main components:

- Data extraction scripts, written in Python, in the ([`scripts/`](scripts/)) directory. These convert the RMP data in the database into  a JSON files — one per state, one per facility, and one per submission, plus a couple of auxiliary lookup files. The output is written to [`viewer/public/data/`](viewer/public/data/).

- A Svelte app ([`viewer/`](viewer/)) that renders the JSON files, providing a simple `state->facility->submission` browser. 

## Local Development

### SQLite->JSON converter

Follow these instructions to run the converter yourself.

#### Copy the main RMP SQLite files into `data/raw/`

- If the `data/raw/` directory does not already exist, create it.
- Download `RMPData.sqlite` and `RMPFac.sqlite` from [this Google Drive folder](https://drive.google.com/drive/folders/15mfQyTLvEywzQa_C0tBtWzrPE7ZawA7I).
- Copy those two files into `data/raw/`.

#### Install the Python requirements

This project requires Python 3, and a few Python libraries. To install them, create a Python virtual environment (`make venv`) and activate it (`source venv/bin/activate`).

#### Tweak the conversion process

There are two main ways to alter the conversion process:

- Modify the files in [`scripts/`](scripts/).
- Edit [`data/manual/tablemap.json`](data/manual/tablemap.json), which specifies the relationships between the tables and how they should be extracted. The structure is currently undocumented, but is hopefully somewhat clear from what is already there.

#### Create JSON files for each submission

- Run `make submissions` to regenerate the submission JSON files.
- Run `make facilities` to regenerate the facility-level and state-level files.
- Run `make lookups` to regenerate the [shortcude-lookup file](viewer/public/data/lookups/lookups.json).

### Frontend

Follow these instructions to modify the Svelte application.

#### Install the JavaScript requirements

```sh
cd viewer && npm install
```

#### Edit the Svelte code

The viewer is written as a Svelte app, with all relevant files in the [`viewer/`](viewer/) directory. The main source files are in [`viewer/src/`](viewer/src/).

## Licensing

This repository's code is available under the [MIT License terms](https://opensource.org/license/mit/). The data files are available under Creative Commons' [CC BY-SA 4.0 license terms](https://creativecommons.org/licenses/by-sa/4.0/).


## Questions / suggestions?

File them as an issue in this repository or email Jeremy at jsvine@gmail.com. 
