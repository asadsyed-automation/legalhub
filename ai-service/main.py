import re
import math
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="LegalHub AI Document Summarizer & Bilingual Search",
    description="Microservice providing Pakistani legal document summarization, entity extraction, and bilingual search.",
    version="1.0.0"
)

# Allow requests from LegalHub frontend & backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000", "http://127.0.0.1:3000", "http://127.0.0.1:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Regex Knowledge Bases for Pakistani Legal Entities
# ---------------------------------------------------------
URDU_RANGE = re.compile(r'[\u0600-\u06FF]')

# Pakistani Statutes & Sections (English & Urdu)
STATUTE_PATTERNS = [
    # English Patterns
    re.compile(r'\b(?:Section|Sec\.?|u/s|under section)\s+(\d+[A-Z]?(?:-\w+)?)\s*(?:of\s+the\s+)?(PPC|CrPC|CPC|QSO|Pakistan Penal Code)?\b', re.IGNORECASE),
    re.compile(r'\b(Article\s+\d+(?:\([0-9a-zA-Z]+\))?)\s*(?:of\s+the\s+Constitution)?\b', re.IGNORECASE),
    re.compile(r'\bOrder\s+([IVXLCDM\d]+)\s+Rule\s+(\d+(?:\s*(?:&|and)\s*\d+)?)\s*(?:CPC)?\b', re.IGNORECASE),
    re.compile(r'\b(?:FIR\s*(?:No\.?)?)\s*(\d+/\d{2,4})\b', re.IGNORECASE),
    # Urdu Patterns
    re.compile(r'(?:دفعہ|سیکشن)\s*([0-9\u06F0-\u06F9]+(?:-[a-zA-Z\u0600-\u06FF]+)?)\s*(?:تعزیراتِ?\s*پاکستان|ضابطہ\s*فوجداری|ضابطہ\s*دیوانی)?'),
    re.compile(r'(?:آرٹیکل)\s*([0-9\u06F0-\u06F9]+(?:\([0-9\u06F0-\u06F9a-zA-Z]+\))?)'),
    re.compile(r'(?:مقدمہ\s*نمبر|ایف\s*آئی\s*آر\s*نمبر)\s*([0-9\u06F0-\u06F9]+/[0-9\u06F0-\u06F9]{2,4})')
]

COURT_PATTERNS = [
    re.compile(r'\b(Supreme Court of Pakistan|Lahore High Court|Sindh High Court|Islamabad High Court|Peshawar High Court|High Court|Sessions Court|District Court|Civil Court|Family Court|Banking Court|Anti-Terrorism Court|Special Court)\b', re.IGNORECASE),
    re.compile(r'(سپریم کورٹ آف پاکستان|لاہور ہائی کورٹ|سندھ ہائی کورٹ|اسلام آباد ہائی کورٹ|پشاور ہائی کورٹ|ہائی کورٹ|سیشن کورٹ|ضلعی عدالت|سول کورٹ|فیملی کورٹ|بینکنگ کورٹ)')
]

PARTY_PATTERNS = [
    re.compile(r'\b(Petitioner|Respondent|Appellant|Plaintiff|Defendant|Complainant|Accused)\b', re.IGNORECASE),
    re.compile(r'(سائل|مدعی|مدعا علیہ|مستغیث|ملزم|اپیل کنندہ|مقدمہ باز)')
]

DATE_PATTERNS = [
    re.compile(r'\b(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3,9})[-/.]\d{2,4})\b'),
    re.compile(r'([0-9\u06F0-\u06F9]{1,2}\s+(?:جنوری|فروری|مارچ|اپریل|مئی|جون|جولائی|اگست|ستمبر|اکتوبر|نومبر|دسمبر)\s+[0-9\u06F0-\u06F9]{4})')
]


# ---------------------------------------------------------
# Request & Response Schemas
# ---------------------------------------------------------
class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=100000, description="Legal text to summarize")
    language: Optional[str] = Field("auto", description="'en', 'ur', or 'auto'")
    max_length: Optional[int] = Field(250, description="Max word count for summary")

class SummarizeResponse(BaseModel):
    summary: str
    key_clauses: List[str]
    entities: Dict[str, List[str]]
    language: str
    word_count: int
    reading_time_minutes: float

class SearchDocument(BaseModel):
    id: str
    title: Optional[str] = ""
    text: str

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=200)
    documents: List[SearchDocument] = Field(..., description="Documents or case diary entries to search")
    top_k: Optional[int] = Field(10, description="Max results to return")

class SearchResultItem(BaseModel):
    id: str
    title: str
    score: float
    snippet: str

class SearchResponse(BaseModel):
    query: str
    total_matches: int
    results: List[SearchResultItem]


# ---------------------------------------------------------
# Extraction & Summarization Helpers
# ---------------------------------------------------------
def detect_language(text: str) -> str:
    urdu_chars = len(URDU_RANGE.findall(text))
    total_chars = len(text.strip())
    if total_chars == 0:
        return "en"
    if (urdu_chars / total_chars) > 0.15:
        return "ur"
    return "en"

def extract_entities(text: str) -> Dict[str, List[str]]:
    statutes = set()
    for pat in STATUTE_PATTERNS:
        for match in pat.finditer(text):
            statutes.add(match.group(0).strip())

    courts = set()
    for pat in COURT_PATTERNS:
        for match in pat.finditer(text):
            courts.add(match.group(0).strip())

    parties = set()
    for pat in PARTY_PATTERNS:
        for match in pat.finditer(text):
            parties.add(match.group(0).strip())

    dates = set()
    for pat in DATE_PATTERNS:
        for match in pat.finditer(text):
            dates.add(match.group(0).strip())

    return {
        "statutes": sorted(list(statutes)),
        "courts": sorted(list(courts)),
        "parties": sorted(list(parties)),
        "dates": sorted(list(dates))
    }

def split_into_sentences(text: str) -> List[str]:
    # Handles both English punctuation and Urdu full-stop (۔)
    sentences = re.split(r'(?<=[.!?۔\n])\s+', text)
    cleaned = [s.strip() for s in sentences if len(s.strip()) > 15]
    return cleaned

def generate_extractive_summary(text: str, target_word_limit: int, lang: str) -> tuple[str, List[str]]:
    sentences = split_into_sentences(text)
    if not sentences:
        return text[:300], []

    # Score sentences by legal keyword density, presence of entities, and position
    scored_sentences = []
    
    important_keywords_en = ["order", "decree", "judgment", "held", "direct", "petition", "bail", "admit", "dismiss", "plaint", "accused", "shall", "liable"]
    important_keywords_ur = ["حکم", "فیصلہ", "ہدایت", "درخواست", "ضمانت", "منظور", "مسترد", "دعوی", "ملزم", "پابند", "سزا"]

    for idx, sent in enumerate(sentences):
        score = 0.0
        # Position score (earlier sentences often contain intro facts, later sentences contain orders)
        if idx == 0:
            score += 2.0
        elif idx == len(sentences) - 1:
            score += 2.5

        lower = sent.lower()
        if lang == "ur":
            for kw in important_keywords_ur:
                if kw in sent:
                    score += 1.5
        else:
            for kw in important_keywords_en:
                if kw in lower:
                    score += 1.5

        # Check for numbers / section citations
        if re.search(r'\d+', sent):
            score += 1.0

        scored_sentences.append((score, idx, sent))

    # Sort by score descending to pick top sentences
    scored_sentences.sort(key=lambda x: x[0], reverse=True)

    selected = []
    current_words = 0
    key_clauses = []

    for score, idx, sent in scored_sentences:
        sent_words = len(sent.split())
        if current_words + sent_words <= target_word_limit or len(selected) < 2:
            selected.append((idx, sent))
            current_words += sent_words
            if score >= 2.0 and len(key_clauses) < 4:
                key_clauses.append(sent)
        if current_words >= target_word_limit:
            break

    # Restore chronological reading order
    selected.sort(key=lambda x: x[0])
    summary_text = " ".join([s[1] for s in selected])

    return summary_text, key_clauses


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "legalhub-ai",
        "version": "1.0.0",
        "capabilities": ["summarize", "search", "entity_extraction", "bilingual_ur_en"]
    }

@app.post("/api/v1/ai/summarize", response_model=SummarizeResponse)
def summarize_document(req: SummarizeRequest):
    raw_text = req.text.strip()
    if len(raw_text) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text too short to generate a meaningful legal summary"
        )

    # Determine language
    lang = req.language if req.language in ["en", "ur"] else detect_language(raw_text)
    
    # Extract entities
    entities = extract_entities(raw_text)
    
    # Generate summary & key clauses
    summary, key_clauses = generate_extractive_summary(raw_text, req.max_length or 250, lang)
    
    words = raw_text.split()
    word_count = len(words)
    reading_time = round(word_count / 200.0, 2)  # Avg 200 WPM

    return SummarizeResponse(
        summary=summary,
        key_clauses=key_clauses,
        entities=entities,
        language=lang,
        word_count=word_count,
        reading_time_minutes=reading_time
    )

@app.post("/api/v1/ai/search", response_model=SearchResponse)
def search_documents(req: SearchRequest):
    query = req.query.strip().lower()
    if not query:
        raise HTTPException(status_code=422, detail="Search query cannot be empty")

    query_tokens = [t for t in re.split(r'[\s,;.!?۔]+', query) if len(t) > 1]
    
    results = []

    for doc in req.documents:
        doc_text = doc.text or ""
        doc_lower = doc_text.lower()
        title_lower = (doc.title or "").lower()

        score = 0.0
        match_positions = []

        # Check exact phrase match
        if query in doc_lower:
            score += 5.0
            idx = doc_lower.find(query)
            match_positions.append(idx)

        if query in title_lower:
            score += 4.0

        # Check individual tokens
        for token in query_tokens:
            count = doc_lower.count(token)
            if count > 0:
                score += min(count * 1.0, 3.0)
                idx = doc_lower.find(token)
                if idx not in match_positions:
                    match_positions.append(idx)
            if token in title_lower:
                score += 2.0

        if score > 0:
            # Build representative snippet around first match
            if match_positions:
                pos = sorted(match_positions)[0]
                start = max(0, pos - 60)
                end = min(len(doc_text), pos + 120)
                snippet_text = doc_text[start:end].strip()
                if start > 0:
                    snippet_text = "..." + snippet_text
                if end < len(doc_text):
                    snippet_text = snippet_text + "..."
            else:
                snippet_text = doc_text[:150] + ("..." if len(doc_text) > 150 else "")

            # Normalized score (0.0 to 1.0)
            normalized_score = round(min(score / 10.0, 1.0), 3)

            results.append(SearchResultItem(
                id=doc.id,
                title=doc.title or "Untitled Document",
                score=normalized_score,
                snippet=snippet_text
            ))

    # Sort by relevance score descending
    results.sort(key=lambda x: x.score, reverse=True)
    top_results = results[:req.top_k or 10]

    return SearchResponse(
        query=req.query,
        total_matches=len(results),
        results=top_results
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
