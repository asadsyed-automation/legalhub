from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from summarizer import summarize_entries

app = FastAPI(
    title="LegalHub AI Petition Summarization Microservice",
    description="Python FastAPI service providing HuggingFace AI petition history summarization and legal keyword extraction.",
    version="1.0.0"
)

# Enable CORS for Node Backend and React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummarizeRequest(BaseModel):
    entries: List[str]

class SummarizeResponse(BaseModel):
    summary: str
    keywords: List[str]

@app.get("/health")
def health_check():
    """Health check endpoint for Node backend service discovery."""
    return {"status": "ok", "service": "legalhub-ai-summarizer"}

@app.post("/summarize", response_model=SummarizeResponse)
def summarize_petition_history(payload: SummarizeRequest):
    """
    Summarize a list of past case entries for an advocate.
    """
    if not payload.entries or len(payload.entries) == 0:
        raise HTTPException(status_code=400, detail="Entries list cannot be empty.")
    
    # Filter out empty or whitespace-only strings
    clean_entries = [e.strip() for e in payload.entries if e and e.strip()]
    if not clean_entries:
        raise HTTPException(status_code=400, detail="No valid text entries provided.")

    try:
        result = summarize_entries(clean_entries)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Summarization failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
