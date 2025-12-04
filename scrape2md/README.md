# Scrape2MD

A robust, production-ready microservice that converts any URL into clean, LLM-friendly Markdown. Built with FastAPI, Playwright, and BeautifulSoup.

## Features

- **Dynamic Rendering**: Uses Playwright (Chromium) to handle SPAs (React, Vue, etc.).
- **Smart Cleaning**: Removes ads, navbars, footers, cookie banners, and "noise" before conversion.
- **Token Efficient**: Collapses newlines and strips unnecessary HTML attributes.
- **Concurrency Control**: Limits simultaneous browser instances to prevent server overload.
- **Docker Ready**: Includes a production-ready Dockerfile.

## Quick Start (Docker)

1. **Build the image:**
   ```bash
   docker build -t scrape2md .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 scrape2md
   ```

3. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:8000/scrape \
   -H "Content-Type: application/json" \
   -d '{"url": "https://example.com"}'
   ```

## Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

2. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## API Usage

**POST** `/scrape`

**Body:**
```json
{
  "url": "https://news.ycombinator.com",
  "wait_for_selector": ".athing", 
  "include_images": false
}
```

- `url` (required): The URL to scrape.
- `wait_for_selector` (optional): CSS selector to wait for (useful for slow-loading SPAs).
- `include_images` (optional): Default `false`. If `true`, preserves image links in Markdown.
