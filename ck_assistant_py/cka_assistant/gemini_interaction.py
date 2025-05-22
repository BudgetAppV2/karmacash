from google.generativeai.types import FunctionDeclaration, Tool
# from google.generativeai.protos import Schema, Type # No longer needed for main parameters
import google.generativeai as genai
from google.ai.generativelanguage_v1beta.types.content import Part, FunctionResponse
from google.ai.generativelanguage_v1beta.types import FunctionCall
from cka_assistant.config_loader import GEMINI_API_KEY
from cka_assistant import template_exchange_client # To call our actual functions

# Configure API Key
genai.configure(api_key=GEMINI_API_KEY)

# Function Declaration for get_template
GET_TEMPLATE_FUNC_DECL = FunctionDeclaration(
    name="get_template",
    description="Retrieves a template (e.g., handoff or summary) for a specific session ID and type from the Template Exchange API.",
    parameters={
        "type": "OBJECT", # Using string "OBJECT"
        "properties": {
            "session_id": {
                "type": "STRING", # Using string "STRING"
                "description": "The unique identifier for the session (e.g., 'M5.S4')."
            },
            "template_type": {
                "type": "STRING",
                "description": "The type of the template, either 'handoff' or 'summary'. Defaults to 'handoff'."
            }
        },
        "required": ["session_id"]
    }
)

# Function Declaration for create_template
CREATE_TEMPLATE_FUNC_DECL = FunctionDeclaration(
    name="create_template",
    description="Creates a new template or updates an existing one in the Template Exchange API. Stores session handoffs or summaries.",
    parameters={
        "type": "OBJECT",
        "properties": {
            "session_id": {
                "type": "STRING",
                "description": "The session ID for the template (e.g., 'M5.S4')."
            },
            "template_type": {
                "type": "STRING",
                "description": "The type of template, either 'handoff' or 'summary'."
            },
            "content": {
                "type": "STRING",
                "description": "The markdown content of the template."
            },
            "status": {
                "type": "STRING",
                "description": "The status of the template (e.g., 'draft', 'active'). Defaults to 'draft' if not provided."
            },
            "metadata": {
                "type": "OBJECT", # This indicates Gemini can pass a JSON-like object
                "description": "Optional dictionary for additional metadata (e.g., {'source': 'ai_studio', 'tags': ['feature']})."
                # No need to define properties for metadata if it's a flexible object.
            }
        },
        "required": ["session_id", "template_type", "content"]
    }
)

# Create the Tool
TEMPLATE_EXCHANGE_TOOL = Tool(
    function_declarations=[
        GET_TEMPLATE_FUNC_DECL,
        CREATE_TEMPLATE_FUNC_DECL
    ]
)

# Initialize the Generative Model
MODEL_NAME = "gemini-1.5-pro-latest"
MODEL = genai.GenerativeModel(
    MODEL_NAME,
    tools=[TEMPLATE_EXCHANGE_TOOL]
)

def respond_to_prompt(user_prompt: str) -> str: # Renamed for clarity if it becomes multi-turn
    """
    Sends a user prompt to the Gemini model, handles potential function calls,
    and returns the final text response.

    Args:
        user_prompt: The text prompt from the user.

    Returns:
        The final text content of the model's response after handling any function calls.

    Raises:
        Exception: If API calls fail or other unexpected errors occur.
        NotImplementedError: If the model requests a function that isn't implemented.
    """
    try:
        chat = MODEL.start_chat()
        response = chat.send_message(user_prompt)
        
        # Loop to handle potential sequences of function calls
        # Check for function call by looking for the attribute
        while response.candidates[0].content.parts and \
              hasattr(response.candidates[0].content.parts[0], 'function_call') and \
              response.candidates[0].content.parts[0].function_call.name:
            
            function_call = response.candidates[0].content.parts[0].function_call
            function_name = function_call.name
            args = dict(function_call.args) # Convert Struct to dict

            print(f"Gemini requested to call function: {function_name} with args: {args}")

            api_response_data = None
            function_response_content = None

            if function_name == "get_template":
                session_id = args.get("session_id")
                template_type = args.get("template_type", "handoff") # Handle default if not provided by LLM
                
                # --- Call actual local function ---
                try:
                    api_response_data = template_exchange_client.get_template(
                        session_id=session_id,
                        template_type=template_type
                    )
                    function_response_content = {"result": api_response_data}
                except template_exchange_client.TemplateNotFoundError as e:
                    function_response_content = {"error": str(e), "type": "TemplateNotFound"}
                except template_exchange_client.TemplateAuthenticationError as e:
                    function_response_content = {"error": str(e), "type": "AuthenticationError"}
                except template_exchange_client.TemplateAPIError as e:
                    function_response_content = {"error": str(e), "type": "APIFailure"}
                except Exception as e: # Catch any other unexpected errors from the client
                    function_response_content = {"error": f"Unexpected error calling get_template: {str(e)}", "type": "ClientExecutionError"}
                
            elif function_name == "create_template":
                session_id = args.get("session_id")
                template_type = args.get("template_type")
                content = args.get("content")
                status = args.get("status", "draft")
                metadata = args.get("metadata") # Will be None if not provided

                # --- Call actual local function ---
                try:
                    api_response_data = template_exchange_client.create_template(
                        session_id=session_id,
                        template_type=template_type,
                        content=content,
                        status=status,
                        metadata=metadata
                    )
                    function_response_content = {"result": api_response_data}
                except template_exchange_client.TemplateAuthenticationError as e:
                    function_response_content = {"error": str(e), "type": "AuthenticationError"}
                except template_exchange_client.TemplateAPIError as e: # Catches 400 Bad Request etc.
                    function_response_content = {"error": str(e), "type": "APIFailure"}
                except Exception as e:
                    function_response_content = {"error": f"Unexpected error calling create_template: {str(e)}", "type": "ClientExecutionError"}

            else:
                # Model tried to call a function we don't know about.
                print(f"Error: Model requested unknown function: {function_name}")
                function_response_content = {"error": f"Function {function_name} is not implemented or recognized."}
            
            # --- Send function response back to Gemini ---
            response = chat.send_message(
                Part(function_response=FunctionResponse(
                    name=function_name,
                    response=function_response_content,
                )),
            )
        
        # After loop (or if no function call), extract final text response
        if response.parts:
            return "".join(part.text for part in response.parts if hasattr(part, 'text'))
        else:
            # This case might occur if the model finished with a function call, and the response is the result of that call.
            # Or if the model truly sent no text and no further function call.
            # Depending on the exact API behavior, response.text might be more direct here if a final text part exists.
            # If the last thing was a function call and we expect a summary, the logic might need refinement
            # to see if the 'response' object from the last send_message (with FunctionResponse) has the text.
            # For now, this assumes the loop exited because the last 'response' has direct text or no parts.
            final_text = response.text if hasattr(response, 'text') else None
            if final_text:
                return final_text
            return "Model did not provide a final text response after handling potential function calls."

    except Exception as e:
        print(f"Error in respond_to_prompt: {e}")
        raise
