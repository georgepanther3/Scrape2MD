import { API_BASE_URL, API_ENDPOINT_SCRAPE, API_ENDPOINT_MAP, API_ENDPOINT_CRAWL, API_ENDPOINT_SEARCH, API_ENDPOINT_BATCH } from '../constants';
import { ScrapeRequest, ScrapeResponse, MapRequest, MapResponse, CrawlRequest, CrawlResponse, SearchRequest, SearchResponse, BatchScrapeRequest } from '../types';

export const convertUrl = async (data: ScrapeRequest): Promise<ScrapeResponse> => {
  try {
    const response: Response = await fetch(`${API_BASE_URL}${API_ENDPOINT_SCRAPE}`, {
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
  } catch (error: any) {
    console.error("Scraping failed:", error); 
    throw error;
  }
};

export const mapUrl = async (data: MapRequest): Promise<MapResponse> => {
  try {
    const response: Response = await fetch(`${API_BASE_URL}${API_ENDPOINT_MAP}`, {
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
  } catch (error: any) {
    console.error("Mapping failed:", error); 
    throw error;
  }
};

export const crawlUrl = async (data: CrawlRequest): Promise<CrawlResponse> => {
  try {
    const response: Response = await fetch(`${API_BASE_URL}${API_ENDPOINT_CRAWL}`, {
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
  } catch (error: any) {
    console.error("Crawling failed:", error); 
    throw error;
  }
};

export const searchUrl = async (data: SearchRequest): Promise<SearchResponse> => {
  try {
    const response: Response = await fetch(`${API_BASE_URL}${API_ENDPOINT_SEARCH}`, {
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
  } catch (error: any) {
    console.error("Search failed:", error); 
    throw error;
  }
};

export const batchScrapeUrl = async (data: BatchScrapeRequest): Promise<void> => {
  try {
    const response: Response = await fetch(`${API_BASE_URL}${API_ENDPOINT_BATCH}`, {
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

    const blob: Blob = await response.blob();
    const url: string = window.URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = "batch_scrape.zip";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error: any) {
    console.error("Batch scrape failed:", error); 
    throw error;
  }
};