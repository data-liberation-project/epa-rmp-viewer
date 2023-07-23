import json
import sqlite3


INT_KEYS = [
    "ChemicalID",
]

def extract(
    cur: sqlite3.Cursor, table: str, key_col: str, value_col: str
) -> dict[str, str]:
    order_q = f"ORDER BY CAST({key_col} AS INT)" if key_col in INT_KEYS else f"ORDER BY {key_col}";
    query = f"SELECT {key_col}, {value_col} FROM {table} {order_q};"
    res = cur.execute(query)
    return {x[key_col]: x[value_col] for x in res}


def main() -> None:
    con = sqlite3.connect("data/raw/RMPData.sqlite")
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    with open("data/manual/lookup-keys.json") as f:
        lookup_keys = json.load(f)

    lookups = {keys[0]: extract(cur, *keys[1:]) for keys in lookup_keys}
    with open("viewer/public/data/lookups/lookups.json", "w") as f:
        json.dump(lookups, f, indent=2)


if __name__ == "__main__":
    main()
