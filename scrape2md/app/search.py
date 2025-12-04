import logging
from duckduckgo_search import DDGS

logger = logging.getLogger("uvicorn")

class SearchService:
    def __init__(self):
        self.ddgs = DDGS()

    def search(self, query: str, limit: int = 3) -> list[str]:
        """
        Performs a DuckDuckGo search and returns a list of URLs.
        """
        try:
            logger.info(f"Searching for: {query}")
            results = self.ddgs.text(query, max_results=limit)
            urls = [r['href'] for r in results]
            logger.info(f"Found URLs: {urls}")
            return urls
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
