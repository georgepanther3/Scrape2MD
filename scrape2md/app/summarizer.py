import nltk
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words
import logging

logger = logging.getLogger("uvicorn")

class LocalSummarizer:
    def __init__(self, language: str = "english"):
        self.language = language
        self._ensure_nltk_resources()
        self.stemmer = Stemmer(language)
        self.summarizer = LsaSummarizer(self.stemmer)
        self.summarizer.stop_words = get_stop_words(language)

    def _ensure_nltk_resources(self):
        """Ensures necessary NLTK data is downloaded."""
        try:
            nltk.data.find('tokenizers/punkt')
            # Also need 'punkt_tab' for newer nltk versions sometimes, but 'punkt' is standard
            try:
                nltk.data.find('tokenizers/punkt_tab')
            except LookupError:
                 nltk.download('punkt_tab', quiet=True)
        except LookupError:
            logger.info("Downloading NLTK 'punkt' tokenizer...")
            nltk.download('punkt', quiet=True)
            nltk.download('punkt_tab', quiet=True) # Added for newer NLTK compatibility

    def summarize_text(self, text: str, sentence_count: int = 5) -> str:
        """
        Summarizes the given text using LSA.
        Returns a single string paragraph.
        """
        if not text or not text.strip():
            return ""

        try:
            parser = PlaintextParser.from_string(text, Tokenizer(self.language))
            
            # Safety check: If text is too short, just return it or a truncated version
            if len(parser.document.sentences) <= sentence_count:
                return text[:1000] + "..." if len(text) > 1000 else text

            summary_sentences = self.summarizer(parser.document, sentence_count)
            
            # Join sentences into a single paragraph
            summary_text = " ".join([str(sentence) for sentence in summary_sentences])
            return summary_text
            
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            return ""
