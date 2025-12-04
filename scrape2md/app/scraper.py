import asyncio
import logging
import base64
from urllib.parse import urlparse, urljoin, urlunparse
from playwright.async_api import async_playwright, Browser, Playwright, Page
from typing import List, Dict, Optional, Tuple
from collections import deque
from app.cleaner import HTMLCleaner

logger = logging.getLogger("uvicorn")

class ScraperService:
    def __init__(self, max_concurrency: int = 5):
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.semaphore: asyncio.Semaphore = asyncio.Semaphore(max_concurrency)
        self.user_agent: str = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )

    async def start(self) -> None:
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

    async def stop(self) -> None:
        logger.info("Stopping Playwright browser...")
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("Playwright browser stopped.")

    async def scrape_url(self, url: str, formats: List[str] = ["markdown"], wait_for_selector: Optional[str] = None, target_selector: Optional[str] = None) -> Dict[str, Optional[str]]:
        async with self.semaphore:
            context = await self.browser.new_context(
                user_agent=self.user_agent,
                viewport={"width": 1920, "height": 1080},
                java_script_enabled=True
            )
            
            page = await context.new_page()
            
            try:
                logger.info(f"Navigating to {url}")
                await page.goto(url, timeout=30000, wait_until="domcontentloaded")
                try:
                    await page.wait_for_load_state("networkidle", timeout=10000)
                except Exception:
                    logger.warning("Network idle timeout, proceeding anyway...")
                
                await asyncio.sleep(2)

                if wait_for_selector:
                    try:
                        logger.info(f"Waiting for selector: {wait_for_selector}")
                        await page.wait_for_selector(wait_for_selector, timeout=5000)
                    except Exception as e:
                        logger.warning(f"Timeout waiting for selector {wait_for_selector}: {e}")

                result: Dict[str, Optional[str]] = {
                    "title": await page.title(),
                    "content": None,
                    "screenshot": None,
                    "pdf": None
                }

                if "markdown" in formats:
                    content_html: str = ""
                    if target_selector:
                        try:
                            logger.info(f"Targeting selector: {target_selector}")
                            element = await page.query_selector(target_selector)
                            if element:
                                content_html = await element.inner_html()
                            else:
                                logger.warning(f"Target selector {target_selector} not found. Falling back to full content.")
                                content_html = await page.content()
                        except Exception as e:
                            logger.error(f"Error selecting target: {e}")
                            content_html = await page.content()
                    else:
                        content_html = await page.content()
                    
                    result["content"] = content_html

                if "screenshot" in formats:
                    logger.info("Capturing screenshot...")
                    screenshot_bytes: bytes = await page.screenshot(full_page=True, type='png')
                    result["screenshot"] = base64.b64encode(screenshot_bytes).decode('utf-8')

                if "pdf" in formats:
                    logger.info("Generating PDF...")
                    await page.emulate_media(media="screen")
                    pdf_bytes: bytes = await page.pdf(format="A4", print_background=True)
                    result["pdf"] = base64.b64encode(pdf_bytes).decode('utf-8')
                
                return result
                
            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                raise e
            finally:
                await page.close()
                await context.close()

    async def map_site(self, url: str) -> List[str]:
        async with self.semaphore:
            context = await self.browser.new_context(user_agent=self.user_agent)
            page = await context.new_page()
            try:
                logger.info(f"Mapping site: {url}")
                
                try:
                    await page.goto(url, timeout=15000, wait_until="domcontentloaded")
                except Exception as e:
                    logger.error(f"Failed to load page {url}: {e}")
                    return []

                links = await page.evaluate("""
                    () => {
                        const anchors = Array.from(document.querySelectorAll('a'));
                        return anchors
                            .map(a => a.href)
                            .filter(href => href && !href.startsWith('javascript') && !href.startsWith('mailto') && !href.startsWith('tel') && !href.includes('#'));
                    }
                """)
                logger.info(f"Raw links found: {len(links)}")

                from urllib.parse import urlparse
                
                start_domain = urlparse(url).netloc.replace('www.', '')
                
                valid_links = set()
                for link in links:
                    try:
                        parsed = urlparse(link)
                        link_domain = parsed.netloc.replace('www.', '')
                        
                        if start_domain in link_domain:
                            valid_links.add(link)
                    except:
                        continue

                logger.info(f"Filtered links (same domain): {len(valid_links)}")
                return sorted(list(valid_links))
                
            except Exception as e:
                logger.error(f"Error mapping {url}: {e}")
                raise e
            finally:
                await page.close()
                await context.close()

    def _is_valid_link(self, link: str, base_domain: str) -> bool:
        try:
            parsed = urlparse(link)
            
            if parsed.scheme not in ['http', 'https']:
                return False
                
            if parsed.netloc != base_domain:
                return False
                
            ignored_extensions = {
                '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', 
                '.zip', '.tar', '.gz', '.mp3', '.mp4', '.wav', '.avi', '.xml', 
                '.json', '.ico'
            }
            
            path = parsed.path.lower()
            if any(path.endswith(ext) for ext in ignored_extensions):
                return False
                
            return True
            
        except Exception:
            return False

    def _normalize_url(self, link: str, current_url: str) -> Optional[str]:
        try:
            full_url = urljoin(current_url, link)
            parsed = urlparse(full_url)
            
            clean_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                '', 
                ''  
            ))
            
            return clean_url.rstrip('/')
            
        except Exception:
            return None

    async def crawl_site(self, start_url: str, max_depth: int, max_pages: int, wait_for_selector: Optional[str] = None) -> List[Tuple[str, Optional[str], Optional[str]]]:
        visited: set[str] = set()
        results: List[Tuple[str, Optional[str], Optional[str]]] = []
        
        queue: deque[Tuple[str, int]] = deque([(start_url, 0)])
        
        start_domain = urlparse(start_url).netloc
        
        while queue and len(results) < max_pages:
            current_url, depth = queue.popleft()
            
            if current_url in visited:
                continue
            
            visited.add(current_url)
            
            try:
                scrape_result: Dict[str, Optional[str]] = await self.scrape_url(current_url, formats=["markdown"], wait_for_selector=wait_for_selector)
                results.append((current_url, scrape_result["title"], scrape_result["content"]))
                
                if depth < max_depth and scrape_result["content"]:
                    raw_links: List[str] = HTMLCleaner.extract_links(scrape_result["content"], current_url)
                    
                    for link in raw_links:
                        normalized_url = self._normalize_url(link, current_url)
                        
                        if normalized_url and self._is_valid_link(normalized_url, start_domain):
                            if normalized_url not in visited:
                                queue.append((normalized_url, depth + 1))
                            
            except Exception as e:
                logger.error(f"Failed to crawl {current_url}: {e}")
                continue
                
        return results