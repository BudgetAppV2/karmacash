# Task ID: CKA.6
# Title: CKA.6 - Develop Main Script for CK Assistant User Interaction
# Status: pending
# Dependencies: CKA.2, CKA.5
# Priority: high
# Description: Create the main executable Python script (`main.py`) that initializes the CK Assistant, 
# handles user input (e.g., from the command line), orchestrates calls to the Gemini Interaction Module, 
# and displays results.

from cka_assistant.gemini_interaction import respond_to_prompt
from cka_assistant import config_loader # For pre-checking config loading

def main():
    print("Welcome to CK Assistant (Alpha v0.1)")
    print("Powered by Google Gemini")
    print("Type 'quit' or 'exit' to leave.")
    print("-" * 30)

    # Pre-check if config loaded successfully
    try:
        # Access a key to trigger loading/errors from config_loader
        # This assumes GEMINI_API_KEY or other essential configs are loaded by config_loader
        if not config_loader.GEMINI_API_KEY: # Or some other check if GEMINI_API_KEY might be None but validly so initially
            raise EnvironmentError("GEMINI_API_KEY is not set in the environment or .env file.")
        print("Configuration loaded successfully.")
    except AttributeError:
        print(f"FATAL CONFIGURATION ERROR: GEMINI_API_KEY not found in config_loader.")
        print("Please ensure your .env file is correctly set up in ck_assistant_py/.env and accessible.")
        return # Exit if config is bad
    except EnvironmentError as e:
        print(f"FATAL CONFIGURATION ERROR: {e}")
        print("Please ensure your .env file is correctly set up in ck_assistant_py/.env")
        return # Exit if config is bad
    except Exception as e:
        print(f"An unexpected error occurred during configuration loading: {e}")
        print("Please check your setup.")
        return

    # Main interaction loop
    while True:
        try:
            user_input = input("CKA Prompt: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["quit", "exit"]:
                print("Exiting CK Assistant. Goodbye!")
                break

            print("\nCKA is thinking...") # Simple thinking indicator
            response_text = respond_to_prompt(user_input)
            print("\nCKA Response:")
            print("-" * 15)
            print(response_text)
            print("-" * 15)
            print("\n") # Add some spacing

        except EOFError: # Handle Ctrl+D as a way to quit
            print("\nExiting CK Assistant. Goodbye!")
            break
        except KeyboardInterrupt: # Handle Ctrl+C
            print("\nCK Assistant interrupted. Exiting. Goodbye!")
            break
        except Exception as e:
            print(f"\nAn unexpected error occurred during interaction: {e}")
            # In a real app, you might want to log the full traceback for debugging
            # import traceback
            # traceback.print_exc()
            print("Please try again or type 'quit' to exit.\n")

if __name__ == "__main__":
    main()
