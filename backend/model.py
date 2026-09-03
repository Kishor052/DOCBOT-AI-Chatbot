import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load the GEMINI_API_KEY from your .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY environment variable not found.")
    print("Please ensure your backend/.env file is set up correctly.")
else:
    try:
        # Configure the client with the API key
        genai.configure(api_key=api_key)
        
        print("--- Available Gemini Models and Supported Methods ---")
        
        # Use the list_models() method to retrieve model information
        for model in genai.list_models():
            # Filter models that support text generation
            if 'generateContent' in model.supported_generation_methods:
                print(f"Model Name: {model.name.split('/')[-1]}")
                print(f"  Description: {model.description[:70]}...")
                print(f"  Supported Methods: {model.supported_generation_methods}")
                print("-" * 30)
                
    except Exception as e:
        print(f"\nAn error occurred while connecting to the API:")
        print(f"Error details: {e}")
        print("\nMake sure your API key is valid and you have network connectivity.")
