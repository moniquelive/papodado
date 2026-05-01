#!/usr/bin/env python3
"""Build static data files for Projeto 03.

Credentials are intentionally read from environment variables so API tokens and
passwords never land in the repository or generated public assets.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


API_BASE = "https://api-service.fogocruzado.org.br/api/v2"
BAIRROS_URL = "https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Cartografia/Limites_administrativos/FeatureServer/4/query"
PROJECT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_DIR / "static" / "assets" / "projects"
BAIRROS_PATH = OUTPUT_DIR / "projeto-03-bairros.geojson"
OCCURRENCES_PATH = OUTPUT_DIR / "projeto-03-occurrences.json"


def request_json(url: str, *, method: str = "GET", body: dict | None = None, token: str | None = None) -> dict:
    payload = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=payload, method=method)
    request.add_header("Accept", "application/json")
    request.add_header(
        "User-Agent",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    )

    if body is not None:
        request.add_header("Content-Type", "application/json")

    if token:
        request.add_header("Authorization", f"Bearer {token}")

    try:
        with urllib.request.urlopen(request, timeout=75) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code} for {url}: {detail[:700]}") from error


def api_url(path: str, params: dict | None = None) -> str:
    url = f"{API_BASE}{path}"
    if params:
        url = f"{url}?{urllib.parse.urlencode(params, doseq=True)}"
    return url


def complete_month_range(months: int = 24) -> tuple[str, str]:
    today = dt.date.today()
    first_current_month = today.replace(day=1)
    last_complete_month_end = first_current_month - dt.timedelta(days=1)
    start_year = last_complete_month_end.year
    start_month = last_complete_month_end.month - months + 1

    while start_month <= 0:
        start_month += 12
        start_year -= 1

    return f"{start_year:04d}-{start_month:02d}-01", last_complete_month_end.isoformat()


def download_bairros() -> dict:
    params = {
        "where": "1=1",
        "outFields": "nome,regiao_adm,codbairro,codra,codbnum",
        "returnGeometry": "true",
        "outSR": "4326",
        "geometryPrecision": "5",
        "f": "geojson",
    }
    data = request_json(f"{BAIRROS_URL}?{urllib.parse.urlencode(params)}")

    for feature in data.get("features", []):
        properties = feature.get("properties") or {}
        feature["properties"] = {
            "nome": str(properties.get("nome", "")).strip(),
            "regiao_adm": str(properties.get("regiao_adm", "")).strip(),
            "codbairro": str(properties.get("codbairro", "")).strip(),
            "codra": properties.get("codra"),
            "codbnum": properties.get("codbnum"),
        }

    BAIRROS_PATH.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return data


def as_float(value: object) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if number != number:
        return None


    return number


def count_victims(victims: list[dict]) -> tuple[int, int]:
    dead = 0
    wounded = 0

    for victim in victims:
        situation = str(victim.get("situation") or "").lower()

        if "dead" in situation or "morto" in situation or "morta" in situation:
            dead += 1
        elif "wound" in situation or "ferid" in situation:
            wounded += 1

    return dead, wounded


def normalize_occurrence(item: dict) -> dict | None:
    lat = as_float(item.get("latitude"))
    lon = as_float(item.get("longitude"))

    if lat is None or lon is None:
        return None

    victims = item.get("victims") or []
    dead, wounded = count_victims(victims if isinstance(victims, list) else [])
    context_info = item.get("contextInfo") or {}
    main_reason = context_info.get("mainReason") or {}
    neighborhood = item.get("neighborhood") or {}

    return {
        "id": str(item.get("id") or item.get("documentNumber") or ""),
        "documentNumber": item.get("documentNumber"),
        "date": item.get("date"),
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "neighborhood": str(neighborhood.get("name") or "").strip(),
        "policeAction": bool(item.get("policeAction")),
        "agentPresence": bool(item.get("agentPresence")),
        "dead": dead,
        "wounded": wounded,
        "victims": dead + wounded,
        "mainReason": str(main_reason.get("name") or "Não identificado").strip(),
    }


def login(email: str, password: str) -> str:
    response = request_json(
        api_url("/auth/login"),
        method="POST",
        body={"email": email, "password": password},
    )
    token = (response.get("data") or {}).get("accessToken")

    if not token:
        raise RuntimeError("Fogo Cruzado login did not return an access token")

    return str(token)


def find_rio_city(token: str) -> tuple[str, str]:
    response = request_json(api_url("/cities", {"cityName": "RIO DE JANEIRO"}), token=token)
    cities = response.get("data") or []

    for city in cities:
        if str(city.get("name") or "").upper() == "RIO DE JANEIRO":
            state = city.get("state") or {}
            return str(city.get("id")), str(state.get("id"))

    raise RuntimeError("Could not find the Rio de Janeiro city id in Fogo Cruzado")


def download_occurrences(token: str, city_id: str, state_id: str, initial_date: str, final_date: str) -> dict:
    page = 1
    take = 500
    rows: list[dict] = []

    while True:
        params = {
            "order": "ASC",
            "page": page,
            "take": take,
            "initialdate": initial_date,
            "finaldate": final_date,
            "idState": state_id,
            "idCities": city_id,
        }
        response = request_json(api_url("/occurrences", params), token=token)
        page_data = response.get("data") or []

        for item in page_data:
            normalized = normalize_occurrence(item)
            if normalized:
                rows.append(normalized)

        page_meta = response.get("pageMeta") or {}
        print(f"Fetched page {page}: {len(page_data)} records", flush=True)

        if not page_meta.get("hasNextPage"):
            break

        page += 1
        time.sleep(0.18)

    result = {
        "source": "Fogo Cruzado API v2",
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "city": "Rio de Janeiro",
        "initialDate": initial_date,
        "finalDate": final_date,
        "fields": [
            "id",
            "documentNumber",
            "date",
            "lat",
            "lon",
            "neighborhood",
            "policeAction",
            "agentPresence",
            "dead",
            "wounded",
            "victims",
            "mainReason",
        ],
        "occurrences": rows,
    }
    OCCURRENCES_PATH.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return result


def main() -> int:
    email = os.environ.get("FOGO_CRUZADO_EMAIL")
    password = os.environ.get("FOGO_CRUZADO_PASSWORD")

    if not email or not password:
        print("Set FOGO_CRUZADO_EMAIL and FOGO_CRUZADO_PASSWORD before running this script.", file=sys.stderr)
        return 2

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    initial_date, final_date = complete_month_range()

    bairros = download_bairros()
    print(f"Wrote {BAIRROS_PATH.relative_to(PROJECT_DIR)} with {len(bairros.get('features', []))} bairros")

    token = login(email, password)
    city_id, state_id = find_rio_city(token)
    occurrences = download_occurrences(token, city_id, state_id, initial_date, final_date)
    print(
        f"Wrote {OCCURRENCES_PATH.relative_to(PROJECT_DIR)} with "
        f"{len(occurrences['occurrences'])} occurrences from {initial_date} to {final_date}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
