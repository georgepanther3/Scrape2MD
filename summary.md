# Scrape2MD Project Summary

This document contains the complete source code for the Scrape2MD project, divided into the Backend (FastAPI + Playwright) and Frontend (React + Vite).

## Backend (`scrape2md/`)

### `scrape2md/requirements.txt`
```text
fastapi>=0.109.0
uvicorn>=0.27.0
playwright>=1.41.0
beautifulsoup4>=4.12.0
markdownify>=0.11.6
pydantic>=2.6.0
```

### `scrape2md/run_backend.py`
```python
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
```

### `scrape2md/app/main.py`
```python
import asyncio
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import ScrapeRequest, ScrapeResponse
from app.scraper import ScraperService
from app.cleaner import HTMLCleaner
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

scraper_service = ScraperService(max_concurrency=5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await scraper_service.start()
    yield
    await scraper_service.stop()

app = FastAPI(
    title="Scrape2MD",
    description="A microservice to convert webpages to LLM-friendly Markdown.",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_endpoint(request: ScrapeRequest):
    try:
        title, raw_html = await scraper_service.scrape_url(
            str(request.url), 
            request.wait_for_selector
        )
        
        clean_html = HTMLCleaner.clean_html(raw_html)
        
        markdown_text = HTMLCleaner.to_markdown(clean_html, request.include_images)
        
        return ScrapeResponse(
            url=str(request.url),
            title=title,
            markdown_content=markdown_text,
            metadata={
                "original_length": len(raw_html),
                "cleaned_length": len(markdown_text)
            }
        )
        
    except Exception as e:
        logger.exception(f"Scrape failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scrape URL: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### `scrape2md/app/scraper.py`
```python
import asyncio
import logging
from playwright.async_api import async_playwright, Browser, Playwright

logger = logging.getLogger("uvicorn")

class ScraperService:
    def __init__(self, max_concurrency: int = 5):
        self.playwright: Playwright = None
        self.browser: Browser = None
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )

    async def start(self):
        logger.info("Starting Playwright browser...")
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage", 
                "--disable-gpu"
            ]
        )
        logger.info("Playwright browser started.")

    async def stop(self):
        logger.info("Stopping Playwright browser...")
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("Playwright browser stopped.")

    async def scrape_url(self, url: str, wait_for_selector: str = None) -> tuple[str, str]:
        async with self.semaphore:
            context = await self.browser.new_context(
                user_agent=self.user_agent,
                viewport={"width": 1920, "height": 1080},
                java_script_enabled=True
            )
            
            page = await context.new_page()
            
            try:
                logger.info(f"Navigating to {url}")
                await page.goto(url, timeout=30000, wait_until="networkidle")
                
                if wait_for_selector:
                    try:
                        logger.info(f"Waiting for selector: {wait_for_selector}")
                        await page.wait_for_selector(wait_for_selector, timeout=5000)
                    except Exception as e:
                        logger.warning(f"Timeout waiting for selector {wait_for_selector}: {e}")

                content = await page.content()
                title = await page.title()
                
                return title, content
                
            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                raise e
            finally:
                await page.close()
                await context.close()
```

### `scrape2md/app/cleaner.py`
```python
import re
from bs4 import BeautifulSoup, Comment
from markdownify import markdownify as md

class HTMLCleaner:
    TAGS_TO_REMOVE = [
        'script', 'style', 'svg', 'noscript', 'iframe', 'object', 'embed', 
        'nav', 'footer', 'header', 'aside', 'form', 'button', 'input', 'textarea', 'select'
    ]

    NOISE_CLASSES = [
        'ad', 'ads', 'advertisement', 'banner', 'popup', 'cookie', 'subscription', 
        'sidebar', 'widget', 'social', 'share', 'promo', 'newsletter', 'comment', 
        'hidden', 'modal'
    ]

    @staticmethod
    def clean_html(html_content: str) -> str:
        soup = BeautifulSoup(html_content, 'html.parser')

        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            comment.extract()

        for tag in soup.find_all(HTMLCleaner.TAGS_TO_REMOVE):
            tag.decompose()

        for tag in soup.find_all(True):
            attrs = tag.attrs
            if not attrs:
                continue

            if 'id' in attrs and attrs['id']:
                if any(noise in str(attrs['id']).lower() for noise in HTMLCleaner.NOISE_CLASSES):
                    tag.decompose()
                    continue
            
            if 'class' in attrs and attrs['class']:
                class_str = " ".join(attrs['class']).lower()
                if any(noise in class_str for noise in HTMLCleaner.NOISE_CLASSES):
                    tag.decompose()
                    continue

        main_content = soup.find('main') or soup.find('article')
        if main_content:
            return str(main_content)
        
        if soup.body:
            return str(soup.body)
            
        return str(soup)

    @staticmethod
    def to_markdown(html_content: str, include_images: bool = False) -> str:
        markdown = md(
            html_content, 
            heading_style="ATX", 
            strip=['img'] if not include_images else [] 
        ) 
        
        if not include_images:
             pass
        
        cleaned_markdown = re.sub(r'\n\s*\n', '\n\n', markdown).strip()
        
        return cleaned_markdown
```

### `scrape2md/app/models.py`
```python
from typing import Optional
from pydantic import BaseModel, HttpUrl, Field

class ScrapeRequest(BaseModel):
    url: HttpUrl
    wait_for_selector: Optional[str] = Field(
        default=None, 
        description="CSS selector to wait for before scraping. Useful for SPAs that load content lazily."
    )
    include_images: bool = Field(
        default=False,
        description="If true, preserves image links in the Markdown output."
    )

class ScrapeResponse(BaseModel):
    url: str
    title: Optional[str] = None
    markdown_content: str
    metadata: dict = Field(default_factory=dict)
```

## Frontend (`scrape2md_website/`)

### `scrape2md_website/App.tsx`
```tsx
import React, { useState } from 'react';
import { ConverterForm } from './components/ConverterForm';
import { ResultDisplay } from './components/ResultDisplay';
import { convertUrl } from './services/api';
import { ScrapeRequest, ScrapeResponse } from './types';
import { FileCode, Github, AlertCircle } from 'lucide-react';

import * as ShadersModule from '@paper-design/shaders-react';

// @ts-ignore
const Dithering = ShadersModule.Dithering || ShadersModule.default?.Dithering;

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async (request: ScrapeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await convertUrl(request);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to convert URL. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        {Dithering && (
          <Dithering
            width={window.innerWidth}
            height={window.innerHeight}
            colorBack="#ff000033"
            colorFront="#a020f0"
            shape="swirl"
            type="8x8"
            size={1.6}
            speed={1}
          />
        )}
      </div>

      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 backdrop-blur-md bg-black/30 px-4 py-2 rounded-full border border-white/10">
            <div className="text-brand">
              <FileCode size={20} />
            </div>
            <span className="text-lg font-mono font-bold tracking-tight text-white">
              SCRAPE2MD
            </span>
          </div>
          <div className="flex items-center gap-4">
             <a href="#" className="text-white/60 hover:text-brand transition-colors p-2 bg-black/30 rounded-full backdrop-blur-md border border-white/5">
                <Github size={20} />
             </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        
        {!result ? (
          <div className="w-full max-w-3xl space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center space-y-2">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 mb-4 drop-shadow-2xl">
                WEB <span className="text-brand">2</span> MARKDOWN
              </h1>
              <p className="text-lg md:text-xl text-white/60 max-w-xl mx-auto font-mono">
                 ingest_url &gt; process &gt; output.md
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 backdrop-blur-xl border border-red-500/30 p-4 rounded-3xl flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-red-400 font-bold text-sm tracking-wide uppercase">System Error</h3>
                  <p className="text-red-200/80 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <ConverterForm isLoading={loading} onSubmit={handleConvert} />
          </div>
        ) : (
          <ResultDisplay data={result} onReset={handleReset} />
        )}
      </main>

      <footer className="relative z-10 py-6 text-center">
        <p className="text-white/20 text-xs font-mono uppercase tracking-widest">
            System Online • FastAPI • Playwright
        </p>
      </footer>
    </div>
  );
};

export default App;
```

### `scrape2md_website/components/ConverterForm.tsx`
```tsx
import React, { useState } from 'react';
import { ScrapeRequest } from '../types';
import { Spinner } from './ui/Spinner';
import { Settings, Sparkles, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface ConverterFormProps {
  isLoading: boolean;
  onSubmit: (data: ScrapeRequest) => void;
}

export const ConverterForm: React.FC<ConverterFormProps> = ({ isLoading, onSubmit }) => {
  const [url, setUrl] = useState('');
  const [waitForSelector, setWaitForSelector] = useState('');
  const [includeImages, setIncludeImages] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    onSubmit({
      url,
      wait_for_selector: waitForSelector || undefined,
      include_images: includeImages,
    });
  };

  return (
    <div className="w-full">
      <div className="bg-dark-glass backdrop-blur-2xl rounded-[3rem] border border-white/10 p-2 shadow-2xl">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-3">
              <div className="relative group">
                <input
                  type="url"
                  id="url"
                  placeholder="https://example.com/article"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-8 py-6 text-xl font-mono text-white bg-black/40 border border-white/10 rounded-full focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none placeholder:text-white/20 shadow-inner"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <div className="bg-white/10 text-white/50 text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm tracking-wider">
                    GET
                  </div>
                </div>
              </div>
            </div>

            <div className="px-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-brand transition-colors mx-auto mb-2"
              >
                <Settings size={14} />
                <span>Config</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div className="mt-4 p-6 bg-black/20 rounded-3xl border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label htmlFor="selector" className="block text-[10px] font-bold uppercase tracking-widest text-brand">
                      Wait for Selector
                    </label>
                    <input
                      type="text"
                      id="selector"
                      placeholder="#main-content"
                      value={waitForSelector}
                      onChange={(e) => setWaitForSelector(e.target.value)}
                      className="w-full px-6 py-3 text-sm font-mono bg-white/5 border border-white/10 rounded-full focus:ring-1 focus:ring-brand outline-none text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-3 cursor-pointer" onClick={() => setIncludeImages(!includeImages)}>
                      <ImageIcon size={18} className="text-brand" />
                      Include Images
                    </label>
                    <div 
                      onClick={() => setIncludeImages(!includeImages)}
                      className={`relative w-14 h-8 rounded-full cursor-pointer transition-all duration-300 ease-in-out border border-white/10 ${includeImages ? 'bg-brand' : 'bg-black/40'}`}
                    >
                      <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ease-in-out ${includeImages ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !url}
              className={`
                w-full py-6 rounded-full font-black text-lg tracking-widest uppercase
                flex items-center justify-center gap-4 transition-all transform hover:scale-[1.02] active:scale-[0.98]
                ${isLoading || !url 
                  ? 'bg-white/10 text-white/20 cursor-not-allowed' 
                  : 'bg-brand text-black hover:shadow-[0_0_40px_-10px_rgba(224,72,72,0.6)] shadow-lg'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Spinner className="text-brand" />
                  <span className="text-white">Processing</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Execute</span>
                </>
              )}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
};
```

### `scrape2md_website/components/ResultDisplay.tsx`
```tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ScrapeResponse } from '../types';
import { Copy, Check, ArrowLeft, FileText, Code, ExternalLink } from 'lucide-react';

interface ResultDisplayProps {
  data: ScrapeResponse;
  onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'raw' | 'preview'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.markdown_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const original = data.metadata.original_length;
  const cleaned = data.metadata.cleaned_length;
  const reduction = original > 0 ? Math.round(((original - cleaned) / original) * 100) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <div className="flex items-center justify-between px-2">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-mono text-sm uppercase tracking-wider"
        >
          <div className="bg-white/10 p-2 rounded-full"><ArrowLeft size={16} /></div>
          Back
        </button>
        <div className="flex items-center gap-2">
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-brand hover:text-white transition-colors flex items-center gap-2 bg-brand/10 px-4 py-2 rounded-full border border-brand/20">
                SOURCE LINK <ExternalLink size={12} />
            </a>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white truncate font-mono" title={data.title}>
            {data.title || "Untitled Page"}
          </h2>
          <p className="text-sm text-white/40 truncate mt-1 font-mono">{data.url}</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8 bg-black/30 p-4 rounded-3xl border border-white/5">
            <div className="text-right">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Tokens</p>
                <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-xl font-mono text-white">{cleaned.toLocaleString()}</span>
                </div>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Optimized</p>
                <p className="text-xl font-mono text-brand">-{reduction}%</p>
            </div>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col h-[70vh] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex p-1 bg-black/40 rounded-full border border-white/5">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'preview' 
                ? 'bg-white text-black shadow-lg' 
                : 'text-white/40 hover:text-white'
              }`}
            >
              <FileText size={14} />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'raw' 
                ? 'bg-brand text-black shadow-lg' 
                : 'text-white/40 hover:text-white'
              }`}
            >
              <Code size={14} />
              Code
            </button>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${copied 
              ? 'bg-green-500 text-black' 
              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-transparent relative custom-scrollbar">
          {activeTab === 'preview' ? (
            <div className="max-w-none prose prose-invert prose-p:text-white/80 prose-headings:font-bold prose-headings:font-mono prose-a:text-brand hover:prose-a:text-white prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-img:rounded-2xl p-8 mx-auto">
              <ReactMarkdown>{data.markdown_content}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full w-full">
                <textarea 
                    readOnly
                    value={data.markdown_content}
                    className="w-full h-full p-8 font-mono text-sm leading-relaxed bg-black/20 text-white/70 outline-none resize-none"
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### `scrape2md_website/services/api.ts`
```typescript
import { API_BASE_URL, API_ENDPOINT_SCRAPE } from '../constants';
import { ScrapeRequest, ScrapeResponse } from '../types';

export const convertUrl = async (data: ScrapeRequest): Promise<ScrapeResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT_SCRAPE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Scraping failed:", error);
    throw error;
  }
};
```

### `scrape2md_website/constants.ts`
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_ENDPOINT_SCRAPE = '/scrape';
```

### `scrape2md_website/types.ts`
```typescript
export interface ScrapeRequest {
  url: string;
  wait_for_selector?: string;
  include_images?: boolean;
}

export interface ScrapeResponseMetadata {
  original_length: number;
  cleaned_length: number;
}

export interface ScrapeResponse {
  url: string;
  title: string;
  markdown_content: string;
  metadata: ScrapeResponseMetadata;
}

export interface ApiError {
  message: string;
  detail?: string;
}
```

### `scrape2md_website/vite.config.ts`
```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```