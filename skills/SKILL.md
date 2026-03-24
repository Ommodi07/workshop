---
emoji: 🤖
name: {{SKILL_SLUG}}
version: 0.1.0
author: {{AUTHOR_NAME}}
description: {{SHORT_DESCRIPTION}}
homepage: {{HOMEPAGE_URL}}
repository: {{REPOSITORY_URL}}
disableModelInvocation: true
requires:
  env:
    - {{ENV_VAR_1}}
    - {{ENV_VAR_2}}
metadata:
  openclaw:
    requiredEnv:
      - {{ENV_VAR_1}}
      - {{ENV_VAR_2}}
    bins:
      - curl
    primaryCredential: {{ENV_VAR_1}}
---

# {{SKILL_NAME}}

{{SKILL_OVERVIEW}}

## When to Use This Skill

- {{WHEN_TO_USE_1}}
- {{WHEN_TO_USE_2}}
- {{WHEN_TO_USE_3}}
- {{WHEN_TO_USE_4}}

---

## Critical API Rules

> Never guess required request values. Every required parameter must come from:
> 1) explicit user input, or 2) a prior trusted endpoint response.

### Parameter Dependency Map

| Parameter | Source | How to resolve |
|-----------|--------|----------------|
| {{PARAM_1}} | {{SOURCE_1}} | {{RESOLUTION_1}} |
| {{PARAM_2}} | {{SOURCE_2}} | {{RESOLUTION_2}} |
| {{PARAM_3}} | {{SOURCE_3}} | {{RESOLUTION_3}} |
| {{PARAM_4}} | {{SOURCE_4}} | {{RESOLUTION_4}} |

### Mandatory Workflow Rules

1. Call prerequisite endpoints first to resolve IDs, addresses, or session state.
2. Ask the user for any business-critical parameter not yet provided.
3. Validate allowed values before calling write endpoints.
4. Confirm high-impact or irreversible operations before execution.
5. If a dependency is missing, stop and resolve it before proceeding.

### Pre-Flight Checklist

```
[] Do I have all required auth/context values?
[] Did every request parameter come from user input or trusted API response?
[] Did I validate endpoint-specific constraints and enums?
[] Is this action high-impact, and if yes, did I ask for confirmation?
[] Do I have a clear error fallback if the call fails?
```

---

## Authentication

{{AUTH_DESCRIPTION}}

Example headers:

```bash
curl -L -X GET "${API_BASE_URL}{{HEALTH_PATH}}" \
  -H "Authorization: Bearer ${API_KEY}"
```

## API Endpoints

### {{ENDPOINT_NAME_1}}

{{ENDPOINT_PURPOSE_1}}

```bash
curl -L -X {{HTTP_METHOD_1}} "${API_BASE_URL}{{PATH_1}}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "{{REQ_KEY_1}}": "{{REQ_VALUE_1}}",
    "{{REQ_KEY_2}}": "{{REQ_VALUE_2}}"
  }'
```

Expected response shape:

```json
{
  "success": true,
  "{{RESP_KEY_1}}": "{{RESP_VALUE_1}}"
}
```

### {{ENDPOINT_NAME_2}}

{{ENDPOINT_PURPOSE_2}}

```bash
curl -L -X {{HTTP_METHOD_2}} "${API_BASE_URL}{{PATH_2}}" \
  -H "Authorization: Bearer ${API_KEY}"
```

Expected response shape:

```json
{
  "success": true,
  "{{RESP_KEY_2}}": "{{RESP_VALUE_2}}"
}
```

---

## End-to-End Workflows

### Workflow 1: {{WORKFLOW_NAME_1}}

1. {{WORKFLOW_1_STEP_1}}
2. {{WORKFLOW_1_STEP_2}}
3. {{WORKFLOW_1_STEP_3}}

### Workflow 2: {{WORKFLOW_NAME_2}}

1. {{WORKFLOW_2_STEP_1}}
2. {{WORKFLOW_2_STEP_2}}
3. {{WORKFLOW_2_STEP_3}}

## Environment Variables

- {{ENV_VAR_1}}: {{ENV_VAR_1_DESC}}
- {{ENV_VAR_2}}: {{ENV_VAR_2_DESC}}

## Error Handling

- If API returns 4xx, explain missing/invalid input and ask for correction.
- If API returns 5xx, retry with backoff and provide status to user.
- If dependency lookup fails, stop execution and ask user how to proceed.

## Security Notes

- Never reveal secrets, raw tokens, or private keys.
- Avoid destructive actions without explicit confirmation.
- Prefer read-only actions if user intent is unclear.
- Log minimal sensitive information only when needed.

## Getting Started

1. Replace all placeholders in this file.
2. Test every endpoint example against your generated app.
3. Validate dependency resolution for high-impact actions.
4. Install under `~/.openclaw/skills/` or project `skills/` and run.