# LegalHub AI Petition Summarization Microservice

Python FastAPI microservice providing AI-powered petition history summarization and legal keyword extraction using HuggingFace (`falconsai/text-summarization`) and spaCy (`en_core_web_sm`).

---

## 🚀 Setup & Execution Instructions

### 1. Create Virtual Environment
```bash
cd ai-service
python -m venv venv
```

### 2. Activate Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt)**:
  ```cmd
  venv\Scripts\activate.bat
  ```
- **Linux / macOS**:
  ```bash
  source venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 4. Run Microservice (Port 8000)
```bash
uvicorn main:app --reload --port 8000
```

---

## 📡 API Endpoints

### 1. Health Check
- `GET http://localhost:8000/health`
- **Response**: `{"status": "ok", "service": "legalhub-ai-summarizer"}`

### 2. Summarize Case Entries
- `POST http://localhost:8000/summarize`
- **Request Body**:
  ```json
  {
    "entries": [
      "Interim stay order granted by High Court Lahore till next date.",
      "Petitioner submitted additional evidence document copy.",
      "Hearing adjourned to 14th Aug 2026 for final arguments."
    ]
  }
  ```
- **Response**:
  ```json
  {
    "summary": "Interim stay order granted by High Court Lahore. Hearing adjourned for final arguments.",
    "keywords": ["stay order", "granted", "adjourned", "hearing"]
  }
  ```
