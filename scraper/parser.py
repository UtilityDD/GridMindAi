"""Parse the DCLorder.php HTML table into structured records."""

from __future__ import annotations

import re
from urllib.parse import urljoin, quote

from bs4 import BeautifulSoup

from config import SCRAPER_BASE_URL


def _safe_url(raw_href: str) -> str:
    """Build a fully-qualified, percent-encoded URL from a raw href."""
    parts = raw_href.split("/")
    encoded_parts = [quote(p, safe="") for p in parts]
    relative = "/".join(encoded_parts)
    return urljoin(SCRAPER_BASE_URL, relative)


def parse_circulars(html: str) -> list[dict]:
    """
    Return a list of dicts with keys:
      ref, title, keywords, date, pdf_url
    """
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id="tblData")
    if table is None:
        raise RuntimeError("Could not find table#tblData in the page HTML")

    records: list[dict] = []
    seen_urls: set[str] = set()

    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 5:
            continue

        ref_text = cells[1].get_text(strip=True)
        if not ref_text:
            continue

        title_cell = cells[2]
        hidden_tag = title_cell.find("h6", attrs={"hidden": True})
        keywords = ""
        if hidden_tag:
            keywords = hidden_tag.get_text(strip=True)
            hidden_tag.decompose()
        title = title_cell.get_text(" ", strip=True)
        title = re.sub(r"\s+", " ", title)

        date_text = cells[3].get_text(strip=True)

        link_tag = cells[4].find("a", href=True)
        if link_tag is None:
            continue
        raw_href = link_tag["href"].strip()
        pdf_url = _safe_url(raw_href)

        if pdf_url in seen_urls:
            continue
        seen_urls.add(pdf_url)

        records.append({
            "ref": ref_text,
            "title": title,
            "keywords": keywords,
            "date": date_text,
            "pdf_url": pdf_url,
        })

    return records
