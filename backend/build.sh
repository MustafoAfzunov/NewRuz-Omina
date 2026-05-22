#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --noinput
# Create admin on deploy (no Render Shell needed). Set ADMIN_EMAIL + ADMIN_PASSWORD in Render env.
python manage.py ensure_admin
