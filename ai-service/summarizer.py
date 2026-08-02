import re

# Legal keywords list for lightweight matching
LEGAL_KEYWORDS = [
    'adjourned', 'ordered', 'granted', 'next date', 'bail', 'hearing',
    'judgment', 'stay', 'petition', 'interim', 'notice', 'evidence',
    'arguments', 'high court', 'bench', 'stay order', 'respondent',
    'petitioner', 'advocate', 'dismissed', 'allowed'
]

# Lazy-loaded pipelines to minimize startup latency
_summarizer_pipeline = None
_spacy_nlp = None

def get_spacy_nlp():
    global _spacy_nlp
    if _spacy_nlp is None:
        try:
            import spacy
            _spacy_nlp = spacy.load("en_core_web_sm")
        except Exception:
            _spacy_nlp = False
    return _spacy_nlp

def get_summarizer():
    global _summarizer_pipeline
    if _summarizer_pipeline is None:
        try:
            from transformers import pipeline
            _summarizer_pipeline = pipeline("summarization", model="falconsai/text-summarization")
        except Exception as e:
            print(f"HuggingFace model load notice: {e}")
            _summarizer_pipeline = False
    return _summarizer_pipeline

def extract_keywords(text: str) -> list[str]:
    """Extract legal keywords present in the input text."""
    lower_text = text.lower()
    matched = []
    for kw in LEGAL_KEYWORDS:
        if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
            matched.append(kw)
    
    # Also check SpaCy entity extraction if available
    nlp = get_spacy_nlp()
    if nlp:
        try:
            doc = nlp(text)
            for ent in doc.ents:
                if ent.label_ in ['DATE', 'LAW', 'ORG', 'GPE'] and ent.text.lower() not in matched:
                    matched.append(ent.text)
        except Exception:
            pass

    return list(dict.fromkeys(matched))[:8]  # Unique, limit to 8

def truncate_sentence(text: str, max_words: int = 90) -> str:
    """Ensure summary is clean, sentence-bounded, and under ~90 words."""
    words = text.split()
    if len(words) <= max_words:
        return text.strip()
    
    truncated = " ".join(words[:max_words])
    # Find last period, question mark, or exclamation
    match = re.search(r'(.*[.!?])', truncated)
    if match:
        return match.group(1).strip()
    return truncated.strip() + "..."

def summarize_entries(entries: list[str]) -> dict:
    """
    Combines up to 5 recent case entries and generates a 2-3 line legal summary
    along with extracted key legal terms.
    """
    if not entries:
        raise ValueError("Entries list cannot be empty.")

    # Select last 5 entries max (most recent last)
    recent_entries = entries[-5:]
    combined_text = " ".join(recent_entries).strip()

    keywords = extract_keywords(combined_text)

    summarizer = get_summarizer()
    summary_result = ""

    if summarizer:
        try:
            # HuggingFace pipeline execution
            input_length = len(combined_text.split())
            max_len = min(60, max(20, input_length))
            min_len = min(15, max_len - 5)
            
            res = summarizer(combined_text, max_length=max_len, min_length=min_len, do_sample=False)
            if res and isinstance(res, list) and 'summary_text' in res[0]:
                summary_result = res[0]['summary_text']
        except Exception as err:
            print(f"Summarizer execution fallback: {err}")

    # Lightweight extractive fallback if model isn't downloaded yet or is processing
    if not summary_result:
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', combined_text) if s.strip()]
        if len(sentences) <= 2:
            summary_result = combined_text
        else:
            summary_result = f"{sentences[0]} {sentences[-1]}"

    final_summary = truncate_sentence(summary_result, max_words=90)

    return {
        "summary": final_summary,
        "keywords": keywords
    }
