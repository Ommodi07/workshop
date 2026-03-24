# OpenClaw on Maxxit

Maxxit provides a managed OpenClaw instance for DeFi users. Instead of running the entire
stack yourself, you get a dedicated OpenClaw runtime wired to your wallet, model, and
trading skills — accessible directly from Telegram.

> Dashboard: https://www.maxxit.ai/openclaw

## Setup flow

When you onboard OpenClaw via Maxxit you will:

1. **Connect your wallet**  
   Authenticate with the wallet you want Maxxit/OpenClaw to use for identity and
   trading actions.

2. **Choose a plan (starter or pro)**  
   Select the plan that matches your expected usage and LLM budget.

3. **Choose an AI model**  
   Pick which model powers your OpenClaw instance (for example Anthropic, OpenAI, or
   other supported providers).

4. **Connect your Telegram bot**  
   Provide your Telegram bot token so that OpenClaw can talk to you from Telegram and
   other supported surfaces.

5. **Managed OpenAI key**  
   Maxxit provisions and manages the OpenAI key for you under your chosen plan, so you
   do not need to handle keys manually.

6. **Optional Maxxit trading skill**  
   You can enable Maxxit’s DeFi trading skill so that your OpenClaw bot can take and
   manage trades on your behalf, subject to the permissions and safeguards you configure.

## How this relates to your blueprint

The `openclaw-agent` node in this blueprint describes how you want OpenClaw to be used
in your architecture. Combine the instructions in this file with the prompt in
`openclaw-agent.md` and your Maxxit dashboard at:

> https://www.maxxit.ai/openclaw

to finish wiring your personal assistant into the generated application.