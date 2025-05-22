import os
from dotenv import load_dotenv

"""
Configuration Loader Module for CK Assistant.

This module is responsible for loading application configuration from
environment variables, typically provided via a .env file in the project root.

On import, it attempts to load variables from a .env file if present.
It then retrieves required configuration values and makes them available
as module-level variables. It will raise an error if essential
configuration is missing.

To use, create a .env file in the project root (ck_assistant_py/.env)
with the following structure (replace values with your actual keys/URLs):

GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
TEMPLATE_EXCHANGE_API_KEY="YOUR_TEMPLATE_EXCHANGE_API_KEY_HERE"
TEMPLATE_EXCHANGE_API_BASE_URL="YOUR_TEMPLATE_EXCHANGE_API_URL_HERE"
"""

# Load environment variables from .env file
load_dotenv() # This reads your ck_assistant_py/.env file

# Get configuration values, raising an error if missing
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY not found in environment variables or .env file.")

TEMPLATE_EXCHANGE_API_KEY = os.getenv("TEMPLATE_EXCHANGE_API_KEY")
if not TEMPLATE_EXCHANGE_API_KEY:
    raise EnvironmentError("TEMPLATE_EXCHANGE_API_KEY not found in environment variables or .env file.")

TEMPLATE_EXCHANGE_API_BASE_URL = os.getenv("TEMPLATE_EXCHANGE_API_BASE_URL")
if not TEMPLATE_EXCHANGE_API_BASE_URL:
    raise EnvironmentError("TEMPLATE_EXCHANGE_API_BASE_URL not found in environment variables or .env file.")


# Example Usage (can be tested by importing this module elsewhere)
#
# from cka_assistant import config_loader
#
# try:
#     gemini_key = config_loader.GEMINI_API_KEY
#     api_key = config_loader.TEMPLATE_EXCHANGE_API_KEY
#     api_url = config_loader.TEMPLATE_EXCHANGE_API_BASE_URL
#
#     print(f"Using Gemini Key (first 5 chars): {gemini_key[:5]}...")
#     if api_key:
#         print(f"Using Template Exchange API Key (first 5 chars): {api_key[:5]}...")
#     print(f"Template Exchange API Base URL: {api_url}")
#
# except EnvironmentError as e:
#     print(f"Configuration Error: {e}")