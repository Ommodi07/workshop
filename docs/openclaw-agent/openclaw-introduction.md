# OpenClaw — Personal AI Assistant

OpenClaw is a personal AI assistant you run on your own devices. It connects to the
channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal,
iMessage, Microsoft Teams, WebChat, and more), can speak and listen on macOS/iOS/Android,
and can drive a live Canvas you control. The Gateway is just the control plane — the
product is the assistant that actually does the work.

## Why use OpenClaw?

- **Runs on your own machines** (Mac, Windows, Linux) so your data and API keys stay
  under your control.
- **Multi‑channel inbox** across chat apps, with routing rules for groups, DMs, and
  different agents.
- **First‑class tools and skills** for browser automation, cron jobs, file access,
  nodes, and custom workflows you can extend yourself.
- **Persistent memory** so your assistant becomes uniquely yours over time.

## Quick start (local install)

Runtime requirement: Node \u2265 22.

Install the CLI and run the onboarding wizard:

\``bash
npm install -g openclaw@latest

openclaw onboard --install-daemon
\``

Then start the gateway and send your first message:

\``bash
openclaw gateway --port 18789 --verbose

openclaw message send --to +1234567890 --message "Hello from OpenClaw"
\``

## Official links

- Website: https://openclaw.ai/
- GitHub: https://github.com/openclaw/openclaw

## Using this node

In your Nskills app, the `openclaw-agent` node is a prompt‑driven block.
The prompt you provide in the canvas UI is written to `openclaw-agent.md` in this
repository so you can hand the same context to your OpenClaw setup or other agents.