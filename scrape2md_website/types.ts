export interface ScrapeRequest {
  url: string;
  wait_for_selector?: string;
  include_images?: boolean;
  formats?: string[];
  target_selector?: string;
  remove_selector?: string;
  summarize?: boolean;
}

export interface ScrapeResponseMetadata {
  original_length: number;
  cleaned_length: number;
}

export interface ScrapeResponse {
  url: string;
  title: string;
  markdown_content: string;
  summary?: string;
  screenshot_base64?: string;
  pdf_base64?: string;
  metadata: ScrapeResponseMetadata;
}

export interface MapRequest {
  url: string;
}

export interface MapResponse {
  url: string;
  links: string[];
}

export interface CrawlRequest {
  url: string;
  max_depth?: number;
  max_pages?: number;
  wait_for_selector?: string;
  include_images?: boolean;
}

export interface CrawlResponse {
  base_url: string;
  results: ScrapeResponse[];
}

export interface SearchRequest {
  query: string;
  limit?: number;
  include_images?: boolean;
}

export interface SearchResponse {
  query: string;
  results: ScrapeResponse[];
  combined_markdown: string;
}

export interface BatchScrapeRequest {
  urls: string[];
  wait_for_selector?: string;
  include_images?: boolean;
}

export interface ApiError {
  message: string;
  detail?: string;
}