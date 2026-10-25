"""
Workflow Builder — High-level helper for building n8n workflows.
Chain nodes together with a simple API.
"""

from .client import N8NClient
from . import nodes


class WorkflowBuilder:
    """Build n8n workflows step by step."""

    def __init__(self, name: str, client: N8NClient = None):
        self.name = name
        self.client = client or N8NClient()
        self.nodes = []
        self.connections = {}
        self._x = 250
        self._y = 300
        self._step = 250

    def _next_pos(self):
        pos = [self._x, self._y]
        self._x += self._step
        return pos

    def add_node(self, node: dict, connect_from: str = None):
        """Add a node. Optionally connect it from a previous node by name."""
        if "position" not in node or node["position"] == [750, 300] or node["position"] == [250, 300]:
            node["position"] = self._next_pos()

        self.nodes.append(node)

        if connect_from:
            self.connect(connect_from, node["name"])

        return self

    def connect(self, from_name: str, to_name: str, from_output: int = 0, to_input: int = 0):
        """Connect two nodes by name."""
        if from_name not in self.connections:
            self.connections[from_name] = {"main": []}

        # Ensure we have enough output slots
        while len(self.connections[from_name]["main"]) <= from_output:
            self.connections[from_name]["main"].append([])

        self.connections[from_name]["main"][from_output].append({
            "node": to_name,
            "type": "main",
            "index": to_input,
        })
        return self

    def chain(self, *node_list):
        """Add and connect a chain of nodes sequentially."""
        for i, node in enumerate(node_list):
            if "position" not in node or node["position"] in ([750, 300], [250, 300], [500, 300], [1000, 300]):
                node["position"] = self._next_pos()
            self.nodes.append(node)
            if i > 0:
                self.connect(node_list[i - 1]["name"], node["name"])
        return self

    def build(self):
        """Return the workflow payload (without creating it on n8n)."""
        return {
            "name": self.name,
            "nodes": self.nodes,
            "connections": self.connections,
            "settings": {"executionOrder": "v1"},
        }

    def deploy(self, activate: bool = False):
        """Create the workflow on n8n and optionally activate it."""
        result = self.client.create_workflow(
            name=self.name,
            nodes=self.nodes,
            connections=self.connections,
        )
        workflow_id = result.get("id")
        if activate and workflow_id:
            self.client.activate_workflow(workflow_id)
        return result

    def preview_json(self):
        """Print the workflow JSON for debugging."""
        import json
        print(json.dumps(self.build(), indent=2))


# ── Pre-built workflow templates ──────────────────────────

def auction_webhook_workflow(client: N8NClient = None):
    """
    Pre-built: Webhook that receives auction events from AuctionGera.
    Webhook → Process → Respond
    """
    wb = WorkflowBuilder("AuctionGera Webhook Handler", client)
    wb.chain(
        nodes.webhook_trigger("/auction-events", method="POST", name="Auction Event"),
        nodes.code_node("""
// Process incoming auction event
const event = $input.all()[0].json;
const eventType = event.type; // 'new_bid', 'auction_ended', 'auction_started'

let response = {
    received: true,
    event_type: eventType,
    timestamp: new Date().toISOString(),
};

if (eventType === 'new_bid') {
    response.message = `New bid of ${event.amount} on auction ${event.auction_id}`;
} else if (eventType === 'auction_ended') {
    response.message = `Auction ${event.auction_id} ended. Winner: ${event.winner}`;
}

return [{json: response}];
""", name="Process Event"),
        nodes.respond_to_webhook(200, '={{JSON.stringify($json)}}', name="Send Response"),
    )
    return wb


def bid_notification_workflow(client: N8NClient = None):
    """
    Pre-built: When a bid is placed, check if it's high value and send notification.
    Webhook → IF high value → Telegram/Discord notification
    """
    wb = WorkflowBuilder("Bid Notification", client)

    trigger = nodes.webhook_trigger("/new-bid", method="POST", name="New Bid")
    check = nodes.if_node("={{$json.amount}}", "gte", "1000", name="High Value?")
    notify = nodes.code_node("""
const bid = $input.all()[0].json;
return [{json: {
    text: `🔥 High-value bid! $${bid.amount} on "${bid.auction_title}" by ${bid.bidder}`,
    amount: bid.amount,
    auction: bid.auction_title,
}}];
""", name="Format Alert")
    respond = nodes.respond_to_webhook(200, '{"status":"processed"}', name="OK")

    wb.chain(trigger, check)
    wb.add_node(notify)
    wb.connect("High Value?", "Format Alert", from_output=0)  # true branch
    wb.add_node(respond)
    wb.connect("High Value?", "OK", from_output=1)  # false branch
    return wb


def scheduled_cleanup_workflow(client: N8NClient = None):
    """
    Pre-built: Run every hour to clean up ended auctions via API.
    Schedule → HTTP Request to AuctionGera → Log results
    """
    wb = WorkflowBuilder("Hourly Auction Cleanup", client)
    wb.chain(
        nodes.interval_trigger(60, name="Every Hour"),
        nodes.http_request("http://localhost:5000/api/cleanup-ended", method="POST", name="Cleanup API"),
        nodes.code_node("""
const result = $input.all()[0].json;
return [{json: {
    cleaned: result.cleaned || 0,
    timestamp: new Date().toISOString(),
    status: 'done'
}}];
""", name="Log Result"),
    )
    return wb


def api_monitor_workflow(api_url: str, check_interval: int = 5, client: N8NClient = None):
    """
    Pre-built: Monitor an API endpoint every N minutes.
    Schedule → HTTP Request → IF error → Alert
    """
    wb = WorkflowBuilder(f"API Monitor: {api_url}", client)

    schedule = nodes.interval_trigger(check_interval, name="Check Schedule")
    request = nodes.http_request(api_url, method="GET", name="Health Check")
    check = nodes.if_node("={{$json.statusCode}}", "notEquals", "200", name="Down?")
    alert = nodes.code_node(f"""
return [{{json: {{
    alert: "API DOWN",
    url: "{api_url}",
    timestamp: new Date().toISOString(),
    status: $input.all()[0].json.statusCode || "unreachable",
}}}}];
""", name="Create Alert")

    wb.chain(schedule, request, check)
    wb.add_node(alert)
    wb.connect("Down?", "Create Alert", from_output=0)
    return wb
