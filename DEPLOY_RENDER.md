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

## 2. Auto-deploy on every push

`render.yaml` sets **`autoDeployTrigger: commit`** for **newruz-api** and **newruz-web**. After your repo is connected to Render:

1. Commit and push to **`main`** on GitHub:
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```
2. Render starts a new deploy for both services (usually within a minute).
3. In the [Render Dashboard](https://dashboard.render.com/), each service → **Settings** → confirm **Auto-Deploy** is **On** and **Branch** is **main**.

If pushes do not deploy: open your **Blueprint** → **Settings** → turn **Auto Sync** **On**, then **Manual Sync** once after updating `render.yaml`.

**Important:** Render only sees changes you **push to GitHub**. Saving files locally does not redeploy production.

## 3. Push code to Git

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

## 4. Deploy with Blueprint (recommended)

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

## 5. Post-deploy setup

In the **newruz-api** service → **Environment**:

### Email (required for verification links)

**Render blocks Gmail SMTP** (`Network is unreachable`). Use [Resend](https://resend.com) (free tier):

1. Sign up at https://resend.com → **API Keys** → create key
2. Add to **newruz-api** environment:
   - `RESEND_API_KEY` = `re_...`
   - `RESEND_FROM_EMAIL` = `NewRuz <onboarding@resend.dev>` (testing) or your verified domain address
3. Redeploy **newruz-api**
4. Check https://newruz-api.onrender.com/api/auth/email-status/ → `"delivery_method": "resend"`

Until you verify a domain on Resend, `onboarding@resend.dev` may only deliver to the email you used for your Resend account. To email any user (e.g. mentees/mentors), add and verify your domain in Resend.

### Google OAuth (optional)

| Variable | Example |
|----------|---------|
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://newruz-web.onrender.com/oauth/google/callback` |

Run migrations / create admin (one-off shell or locally against prod DB):

```bash
render ssh newruz-api
python manage.py migrate
python manage.py createsuperuser
```

Or from dashboard: **newruz-api** → **Shell**.

## 6. CLI commands

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

## 7. Free tier notes

- Services spin down after inactivity; first request may take ~30s.
- PostgreSQL free DB expires after 90 days (export data before then).
- Set `DEBUG=false` in production (already in `render.yaml`).
