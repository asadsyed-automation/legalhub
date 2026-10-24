# Part H: Consultation Notes, Engagements & Verified Reviews

Welcome to **Part H** of the LegalHub FYP learning guide. In this phase, we bridge the gap between initial paid consultations and long-term legal representation, while establishing accountability through verified client feedback.

---

## 1. Pakistani Real-Life Analogies

To understand the three pillars of Part H, let us look at the daily reality of Pakistani courts (District Courts and High Court benches across Lahore, Multan, and Karachi):

### A. The Advocate's Basta & Case Diary (Consultation Notes)
In every court chamber, an advocate keeps a cloth bag (*Basta*) containing personal case diaries, running notes, and draft strategies. When a client comes for an initial consultation, the lawyer writes down confidential observations:
- *"Client has property deed but mutation (Intiqal) entry at Patwari office is suspicious."*
- *"Limitation period under Limitation Act 1908 expires in 3 weeks; need to file injunction immediately."*

These notes are **strictly confidential work products** protected under attorney-client privilege. The client never reads the lawyer's internal tactical notes. Only the advocate who held the consultation can view or update them.

### B. The Vakalatnama (Formal Legal Engagement)
An initial 30-minute consultation is just diagnosis. If the client decides to contest a civil revision or criminal appeal, both parties execute a **Vakalatnama** (Power of Attorney).
The one-time consultation now turns into an ongoing **Engagement**:
- Assigned case title (e.g., *"Civil Revision No. 412/2026 - Cantt Land Dispute"*).
- Assigned practice area (`Civil`, `Corporate`, `Family`, etc.).
- Active status while hearings are underway.
- Formal closure when the decree is passed or out-of-court settlement is reached.

### C. The Post-Hearing Verified Client Review
Under Rule 135 of the Legal Practitioners and Bar Councils Rules 1976, Pakistani advocates cannot commercially advertise or pay for top spots on billboards.
However, clients who have genuinely completed a formal legal consultation have a constitutional right to share honest, verified feedback.
To eliminate fake reviews, defamation, or competitor sabotage:
- Only a client who paid for and **completed** a consultation can submit a review.
- Exactly one review is permitted per consultation (enforced by a database unique constraint on `bookingId`).
- Ratings range strictly from 1 to 5 stars, paired with descriptive commentary.
- The platform calculates genuine statistical aggregates (average rating, review count, rating breakdown) without promotional bias.

---

## 2. Technical Architecture & Design Decisions

### 1. Advocate Consultation Notes (`consultation_notes`)
* **Privacy Boundary:** Protected by `requireApprovedLawyer` middleware and strict ownership verification (`booking.lawyerId === req.user.id`).
* **Booking State Gate:** Notes can only be recorded once an appointment is `confirmed` or `completed`. Attempting to record notes on a `requested` or `declined` booking is rejected with `400 Bad Request`.
* **Idempotent Upsert:** Uses `ConsultationNote.findOne({ where: { bookingId } })`. If present, it updates the record; if absent, it creates a new record.

### 2. Legal Engagements (`engagements`)
* **Dual Initiation:** Either a client or an advocate/firm can initiate an engagement.
  * If client initiates: `clientId` is extracted from `req.user.id`, and `lawyerId` is provided in the body or derived from `bookingId`.
  * If lawyer/firm initiates: `lawyerId` is extracted from `req.user.id`, and `clientId` is provided in the body.
* **Optional Booking Link:** Can link back to the originating consultation booking (`bookingId`) for audit continuity.
* **Lifecycle:** Starts in `active` state with `startedAt = NOW()`. When updated to `closed`, `closedAt` is set to the current timestamp.

### 3. Verified Reviews (`reviews`)
* **Pre-condition:** `booking.status === 'completed'`. Clients cannot review upcoming or cancelled sessions.
* **Anti-Duplication:** `bookingId` has a `UNIQUE` constraint in PostgreSQL. A client cannot post duplicate reviews for the same consultation.
* **Fair Aggregation:** Public endpoint `GET /api/v1/lawyers/:id/reviews` aggregates:
  * `avgRating`: arithmetic mean rounded to 1 decimal place.
  * `reviewCount`: total verified reviews.
  * `ratingBreakdown`: distribution dictionary `{ 1: x, 2: y, 3: z, 4: w, 5: v }`.

---

## 3. Database Schema

```mermaid
erDiagram
    users ||--o{ consultation_notes : "lawyer notes"
    bookings ||--o| consultation_notes : "booking notes"
    users ||--o{ engagements : "participates in"
    bookings ||--o| engagements : "converted from"
    users ||--o{ reviews : "writes / receives"
    bookings ||--o| reviews : "reviewed consultation"

    consultation_notes {
        uuid id PK
        uuid bookingId FK,UK
        uuid lawyerId FK
        text summary
        jsonb actionItems
        text privateNotes
        timestamp createdAt
        timestamp updatedAt
    }

    engagements {
        uuid id PK
        uuid clientId FK
        uuid lawyerId FK
        uuid bookingId FK,NULL
        varchar title
        varchar practiceArea
        varchar status
        timestamp startedAt
        timestamp closedAt
        text notes
        timestamp createdAt
        timestamp updatedAt
    }

    reviews {
        uuid id PK
        uuid bookingId FK,UK
        uuid clientId FK
        uuid lawyerId FK
        integer rating
        text comment
        boolean isPublic
        timestamp createdAt
        timestamp updatedAt
    }
```

---

## 4. API Endpoints Reference

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/bookings/:id/notes` | Assigned Lawyer / Law Firm | Retrieve private consultation notes |
| `PUT` | `/api/v1/bookings/:id/notes` | Assigned Lawyer / Law Firm | Upsert consultation notes and action items |
| `POST` | `/api/v1/bookings/:id/review` | Client who booked | Submit 1-5 star review for completed booking |
| `GET` | `/api/v1/lawyers/:id/reviews` | Public (No auth) | Paginated reviews & aggregate rating stats |
| `POST` | `/api/v1/engagements` | Client / Lawyer / Law Firm | Initiate formal case engagement |
| `GET` | `/api/v1/engagements` | Authenticated Participant | Paginated list of active/closed engagements |
| `GET` | `/api/v1/engagements/:id` | Authenticated Participant | Get detailed engagement record |
| `PATCH`| `/api/v1/engagements/:id` | Authenticated Participant | Update notes or close engagement |

---

## 5. Hands-on FYP Exercises for Students

### Exercise 1: Test Notes Confidentiality
1. Using Postman, login as a client and obtain a JWT token.
2. Attempt to `GET /api/v1/bookings/<CONFIRMED_BOOKING_ID>/notes`.
3. Verify that the response returns `403 Forbidden` with the error message:
   `"Forbidden: Only the assigned legal practitioner can view or record consultation notes"`.

### Exercise 2: End-to-End Review Submission
1. In your test database or Postman, advance a booking to `completed` via `PATCH /api/v1/bookings/:id/complete`.
2. As the client, submit `POST /api/v1/bookings/:id/review` with `{ "rating": 5, "comment": "Excellent legal advice." }`.
3. Query `GET /api/v1/lawyers/:lawyerId/reviews` and verify that `avgRating` equals `5.0` and `reviewCount` increments to `1`.
4. Try submitting the review a second time and observe the `409 Conflict` response.

### Exercise 3: Case Conversion to Engagement
1. Call `POST /api/v1/engagements` linking the completed booking ID.
2. Notice how the engagement references the booking for historical audit.
3. Call `PATCH /api/v1/engagements/:id` with `{ "status": "closed", "notes": "Decree finalized." }`.
4. Verify that `closedAt` is automatically stamped with the current UTC date.

---

## 6. Viva Defense Questions & Answers

### Q1: Why did you separate consultation notes from the booking model itself?
> **Answer:** Separation of concerns and privilege. A booking record is a bilateral transaction between a client and a lawyer containing schedules, fees, and meeting links. Consultation notes are unilateral, confidential attorney work products (*Basta* records). Storing them in a dedicated `consultation_notes` table guarantees that client-facing queries never accidentally leak internal notes, while permitting structured JSONB action items.

### Q2: How does your review system comply with Bar Council Rule 135?
> **Answer:** Rule 135 of the Legal Practitioners and Bar Councils Rules 1976 prohibits commercial solicitation and self-promotion. Our review system:
> 1. Restricts reviews strictly to verified clients who have completed a booked consultation.
> 2. Does not allow advocates to pay for badges, featured placements, or review prominence.
> 3. Displays all public reviews in strictly chronological order with objective arithmetic averages.

### Q3: Why is `bookingId` defined as `UNIQUE` in the reviews table?
> **Answer:** To prevent review spamming, retaliation, or rating manipulation. Each consultation represents a single professional interaction; allowing only one review per booking ensures a 1-to-1 relationship and eliminates ballot-stuffing.

### Q4: How is data consistency maintained when an engagement is closed?
> **Answer:** When an engagement status transitions from `active` to `closed`, the service explicitly sets `closedAt = new Date()`. If an administrator or advocate re-opens a closed engagement back to `active`, the service clears the timestamp (`closedAt = null`), preserving a clean temporal state.

### Q5: How are aggregate review statistics calculated without performance degradation?
> **Answer:** We index `lawyerId` and `rating` on the `reviews` table. When fetching reviews for a practitioner, the query aggregates count and averages only across verified public reviews for that specific practitioner using efficient indexed lookups.
