"""Run the local transit API with bundled project dependencies."""

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent
SITE_PACKAGES = ROOT / ".venv" / "Lib" / "site-packages"

if SITE_PACKAGES.exists():
    sys.path.insert(0, str(SITE_PACKAGES))

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT.parent))

from web.app import app  # noqa: E402


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
