from typing import Optional, List
from pydantic import BaseModel, HttpUrl, Field

class ScrapeRequest(BaseModel):
    url: HttpUrl
    wait_for_selector: Optional[str] = Field(
        default=None, 
        description="CSS selector to wait for before scraping. Useful for SPAs that load content lazily."
    )
    target_selector: Optional[str] = Field(
        default=None,
        description="CSS selector to specifically target for extraction."
    )
    remove_selector: Optional[str] = Field(
        default=None,
        description="CSS selector to exclude from the result."
    )
    include_images: bool = Field(
        default=False,
        description="If true, preserves image links in the Markdown output."
    )
    summarize: bool = Field(
        default=False,
        description="If true, generates an extractive summary of the content."
    )

class ScrapeResponse(BaseModel):
    url: str
    title: Optional[str] = None
    markdown_content: str
    summary: Optional[str] = None
    metadata: dict = Field(default_factory=dict)

class MapRequest(BaseModel):
    url: HttpUrl

class MapResponse(BaseModel):
    url: str
    links: List[str]

class CrawlRequest(BaseModel):
    url: HttpUrl
    max_depth: int = Field(default=1, ge=1, le=3, description="Depth of crawl (1=only input url, 2=input+links, etc). Limit 3 for safety.")
    max_pages: int = Field(default=5, ge=1, le=20, description="Max number of pages to scrape. Limit 20.")
    wait_for_selector: Optional[str] = None
    include_images: bool = False

class CrawlResponse(BaseModel):
    base_url: str
    results: List[ScrapeResponse]

class SearchRequest(BaseModel):
    query: str
    limit: int = Field(default=3, ge=1, le=5, description="Number of results to scrape.")
    include_images: bool = False

class SearchResponse(BaseModel):
    query: str
    results: List[ScrapeResponse]
    combined_markdown: str

class BatchScrapeRequest(BaseModel):
    urls: List[HttpUrl]
    wait_for_selector: Optional[str] = None
    include_images: bool = False