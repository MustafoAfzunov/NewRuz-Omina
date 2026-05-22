# Deploy NewRuz to Render

## 1. Render CLI (installed)

```bash
export PATH="$HOME/.local/bin:$PATH"
render --version
```

Log in (opens browser):

```bash
render login
```

Create an API key for CI/scripts: [Render Dashboard → Account → API Keys](https://dashboard.render.com/u/settings#api-keys)

```bash
export RENDER_API_KEY="rnd_..."
```

## 2. Push code to Git

Render deploys from **GitHub**, **GitLab**, or **Bitbucket** — not from your laptop alone.

```bash
cd /home/student/NewRuzOrginal
git init
git add .
git commit -m "Prepare NewRuz for Render deployment"
```

Create a repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USER/NewRuz.git
git branch -M main
git push -u origin main
```

## 3. Deploy with Blueprint (recommended)

1. Open [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
2. Connect your GitHub account and select the **NewRuz** repository
3. Render detects `render.yaml` and creates:
   - **newruz-db** — PostgreSQL
   - **newruz-api** — Django API (`/api/...`)
   - **newruz-web** — React static site
4. Click **Apply** / **Deploy Blueprint**

After deploy:

| Service | URL (example) |
|---------|----------------|
| Frontend | `https://newruz-web.onrender.com` |
| API | `https://newruz-api.onrender.com/api/` |

## 4. Post-deploy setup

In the **newruz-api** service → **Environment**:

| Variable | Example |
|----------|---------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_HOST_USER` | your Gmail |
| `EMAIL_HOST_PASSWORD` | app password |
| `DEFAULT_FROM_EMAIL` | `NewRuz <you@gmail.com>` |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://newruz-web.onrender.com/oauth/google/callback` |

Run migrations / create admin (one-off shell or locally against prod DB):

```bash
render ssh newruz-api
python manage.py migrate
python manage.py createsuperuser
```

Or from dashboard: **newruz-api** → **Shell**.

## 5. CLI commands

Validate blueprint:

```bash
render blueprints validate render.yaml
```

List services:

```bash
render services list
```

Trigger redeploy:

```bash
render deploys create SERVICE_ID --confirm
```

## 6. Free tier notes

- Services spin down after inactivity; first request may take ~30s.
- PostgreSQL free DB expires after 90 days (export data before then).
- Set `DEBUG=false` in production (already in `render.yaml`).
