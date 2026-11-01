import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "legalhub-ai"
    assert "capabilities" in data

def test_summarize_english_legal_document():
    sample_text = (
        "In the Lahore High Court, Multan Bench. "
        "Criminal Miscellaneous Petition No. 1294-B of 2026. "
        "Tariq Mehmood, Petitioner versus The State and another, Respondents. "
        "Petition under Section 497 CrPC for grant of post-arrest bail in case FIR No. 204/24 "
        "registered under Section 302/34 PPC at Police Station Cantt, Multan. "
        "The learned counsel for the petitioner contends that there is an unexplained delay of 48 hours "
        "in lodging the FIR. Furthermore, the role attributed to the accused is only of simple lalkara. "
        "The learned prosecutor opposed the petition citing heinousness of the offence. "
        "Having heard both sides and perused the police record, it is held that vicarious liability under "
        "Section 34 PPC requires further inquiry. Consequently, the bail petition is admitted and the petitioner "
        "is directed to be released on bail subject to furnishing bail bonds in the sum of PKR 200,000."
    )

    response = client.post("/api/v1/ai/summarize", json={"text": sample_text, "language": "auto"})
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "en"
    assert len(data["summary"]) > 20
    assert "entities" in data
    assert any("Lahore High Court" in c for c in data["entities"]["courts"])
    assert any("302" in s for s in data["entities"]["statutes"])
    assert data["word_count"] > 50

def test_summarize_urdu_legal_document():
    sample_urdu_text = (
        "لاہور ہائی کورٹ ملتان بینچ۔ "
        "درخواست ضمانت بعد از گرفتاری نمبر 512 سال 2026۔ "
        "ملزم محمد اسد سائل بنام سرکار۔ "
        "مقدمہ ایف آئی آر نمبر 112/26 بجرم دفعہ 302 تعزیرات پاکستان تھانہ سول لائنز ملتان۔ "
        "فاضل وکیل سائل کا مؤقف ہے کہ ملزم کو بے گناہ نامزد کیا گیا ہے اور کوئی آزاد گواہ موقع پر موجود نہ تھا۔ "
        "سرکاری وکیل نے درخواست کی مخالفت کی۔ "
        "عدالت نے ریکارڈ ملاحظہ کرنے کے بعد قرار دیا کہ مقدمہ مزید انکوائری کا تقاضا کرتا ہے۔ "
        "لہٰذا سائل کی درخواست ضمانت منظور کرتے ہوئے ملزم کی رہائی کا حکم صادر فرمایا جاتا ہے۔"
    )

    response = client.post("/api/v1/ai/summarize", json={"text": sample_urdu_text, "language": "auto"})
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "ur"
    assert len(data["summary"]) > 20
    assert any("لاہور ہائی کورٹ" in c for c in data["entities"]["courts"])
    assert any("302" in s for s in data["entities"]["statutes"])

def test_bilingual_search():
    docs = [
        {
            "id": "doc-1",
            "title": "Bail Order in Murder Trial",
            "text": "The petitioner applied for bail under Section 497 CrPC in FIR 402 for offence under Section 302 PPC."
        },
        {
            "id": "doc-2",
            "title": "Civil Partition Suit Plaint",
            "text": "Suit for partition of ancestral property under Code of Civil Procedure CPC Order 7 Rule 1."
        },
        {
            "id": "doc-3",
            "title": "Urdu Roznamcha Report",
            "text": "تھانہ صدر ملتان کی رپورٹ برائے منشیات اور ناجائز اسلحہ برآمدگی۔ ضمانت مسترد کی گئی۔"
        }
    ]

    # 1. Search in English
    res_en = client.post("/api/v1/ai/search", json={
        "query": "bail Section 497",
        "documents": docs
    })
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["total_matches"] >= 1
    assert data_en["results"][0]["id"] == "doc-1"
    assert "snippet" in data_en["results"][0]

    # 2. Search in Urdu
    res_ur = client.post("/api/v1/ai/search", json={
        "query": "ضمانت مسترد",
        "documents": docs
    })
    assert res_ur.status_code == 200
    data_ur = res_ur.json()
    assert data_ur["total_matches"] >= 1
    assert data_ur["results"][0]["id"] == "doc-3"

def test_validation_errors():
    # Empty text
    res = client.post("/api/v1/ai/summarize", json={"text": "short"})
    assert res.status_code == 422

    # Empty search query
    res_search = client.post("/api/v1/ai/search", json={"query": " ", "documents": []})
    assert res_search.status_code == 422
