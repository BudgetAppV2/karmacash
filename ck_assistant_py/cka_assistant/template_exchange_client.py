"""
Client module for interacting with the Template Exchange API.

This module provides functions to retrieve and create/update templates
via the Template Exchange API, using configuration loaded from config_loader.
"""

import requests
import json
from cka_assistant.config_loader import TEMPLATE_EXCHANGE_API_KEY, TEMPLATE_EXCHANGE_API_BASE_URL

class TemplateAPIError(Exception):
    """Base exception for Template Exchange API errors."""
    pass

class TemplateNotFoundError(TemplateAPIError):
    """Exception raised when a requested template is not found (e.g., 404)."""
    pass

class TemplateAuthenticationError(TemplateAPIError):
    """Exception raised for authentication failures with the API (e.g., 401)."""
    pass

def get_template(session_id: str, template_type: str = "handoff") -> dict:
    """
    Retrieves a template from the Template Exchange API by session ID and type.

    Args:
        session_id: The unique identifier for the session (e.g., "M5.S4").
        template_type: The type of the template ("handoff" or "summary").
                       Defaults to "handoff".

    Returns:
        A dictionary containing the template data if successful.

    Raises:
        TemplateNotFoundError: If the template with the given session ID and type is not found (404).
        TemplateAuthenticationError: If authentication fails with the API key (401).
        TemplateAPIError: For any other API errors (non-2xx, non-401, non-404).
    """
    url = f"{TEMPLATE_EXCHANGE_API_BASE_URL}/api/templates/{session_id}"
    headers = {'x-api-key': TEMPLATE_EXCHANGE_API_KEY}
    params = {'type': template_type}

    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        raise TemplateNotFoundError(f"No {template_type} template found for session {session_id}")
    elif response.status_code == 401:
        raise TemplateAuthenticationError("Authentication failed. Check API key.")
    else:
        raise TemplateAPIError(f"API request failed with status {response.status_code}: {response.text}")

def create_template(session_id: str, template_type: str, content: str, status: str = "draft", metadata: dict = None) -> dict:
    """
    Creates or updates a template in the Template Exchange API.

    Args:
        session_id: The unique identifier for the session (e.g., "M5.S4").
        template_type: The type of the template ("handoff" or "summary").
        content: The markdown content of the template.
        status: The status of the template (e.g., "draft", "final"). Defaults to "draft".
        metadata: Optional dictionary for additional template metadata. Defaults to None.

    Returns:
        A dictionary containing the response data if successful (usually the created/updated template).

    Raises:
        TemplateAuthenticationError: If authentication fails with the API key (401).
        TemplateAPIError: For any other API errors (non-201, non-401).
    """
    url = f"{TEMPLATE_EXCHANGE_API_BASE_URL}/api/templates"
    headers = {'x-api-key': TEMPLATE_EXCHANGE_API_KEY, 'Content-Type': 'application/json'}
    payload = {'sessionId': session_id, 'type': template_type, 'content': content, 'status': status}
    if metadata is not None:
        payload['metadata'] = metadata

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 201:
        return response.json()
    elif response.status_code == 401:
        raise TemplateAuthenticationError("Authentication failed. Check API key.")
    else:
        raise TemplateAPIError(f"API request failed with status {response.status_code}: {response.text}")