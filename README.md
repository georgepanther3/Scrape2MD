# Scrape2MD

**Convert dynamic web pages into clean, LLM-ready Markdown.**

[Leer en Español](README.es.md) | [Lire en Français](README.fr.md) | [简体中文](README.zh-CN.md)

---

**Scrape2MD** is a high-performance microservice and web interface designed to bridge the gap between the visual web and Large Language Models (LLMs). It ingests complex, JavaScript-heavy websites, strips away the noise (ads, navigation, scripts), and delivers pure, structured Markdown content ideal for RAG (Retrieval-Augmented Generation), summarization, and analysis.

## ✨ Key Features

*   **Dynamic Content Support:** Powered by **Playwright**, it successfully renders and scrapes Single Page Applications (SPAs) and JavaScript-heavy sites that traditional scrapers miss.
*   **Smart Cleaning:** Utilizes **BeautifulSoup** and intelligent heuristics to remove clutter like advertisements, popups, and navigation menus, preserving only the core content.
*   **LLM-Optimized Output:** Converts HTML to clean, semantic Markdown (headers, lists, links) ready for AI processing.
*   **Dual Interface:** Offers both a robust **REST API** for developers and a modern **React Web UI** for manual use.
*   **Metadata Extraction:** Automatically captures page titles, original/cleaned token counts, and optimization metrics.
*   **Container Ready:** Fully containerized with Docker for easy deployment.

## 🛠️ Tech Stack

### Backend (API)
*   **Python 3.10+**
*   **FastAPI:** High-performance web framework for building APIs.
*   **Playwright:** Headless browser automation for reliable rendering.
*   **BeautifulSoup4:** HTML parsing and cleaning.
*   **Markdownify:** HTML to Markdown conversion.

### Frontend (Web UI)
*   **React 18** with **TypeScript**
*   **Vite:** Next-generation frontend tooling.
*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **Lucide React:** Beautiful & consistent icons.

## 🚀 Getting Started

### Prerequisites
*   **Python 3.10** or higher
*   **Node.js 18** or higher
*   **Git**

### 1. Backend Setup (API)

Navigate to the backend directory:
```bash
cd scrape2md
```

Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies and browser binaries:
```bash
pip install -r requirements.txt
playwright install chromium
```

Start the API server:
```bash
python -m uvicorn app.main:app --reload
```
*The API will be available at `http://localhost:8000`*

### 2. Frontend Setup (Web UI)

Open a new terminal and navigate to the frontend directory:
```bash
cd scrape2md_website
```

Install Node dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
*The Web UI will be available at `http://localhost:3000`*

## 📖 Usage

### Web Interface
1.  Open `http://localhost:3000` in your browser.
2.  Paste the URL you want to convert into the input field.
3.  (Optional) Click **Config** to set a specific CSS selector to wait for (useful for slow-loading sites) or to toggle image inclusion.
4.  Click **Execute**.
5.  View the result in the "Preview" tab or copy the raw code from the "Code" tab.

### API Usage
You can invoke the scraping service directly via `curl` or any HTTP client.

**Endpoint:** `POST /scrape`

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "wait_for_selector": "body",
    "include_images": false
  }'
```

**Response:**
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "markdown_content": "# Example Domain\n\nThis domain is for use in illustrative examples...",
  "metadata": {
    "original_length": 1200,
    "cleaned_length": 450
  }
}
```