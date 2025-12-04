# Backend CORS Configuration

You asked if you need to update `main.py` for CORS. **Yes, you do.**

By default, modern browsers block frontend applications (running on port `5173` via Vite) from calling APIs on a different port (`8000`), even on localhost.

To fix this, add the following to your FastAPI `main.py` file:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# ... other imports

app = FastAPI()

# --- ADD THIS SECTION ---
origins = [
    "http://localhost:5173",  # React/Vite default port
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # Common React port (just in case)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------------

# ... rest of your code
```

Once you add this and restart your Python backend, the "Convert" button in the frontend will successfully reach your API.