import argparse
import json
import logging
import sqlite3
import typing
from pathlib import Path

logging.basicConfig()
logger = logging.getLogger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite cached conversions?",
    )
    parser.add_argument(
        "--start",
        type=int,
        help="Only start converting at the {n}th submission ID. Mainly useful for testing new parsing code.",  # noqa: E501
    )
    parser.add_argument(
        "--end",
        type=int,
        help="Stop after converting the {n}th submission ID. Mainly useful for testing new parsing code.",  # noqa: E501
    )
    parser.add_argument(
        "-s",
        "--submission",
        type=int,
        help="Test parsing for a single submission, writing results to stdout.",
    )
    parser.add_argument("--quiet", action="store_true", help="Silence the logger.")
    return parser.parse_args()


def get(
    cur: sqlite3.Cursor, table: str, id_col: str, id_value: typing.Union[str, int]
) -> list[dict[str, typing.Any]]:
    res = cur.execute(f"SELECT * FROM {table} WHERE {id_col} = ?;", [id_value])
    return list(map(dict, res))


def extract(
    cur: sqlite3.Cursor,
    *,
    table: str,
    key: str,
    value: typing.Union[str, int],
    key_parent: typing.Optional[str] = None,
    alias: typing.Optional[str] = None,
    skip: typing.Optional[list[str]] = None,
    children: typing.Optional[list[dict[str, typing.Any]]] = None,
    singleton: bool = False,
) -> typing.Union[dict[str, typing.Any], list[dict[str, typing.Any]]]:
    assert all((x is not None for x in [table, key, value]))
    raw = get(cur, table, key, value)
    for item in raw:
        for c in children or []:
            c_value = item[c.get("key_parent", c["key"])]
            item[f"_{c['alias']}"] = extract(cur, **c, value=c_value)

    final = [
        {key: value for key, value in entry.items() if key not in (skip or [])}
        for entry in raw
    ]
    if singleton is True:
        assert len(final) == 1
        return final[0]
    else:
        return final


def extract_submission(
    cur: sqlite3.Cursor, table_map: dict[str, typing.Any], sub_id: int
) -> dict[str, typing.Any]:
    sub = extract(cur, **table_map, value=sub_id)
    assert isinstance(sub, dict)
    return sub


def convert_all(
    cur: sqlite3.Cursor,
    table_map: dict[str, typing.Any],
    overwrite: bool = False,
    start: typing.Optional[int] = None,
    end: typing.Optional[int] = None,
) -> None:
    res = cur.execute("SELECT FacilityID FROM tblS1Facilities ORDER BY FacilityID;")
    for i, row in enumerate(list(res)):
        if start is not None and i < start:
            continue

        if end is not None and i > end:
            continue

        sub_id = row["FacilityID"]
        dest = Path(f"viewer/public/data/submissions/{sub_id}.json")

        if overwrite is False and dest.exists():
            continue

        logger.info(f"Converting #{i}: {sub_id}")
        c = extract_submission(cur, table_map, sub_id)
        with open(dest, "w") as f:
            json.dump(c, f, indent=2)


def main() -> None:
    con = sqlite3.connect("data/raw/RMPData.sqlite")
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    table_map = json.load(open("data/manual/tablemap.json"))
    args = parse_args()

    logging.getLogger().setLevel(logging.ERROR if args.quiet else logging.INFO)

    if args.submission is not None:
        res = extract_submission(cur, table_map, args.submission)
        print(json.dumps(res, indent=2))
    else:
        convert_all(
            cur, table_map, overwrite=args.overwrite, start=args.start, end=args.end
        )


if __name__ == "__main__":
    main()
