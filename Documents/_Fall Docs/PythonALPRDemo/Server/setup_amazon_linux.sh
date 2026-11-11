#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
sudo dnf install -y python3.11 python3.11-pip mesa-libGL glib2
python3.11 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python - <<'PY'
from pathlib import Path
import secrets, os
p=Path('token.txt')
if not p.exists():
    fd=os.open(p,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'w') as f:f.write(secrets.token_urlsafe(32)+'\n')
print('Token saved in server/token.txt; existing token preserved.')
from service import load_model
load_model()
print('Models downloaded and CPU initialization succeeded.')
PY
.venv/bin/python -m pip freeze > installed_versions.txt
