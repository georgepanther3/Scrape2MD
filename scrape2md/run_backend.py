import sys
import asyncio
import uvicorn
import os

# Ensure the current directory is in the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # FIX: Set the Event Loop Policy for Windows + Playwright compatibility
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    # Run the server
    # reload=False is required on Windows with Playwright to ensure the 
    # SelectorEventLoopPolicy set above is preserved in the process.
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
