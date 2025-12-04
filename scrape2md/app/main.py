import asyncio
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.models import ScrapeRequest, ScrapeResponse, CrawlRequest, CrawlResponse, MapRequest, MapResponse, SearchRequest, SearchResponse, BatchScrapeRequest
from app.scraper import ScraperService
from app.cleaner import HTMLCleaner
from app.summarizer import LocalSummarizer
import logging
import io
import zipfile
import re
from typing import Optional, List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

scraper_service: ScraperService = ScraperService(max_concurrency=5)
local_summarizer: LocalSummarizer = LocalSummarizer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await scraper_service.start()
    yield
    await scraper_service.stop()

app = FastAPI(
    title="Scrape2MD",
    description="A microservice to convert webpages to LLM-friendly Markdown.",
    version="1.1.0",
    lifespan=lifespan
)

origins: List[str] = [
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
async def scrape_endpoint(request: ScrapeRequest) -> ScrapeResponse:
    try:
        logger.info(f"Received scrape request for: {request.url}")
        
        scrape_result: Dict[str, Optional[str]] = await scraper_service.scrape_url(
            str(request.url), 
            formats=["markdown"], 
            wait_for_selector=request.wait_for_selector,
            target_selector=request.target_selector
        )
        
        title: str = scrape_result["title"]
        raw_html: str = scrape_result["content"]
        
        logger.info(f"Scraped Raw HTML Length: {len(raw_html) if raw_html else 0}")
        
        if not raw_html:
             logger.error(f"Scraper returned empty content for {request.url}")
             raise HTTPException(status_code=404, detail="No content retrieved from browser")

        clean_html: str = HTMLCleaner.clean_html(raw_html, request.remove_selector)
        logger.info(f"Cleaned HTML Length: {len(clean_html)}")
        
        markdown_text: str = HTMLCleaner.to_markdown(clean_html, request.include_images)
        logger.info(f"Final Markdown Length: {len(markdown_text)}")
        
        if not markdown_text.strip():
            logger.warning(f"Warning: Markdown conversion produced empty output for {request.url}")
        
        summary_text: Optional[str] = None
        if request.summarize:
            logger.info("Generating summary...")
            summary_text = local_summarizer.summarize_text(markdown_text)

        return ScrapeResponse(
            url=str(request.url),
            title=title,
            markdown_content=markdown_text,
            summary=summary_text,
            metadata={
                "original_length": len(raw_html),
                "cleaned_length": len(markdown_text)
            }
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Scrape failed: {e}")
        raise HTTPException(status_code=500, detail=f"Scrape failed: {e}")

@app.post("/map", response_model=MapResponse)
async def map_endpoint(request: MapRequest) -> MapResponse:
    try:
        logger.info(f"Received map request for: {request.url}")
        
        links = await scraper_service.map_site(str(request.url))
        
        if not links:
            logger.warning(f"No links found for {request.url}")
        
        return MapResponse(
            url=str(request.url),
            links=links
        )
    except Exception as e:
        logger.exception(f"Map failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to map URL: {e}")

@app.post("/crawl", response_model=CrawlResponse)
async def crawl_endpoint(request: CrawlRequest) -> CrawlResponse:
    try:
        logger.info(f"Starting crawl request for: {request.url}")
        
        results_from_scraper: List[Tuple[str, Optional[str], Optional[str]]] = await scraper_service.crawl_site(
            str(request.url),
            max_depth=request.max_depth,
            max_pages=request.max_pages,
            wait_for_selector=request.wait_for_selector
        )
        
        processed_results: List[ScrapeResponse] = []
        for page_url, title, raw_html in results_from_scraper:
            if not raw_html:
                logger.warning(f"No content for {page_url}, skipping.")
                continue

            clean_html: str = HTMLCleaner.clean_html(raw_html)
            markdown_text: str = HTMLCleaner.to_markdown(clean_html, request.include_images)
            
            processed_results.append(ScrapeResponse(
                url=page_url,
                title=title,
                markdown_content=markdown_text,
                metadata={
                    "original_length": len(raw_html),
                    "cleaned_length": len(markdown_text)
                }
            ))

        return CrawlResponse(
            base_url=str(request.url),
            pages_crawled=len(processed_results),
            results=processed_results
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Crawl failed: {e}")
        raise HTTPException(status_code=500, detail=f"Crawl failed: {e}")

@app.post("/map", response_model=MapResponse)
async def map_endpoint(request: MapRequest) -> MapResponse:
    try:
        logger.info(f"Received map request for: {request.url}")
        
        links = await scraper_service.map_site(str(request.url))
        
        if not links:
            logger.warning(f"No links found for {request.url}")
        
        return MapResponse(
            url=str(request.url),
            links=links
        )
    except Exception as e:
        logger.exception(f"Map failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to map URL: {e}")

@app.post("/scrape/batch")
async def batch_scrape_endpoint(request: BatchScrapeRequest) -> StreamingResponse:
    try:
        tasks = [
            scraper_service.scrape_url(str(url), formats=["markdown"], wait_for_selector=request.wait_for_selector)
            for url in request.urls
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
            for i, result in enumerate(results):
                url: str = str(request.urls[i])
                
                if isinstance(result, Exception):
                    logger.error(f"Failed to scrape {url}: {result}")
                    zip_file.writestr(f"error_{i}.txt", f"Failed to scrape {url}\nError: {str(result)}")
                    continue
                
                title: Optional[str] = result["title"] or f"page_{i}"
                safe_title: str = re.sub(r'[\\/*?:"<>|]', "", title).strip() or f"page_{i}"
                filename: str = f"{safe_title}.md"
                
                raw_html: str = result["content"]
                if raw_html:
                    clean_html: str = HTMLCleaner.clean_html(raw_html)
                    markdown: str = HTMLCleaner.to_markdown(clean_html, request.include_images)
                    
                    file_content: str = f"---\nurl: {url}\ntitle: {title}\n---\n\n{markdown}"
                    zip_file.writestr(filename, file_content)
                else:
                    zip_file.writestr(f"{safe_title}_empty.txt", f"No content found for {url}")

        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer, 
            media_type="application/zip", 
            headers={"Content-Disposition": "attachment; filename=batch_scrape.zip"}
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Batch scrape failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch scrape failed: {e}")

@app.post("/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest) -> SearchResponse:
    try:
        urls: List[str] = [] 
        
        tasks = [scraper_service.scrape_url(url, formats=["markdown"]) for url in urls]
        raw_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        processed_results: List[ScrapeResponse] = []
        combined_markdown: str = f"# Search Results for: {request.query}\n\n"
        
        for i, result in enumerate(raw_results):
            url: str = urls[i]
            if isinstance(result, Exception):
                logger.error(f"Failed to scrape {url}: {result}")
                continue
            
            title: str = result["title"]
            raw_html: str = result["content"]
            
            if not raw_html:
                continue

            clean_html: str = HTMLCleaner.clean_html(raw_html)
            markdown_text: str = HTMLCleaner.to_markdown(clean_html, request.include_images)
            
            processed_results.append(ScrapeResponse(
                url=url,
                title=title,
                markdown_content=markdown_text,
                metadata={
                    "original_length": len(raw_html),
                    "cleaned_length": len(markdown_text)
                }
            ))
            
            combined_markdown += f"## Source: [{title}]({url})\n\n{markdown_text}\n\n---\n\n"
            
        return SearchResponse(
            query=request.query,
            results=processed_results,
            combined_markdown=combined_markdown
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search: {e}")

@app.get("/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)