import re
from bs4 import BeautifulSoup, Comment
from markdownify import markdownify as md
from typing import List, Optional
from urllib.parse import urljoin, urlparse

class HTMLCleaner:
    TAGS_TO_REMOVE: List[str] = [
        'script', 'style', 'svg', 'noscript', 'iframe', 'object', 'embed', 
        'nav', 'footer', 'header', 'aside', 'form', 'button', 'input', 'textarea', 'select'
    ]

    NOISE_CLASSES: List[str] = [
        'ad', 'ads', 'advertisement', 'banner', 'popup', 'cookie', 'subscription', 
        'sidebar', 'widget', 'social', 'share', 'promo', 'newsletter', 'comment', 
        'hidden', 'modal'
    ]

    @staticmethod
    def clean_html(html_content: str, remove_selector: Optional[str] = None) -> str:
        if not html_content:
            return ""
            
        soup: BeautifulSoup = BeautifulSoup(html_content, 'html.parser')

        if remove_selector:
            try:
                for tag in soup.select(remove_selector):
                    tag.decompose()
            except Exception:
                pass

        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            comment.extract()

        for tag in soup.find_all(HTMLCleaner.TAGS_TO_REMOVE):
            tag.decompose()

        for tag in soup.find_all(True):
            attrs: dict = tag.attrs
            if not attrs:
                continue
            
            id_str: str = str(attrs.get('id', '')).lower()
            class_str: str = " ".join(attrs.get('class', [])).lower()
            
            if any(x in id_str or x in class_str for x in ['main', 'article', 'content', 'post', 'entry', 'body']):
                continue

            if any(noise in id_str for noise in HTMLCleaner.NOISE_CLASSES) or \
               any(noise in class_str for noise in HTMLCleaner.NOISE_CLASSES):
                tag.decompose()
                continue

        for tag_name in ['article', 'main']:
            candidate = soup.find(tag_name)
            if candidate and len(candidate.get_text(strip=True)) > 200:
                return str(candidate)

        common_selectors: List[str] = [
            '#content', '#main', '#app', '#root', 
            '.content', '.post-content', '.article-body', '.entry-content',
            '[role="main"]'
        ]
        for selector in common_selectors:
            candidate = soup.select_one(selector)
            if candidate and len(candidate.get_text(strip=True)) > 200:
                return str(candidate)
        
        if soup.body:
            return str(soup.body)
            
        return str(soup)

    @staticmethod
    def extract_links(html_content: str, base_url: str) -> List[str]:
        soup: BeautifulSoup = BeautifulSoup(html_content, 'html.parser')
        links: set[str] = set()
        base_domain: str = urlparse(base_url).netloc

        for a_tag in soup.find_all('a', href=True):
            href: str = a_tag['href']
            full_url: str = urljoin(base_url, href)
            parsed_url = urlparse(full_url)

            if parsed_url.netloc == base_domain and parsed_url.scheme in ['http', 'https']:
                clean_url: str = full_url.split('#')[0].rstrip('/')
                if clean_url:
                    links.add(clean_url)
        
        return list(links)

    @staticmethod
    def to_markdown(html_content: str, include_images: bool = False) -> str:
        markdown: str = md(
            html_content, 
            heading_style="ATX", 
            strip=['img'] if not include_images else [] 
        )
        
        cleaned_markdown: str = re.sub(r'\n\s*\n', '\n\n', markdown).strip()
        
        return cleaned_markdown