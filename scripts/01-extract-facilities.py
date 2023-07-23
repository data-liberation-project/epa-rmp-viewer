import json
import sqlite3
import typing
from itertools import groupby
from operator import itemgetter

import us

DATA_PATH = "viewer/public/data"

with open("data/manual/counties.json") as f:
    COUNTIES = {x["fips"]: x["name"] for x in json.load(f)}

with open("data/manual/county-fips-fixes.json") as f:
    FIPS_FIXES = json.load(f)


def get_raw(db_path: str, query: str) -> list[dict[str, typing.Any]]:
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    res = con.cursor().execute(query)
    return list(map(dict, res))


FACILITIES_QUERY = open("sql/facilities.sql").read()


def get_facilities() -> list[dict[str, typing.Any]]:
    facilities = get_raw("data/raw/RMPData.sqlite", FACILITIES_QUERY)

    for fac in facilities:
        fac_id = fac["EPAFacilityID"]
        fix = FIPS_FIXES.get(fac_id)
        if fix:
            fac["county_fips"] = fix
        elif fac["county_fips"] is None:
            raise ValueError(fac)
        fac["submissions"] = json.loads(fac["submissions"])
        fac["accidents"] = json.loads(fac["accidents"] or "[]")
        fac["names_all"] = json.loads(fac["names_all"])
        fac["names_prev"] = [
            x
            for x in fac["names_all"]
            if x.upper().strip() != fac["name"].upper().strip()
        ]
        del fac["names_all"]

    return facilities


def make_fac_summary(fac: dict[str, typing.Any]) -> dict[str, typing.Any]:
    core = {
        k: fac[k]
        for k in [
            "EPAFacilityID",
            "name",
            "city",
            "address",
            "names_prev",
        ]
    }
    last = fac["submissions"][0]
    core["sub_last"] = {
        k: last[k]
        for k in [
            "id",
            "date_val",
            "date_dereg",
            "lat_sub",
            "lon_sub",
            "num_accidents",
            "latest_accident",
        ]
    }
    return core


def write_states(facilities: list[dict[str, typing.Any]]) -> None:
    counts = []
    key = itemgetter("state")
    for state, _state_facs in groupby(sorted(facilities, key=key), key):
        state_facs = list(_state_facs)

        name = us.states.lookup(state).name
        counts.append(dict(abbr=state, name=name, count=len(state_facs)))

        dest = f"{DATA_PATH}/facilities/by-state/{state}.json"

        with open(dest, "w") as f:
            county_key = itemgetter("county_fips")
            by_county = [
                dict(
                    fips=fips,
                    name=COUNTIES[fips],
                    facilities=list(map(make_fac_summary, county_facs)),
                )
                for fips, county_facs in groupby(
                    sorted(state_facs, key=county_key), county_key
                )
            ]
            json.dump(dict(abbr=state, name=name, counties=by_county), f, indent=2)

    with open(f"{DATA_PATH}/facilities/states.json", "w") as f:
        json.dump(counts, f, indent=2)


def write_facilities(facilities: list[dict[str, typing.Any]]) -> None:
    for fac in facilities:
        dest = f"{DATA_PATH}/facilities/detail/{fac['EPAFacilityID']}.json"
        with open(dest, "w") as f:
            json.dump(fac, f, indent=2)


def main() -> None:
    facilities = get_facilities()
    write_states(facilities)
    write_facilities(facilities)


if __name__ == "__main__":
    main()
