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