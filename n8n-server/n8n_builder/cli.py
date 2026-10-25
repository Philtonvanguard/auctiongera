"""
n8n CLI — Run from command line to manage n8n workflows.

Usage:
    python -m n8n_builder.cli test              # Test connection
    python -m n8n_builder.cli list              # List all workflows
    python -m n8n_builder.cli get <id>          # Get workflow details
    python -m n8n_builder.cli activate <id>     # Activate workflow
    python -m n8n_builder.cli deactivate <id>   # Deactivate workflow
    python -m n8n_builder.cli delete <id>       # Delete workflow
    python -m n8n_builder.cli deploy-template <name>  # Deploy a pre-built template
    python -m n8n_builder.cli executions [id]   # List recent executions
"""

import sys
import json
from .client import N8NClient
from .workflow import (
    auction_webhook_workflow,
    bid_notification_workflow,
    scheduled_cleanup_workflow,
    api_monitor_workflow,
)

TEMPLATES = {
    "auction-webhook": ("AuctionGera Webhook Handler", auction_webhook_workflow),
    "bid-notification": ("Bid Notification System", bid_notification_workflow),
    "cleanup": ("Hourly Auction Cleanup", scheduled_cleanup_workflow),
    "api-monitor": ("API Health Monitor", api_monitor_workflow),
}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    client = N8NClient()
    cmd = sys.argv[1]

    if cmd == "test":
        result = client.test_connection()
        icon = "OK" if result["ok"] else "FAIL"
        print(f"[{icon}] {result['message']}")

    elif cmd == "list":
        data = client.list_workflows()
        workflows = data.get("data", [])
        if not workflows:
            print("No workflows found.")
            return
        print(f"{'ID':<8} {'Active':<8} {'Name'}")
        print("-" * 50)
        for wf in workflows:
            active = "YES" if wf.get("active") else "no"
            print(f"{wf['id']:<8} {active:<8} {wf['name']}")

    elif cmd == "get":
        if len(sys.argv) < 3:
            print("Usage: get <workflow_id>")
            return
        wf = client.get_workflow(sys.argv[2])
        print(json.dumps(wf, indent=2))

    elif cmd == "activate":
        if len(sys.argv) < 3:
            print("Usage: activate <workflow_id>")
            return
        client.activate_workflow(sys.argv[2])
        print(f"Workflow {sys.argv[2]} activated!")

    elif cmd == "deactivate":
        if len(sys.argv) < 3:
            print("Usage: deactivate <workflow_id>")
            return
        client.deactivate_workflow(sys.argv[2])
        print(f"Workflow {sys.argv[2]} deactivated.")

    elif cmd == "delete":
        if len(sys.argv) < 3:
            print("Usage: delete <workflow_id>")
            return
        client.delete_workflow(sys.argv[2])
        print(f"Workflow {sys.argv[2]} deleted.")

    elif cmd == "deploy-template":
        if len(sys.argv) < 3:
            print("Available templates:")
            for key, (desc, _) in TEMPLATES.items():
                print(f"  {key:<20} — {desc}")
            return
        tpl_name = sys.argv[2]
        if tpl_name not in TEMPLATES:
            print(f"Unknown template '{tpl_name}'. Available: {', '.join(TEMPLATES.keys())}")
            return
        desc, factory = TEMPLATES[tpl_name]
        wb = factory(client)
        result = wb.deploy(activate=True)
        print(f"Deployed '{desc}' — ID: {result.get('id')}, Active: True")

    elif cmd == "executions":
        wf_id = sys.argv[2] if len(sys.argv) > 2 else None
        data = client.list_executions(wf_id)
        execs = data.get("data", [])
        if not execs:
            print("No executions found.")
            return
        print(f"{'ID':<12} {'Status':<10} {'Workflow':<8} {'Started'}")
        print("-" * 60)
        for ex in execs:
            print(f"{ex['id']:<12} {ex.get('status','?'):<10} {ex.get('workflowId','?'):<8} {ex.get('startedAt','?')}")

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()
