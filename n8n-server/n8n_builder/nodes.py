"""
n8n Node Builder — Easily construct n8n nodes in Python.
Each function returns a node dict ready for the n8n API.
"""

import uuid


def _uid():
    return str(uuid.uuid4())


def _node(node_type: str, name: str, position: list, parameters: dict = None, **extra):
    """Base node constructor."""
    node = {
        "id": _uid(),
        "name": name,
        "type": node_type,
        "typeVersion": extra.get("typeVersion", 1),
        "position": position,
        "parameters": parameters or {},
    }
    if "credentials" in extra:
        node["credentials"] = extra["credentials"]
    if "webhookId" in extra:
        node["webhookId"] = extra["webhookId"]
    return node


# ── Triggers ──────────────────────────────────────────────

def manual_trigger(name="Manual Trigger", position=None):
    """Manual trigger — start workflow by clicking 'Execute'."""
    return _node("n8n-nodes-base.manualTrigger", name, position or [250, 300])


def webhook_trigger(path: str, method="POST", name="Webhook", position=None):
    """Webhook trigger — receive HTTP requests."""
    return _node(
        "n8n-nodes-base.webhook", name, position or [250, 300],
        parameters={"path": path, "httpMethod": method},
        webhookId=_uid(),
    )


def cron_trigger(cron_expression: str, name="Schedule", position=None):
    """Cron/schedule trigger — run on a schedule."""
    return _node(
        "n8n-nodes-base.scheduleTrigger", name, position or [250, 300],
        parameters={"rule": {"interval": [{"field": "cronExpression", "expression": cron_expression}]}},
    )


def interval_trigger(interval_minutes: int = 5, name="Schedule", position=None):
    """Simple interval trigger — run every N minutes."""
    return _node(
        "n8n-nodes-base.scheduleTrigger", name, position or [250, 300],
        parameters={"rule": {"interval": [{"field": "minutes", "minutesInterval": interval_minutes}]}},
    )


# ── HTTP / API ────────────────────────────────────────────

def http_request(url: str, method="GET", name="HTTP Request", position=None,
                 headers: dict = None, body: str = None, body_type="json"):
    """Make an HTTP request to any API."""
    params = {
        "url": url,
        "method": method,
        "sendHeaders": bool(headers),
        "sendBody": bool(body),
    }
    if headers:
        params["headerParameters"] = {
            "parameters": [{"name": k, "value": v} for k, v in headers.items()]
        }
    if body:
        params["bodyParameters"] = {"parameters": []}
        params["contentType"] = f"application/{body_type}"
        params["body"] = body
    return _node("n8n-nodes-base.httpRequest", name, position or [500, 300], params, typeVersion=4)


# ── Logic / Transform ────────────────────────────────────

def set_node(values: dict, name="Set Values", position=None):
    """Set/transform data fields."""
    assignments = []
    for key, val in values.items():
        val_type = "string"
        if isinstance(val, bool):
            val_type = "boolean"
        elif isinstance(val, (int, float)):
            val_type = "number"
        assignments.append({"id": _uid(), "name": key, "value": val, "type": val_type})
    return _node(
        "n8n-nodes-base.set", name, position or [750, 300],
        parameters={"mode": "manual", "duplicateItem": False,
                     "assignments": {"assignments": assignments}},
        typeVersion=3,
    )


def if_node(value1: str, operation: str, value2: str, name="IF", position=None):
    """Conditional IF node. value1/value2 can be expressions like {{$json.status}}."""
    return _node(
        "n8n-nodes-base.if", name, position or [750, 300],
        parameters={
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": ""},
                "conditions": [{
                    "id": _uid(),
                    "leftValue": value1,
                    "rightValue": value2,
                    "operator": {"type": "string", "operation": operation},
                }],
                "combinator": "and",
            }
        },
        typeVersion=2,
    )


def switch_node(field: str, rules: list, name="Switch", position=None):
    """Switch/router node. rules = [{"value": "x", "output": 0}, ...]"""
    return _node(
        "n8n-nodes-base.switch", name, position or [750, 300],
        parameters={
            "dataType": "string",
            "value1": field,
            "rules": {"rules": [{"value2": r["value"], "output": r["output"]} for r in rules]},
        },
    )


def code_node(js_code: str, name="Code", position=None):
    """Custom JavaScript code node."""
    return _node(
        "n8n-nodes-base.code", name, position or [750, 300],
        parameters={"jsCode": js_code, "mode": "runOnceForAllItems"},
        typeVersion=2,
    )


def function_node(js_code: str, name="Function", position=None):
    """Legacy function node (use code_node instead for newer n8n)."""
    return _node(
        "n8n-nodes-base.function", name, position or [750, 300],
        parameters={"functionCode": js_code},
    )


def merge_node(mode="append", name="Merge", position=None):
    """Merge two inputs. Modes: append, keepKeyMatches, removeDuplicates, etc."""
    return _node(
        "n8n-nodes-base.merge", name, position or [750, 300],
        parameters={"mode": mode},
        typeVersion=2,
    )


def split_in_batches(batch_size: int = 10, name="Loop", position=None):
    """Process items in batches."""
    return _node(
        "n8n-nodes-base.splitInBatches", name, position or [750, 300],
        parameters={"batchSize": batch_size},
    )


def wait_node(seconds: int = 5, name="Wait", position=None):
    """Wait/delay node."""
    return _node(
        "n8n-nodes-base.wait", name, position or [750, 300],
        parameters={"amount": seconds, "unit": "seconds"},
    )


# ── Communication ────────────────────────────────────────

def send_email(to: str, subject: str, body: str, name="Send Email", position=None):
    """Send email via SMTP (requires SMTP credentials in n8n)."""
    return _node(
        "n8n-nodes-base.emailSend", name, position or [1000, 300],
        parameters={"fromEmail": "", "toEmail": to, "subject": subject, "text": body},
    )


def telegram_send(chat_id: str, text: str, name="Telegram", position=None):
    """Send a Telegram message (requires Telegram API credentials in n8n)."""
    return _node(
        "n8n-nodes-base.telegram", name, position or [1000, 300],
        parameters={"chatId": chat_id, "text": text, "operation": "sendMessage"},
    )


def slack_send(channel: str, text: str, name="Slack", position=None):
    """Send a Slack message (requires Slack credentials in n8n)."""
    return _node(
        "n8n-nodes-base.slack", name, position or [1000, 300],
        parameters={"channel": channel, "text": text, "operation": "post"},
    )


def discord_send(webhook_url: str, content: str, name="Discord", position=None):
    """Send a Discord message via webhook."""
    return http_request(
        url=webhook_url, method="POST", name=name, position=position,
        body=f'{{"content": "{content}"}}', body_type="json",
    )


# ── Database ─────────────────────────────────────────────

def postgres_query(query: str, name="Postgres", position=None):
    """Execute a PostgreSQL query (requires Postgres credentials in n8n)."""
    return _node(
        "n8n-nodes-base.postgres", name, position or [750, 300],
        parameters={"operation": "executeQuery", "query": query},
        typeVersion=2,
    )


def mysql_query(query: str, name="MySQL", position=None):
    """Execute a MySQL query (requires MySQL credentials in n8n)."""
    return _node(
        "n8n-nodes-base.mySql", name, position or [750, 300],
        parameters={"operation": "executeQuery", "query": query},
    )


# ── AI / LLM ─────────────────────────────────────────────

def openai_chat(prompt: str, model="gpt-4", name="OpenAI", position=None):
    """Call OpenAI chat completion (requires OpenAI credentials in n8n)."""
    return _node(
        "@n8n/n8n-nodes-langchain.openAi", name, position or [750, 300],
        parameters={
            "model": model,
            "messages": {"values": [{"role": "user", "content": prompt}]},
        },
        typeVersion=1,
    )


# ── Respond ──────────────────────────────────────────────

def respond_to_webhook(response_code: int = 200, body: str = '{"status":"ok"}',
                       name="Respond", position=None):
    """Respond to a webhook request."""
    return _node(
        "n8n-nodes-base.respondToWebhook", name, position or [1000, 300],
        parameters={"respondWith": "json", "responseBody": body, "responseCode": response_code},
    )


def no_op(name="No Op", position=None):
    """Do nothing — useful as a placeholder or to merge branches."""
    return _node("n8n-nodes-base.noOp", name, position or [750, 300])
