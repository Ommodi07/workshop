# OpenClaw App Skill

Use this skill scaffold to let your OpenClaw bot interact with the app generated
from your Nskills workflow.

## Installation

### Manual Installation

Copy this `skills` folder to one of these locations:

- Global: `~/.openclaw/skills/`
- Workspace: `<your-project>/skills/`

## Files

- `SKILL.md`: Main skill definition and execution rules for your app.

## Configuration

1. Open `SKILL.md`.
2. Replace all placeholders (for app name, endpoints, auth, and examples).
3. Set required environment variables in your OpenClaw environment.
4. Validate all API examples against your generated app routes.

## Quick Start

1. Fill in app metadata and endpoint sections in `SKILL.md`.
2. Add explicit dependency rules for IDs, addresses, or tokens.
3. Add guardrails for sensitive and high-impact actions.
4. Load the skill in OpenClaw and test with real user prompts.

## Publish on ClawHub

After your `README.md` and `SKILL.md` are ready, publish the skill on ClawHub:

1. Open [https://clawhub.ai/](https://clawhub.ai/) and go to **Upload**.
2. Drop your skill folder (must include `README.md` and `SKILL.md`).
3. Review slug, display name, version, and changelog.
4. Click **Publish skill**.
5. Wait for the security scan to complete.

### Upload screen

![Upload skill screen](/apps/web/public/assets/upload-skill.png)

### Publish form

![Publish skill form](/apps/web/public/assets/publish-skill.png)

### Published skill page

![Published skill page](/apps/web/public/assets/published-skill.png)

## Install from ClawHub

Once published, install the skill in OpenClaw with:

```bash
npx clawhub@latest install SKILL_NAME
```

## Example Prompts

```
"Check my app status and explain what is configured"

"Create a new record with these details: ..."

"Run this workflow step and show me the result"
```