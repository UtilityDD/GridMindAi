"""Fetch the DCLorder.php page HTML."""

import requests
from config import SCRAPER_URL


def fetch_page() -> str:
    """Download the orders & circulars page and return raw HTML."""
    resp = requests.get(SCRAPER_URL, timeout=30)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding or "utf-8"
    return resp.text
