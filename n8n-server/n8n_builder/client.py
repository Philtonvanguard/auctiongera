"""
n8n API Client — Create and manage n8n workflows from Python.
No SSH, no MCP, just REST API calls.
"""

import json
import requests
from typing import Optional
from .config import N8N_BASE_URL, N8N_API_KEY


class N8NClient:
    """Direct API client for n8n."""

    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = (base_url or N8N_BASE_URL).rstrip("/")
        self.api_key = api_key or N8N_API_KEY
        self.api_url = f"{self.base_url}/api/v1"
        self.headers = {
            "X-N8N-API-KEY": self.api_key,
            "Content-Type": "application/json",
        }

    def _request(self, method: str, endpoint: str, data: dict = None):
        url = f"{self.api_url}/{endpoint}"
        resp = requests.request(method, url, headers=self.headers, json=data, timeout=30)
        if resp.status_code >= 400:
            raise Exception(f"n8n API error {resp.status_code}: {resp.text}")
        return resp.json() if resp.text else {}

    # ── Workflows ──────────────────────────────────────────

    def list_workflows(self):
        """List all workflows."""
        return self._request("GET", "workflows")

    def get_workflow(self, workflow_id: str):
        """Get a single workflow by ID."""
        return self._request("GET", f"workflows/{workflow_id}")

    def create_workflow(self, name: str, nodes: list, connections: dict, settings: dict = None):
        """Create a new workflow with nodes and connections."""
        payload = {
            "name": name,
            "nodes": nodes,
            "connections": connections,
            "settings": settings or {"executionOrder": "v1"},
        }
        return self._request("POST", "workflows", payload)

    def update_workflow(self, workflow_id: str, data: dict):
        """Update an existing workflow."""
        return self._request("PUT", f"workflows/{workflow_id}", data)

    def delete_workflow(self, workflow_id: str):
        """Delete a workflow."""
        return self._request("DELETE", f"workflows/{workflow_id}")

    def activate_workflow(self, workflow_id: str):
        """Activate a workflow."""
        return self._request("POST", f"workflows/{workflow_id}/activate")

    def deactivate_workflow(self, workflow_id: str):
        """Deactivate a workflow."""
        return self._request("POST", f"workflows/{workflow_id}/deactivate")

    # ── Executions ─────────────────────────────────────────

    def execute_workflow(self, workflow_id: str):
        """Manually trigger a workflow execution."""
        return self._request("POST", f"workflows/{workflow_id}/run")

    def list_executions(self, workflow_id: str = None, limit: int = 20):
        """List recent executions."""
        endpoint = "executions"
        if workflow_id:
            endpoint += f"?workflowId={workflow_id}&limit={limit}"
        else:
            endpoint += f"?limit={limit}"
        return self._request("GET", endpoint)

    def get_execution(self, execution_id: str):
        """Get details of a specific execution."""
        return self._request("GET", f"executions/{execution_id}")

    # ── Credentials ────────────────────────────────────────

    def list_credentials(self):
        """List all stored credentials."""
        return self._request("GET", "credentials")

    # ── Health ─────────────────────────────────────────────

    def health_check(self):
        """Check if n8n is reachable."""
        try:
            resp = requests.get(f"{self.base_url}/healthz", timeout=10)
            return resp.status_code == 200
        except Exception:
            return False

    def test_connection(self):
        """Test API key and connection."""
        try:
            result = self.list_workflows()
            count = len(result.get("data", []))
            return {"ok": True, "message": f"Connected! {count} workflow(s) found."}
        except Exception as e:
            return {"ok": False, "message": str(e)}
