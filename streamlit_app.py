"""Streamlit Cloud entry point for the Chuncheon transit demo.

The main student web app is kept as a Vite/React project in this repository.
Streamlit Cloud runs this Python entry point, which launches the Streamlit
version of the transit experience.
"""

from pathlib import Path
import runpy


APP_PATH = Path(__file__).parent / "transit_backend" / "streamlit_app_2.py"
runpy.run_path(str(APP_PATH), run_name="__main__")
