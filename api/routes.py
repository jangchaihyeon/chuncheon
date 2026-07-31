"""Vercel serverless entry point for the transit route API."""

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
TRANSIT_ROOT = ROOT / "transit_backend"
WEB_ROOT = TRANSIT_ROOT / "web"

for path in (ROOT, TRANSIT_ROOT, WEB_ROOT):
    path_string = str(path)
    if path_string not in sys.path:
        sys.path.insert(0, path_string)

from transit_backend.web.app import app  # noqa: E402
