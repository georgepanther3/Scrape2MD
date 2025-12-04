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