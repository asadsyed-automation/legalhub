# LegalHub Complete Database Architecture & Entity Relationship Diagram (ERD)

This document provides the definitive, production-accurate Entity Relationship Diagram (ERD) for the **LegalHub** platform (Emerson University Multan Final Year Project). It covers all database entities, relationships, constraints, indexes, and field definitions across Auth, Profiles, Availability, Bookings, Payments, Enquiries, Engagements, and Reviews.

---

## 1. Visual Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    users ||--o| lawyer_applications : "applies as"
    users ||--o| lawyer_profiles : "maintains"
    users ||--o{ lawyer_services : "offers"
    users ||--o{ availability_rules : "configures"
    users ||--o{ blocked_dates : "blocks"
    users ||--o{ bookings : "books (client)"
    users ||--o{ bookings : "receives (lawyer)"
    users ||--o{ enquiries : "inquires (client)"
    users ||--o{ enquiries : "answers (lawyer)"
    users ||--o{ engagements : "participates (client/lawyer)"
    users ||--o{ reviews : "writes (client)"
    users ||--o{ reviews : "receives (lawyer)"
    users ||--o{ booking_events : "triggers as actor"
    users ||--o{ consultation_notes : "writes (lawyer)"
    users ||--o{ cases : "manages (lawyer)"
    users ||--o{ cases : "linked litigant (client)"
    users ||--o{ case_status_events : "changed by actor"

    lawyer_services ||--o{ bookings : "booked for service"
    bookings ||--o| payments : "paid via"
    bookings ||--o{ booking_events : "audit logs"
    bookings ||--o| enquiries : "converted from"
    bookings ||--o| consultation_notes : "case notes"
    bookings ||--o| engagements : "converted to"
    bookings ||--o| reviews : "client feedback"
    bookings ||--o| cases : "originates from (completed)"

    cases ||--o{ case_parties : "parties involved"
    cases ||--o{ case_status_events : "status audit trail"
    cases ||--o{ case_entries : "diary entries"
    cases ||--o{ hearings : "court appearances"
    cases ||--o{ documents : "case files"
    cases ||--o| fee_agreements : "fee terms"
    cases ||--o{ fee_payments : "client payments"
    cases ||--o{ messages : "case messages"
    bookings ||--o{ messages : "booking messages"
    users ||--o{ documents : "uploaded by"
    users ||--o{ notifications : "receives alerts"
    users ||--o{ messages : "sends messages"

    users {
        uuid id PK
        varchar name
        varchar email UK
        varchar passwordHash
        varchar role "client | lawyer | admin | law_firm"
        integer failedLoginAttempts
        timestamp lockedUntil
        timestamp createdAt
        timestamp updatedAt
    }

    lawyer_applications {
        uuid id PK
        uuid userId FK,UK
        varchar barCouncil
        varchar enrolmentNo
        varchar courtLevel
        varchar city
        text[] practiceAreas
        integer experienceYears
        text chamberAddress
        text bio
        varchar status "pending | approved | rejected"
        text rejectionReason
        uuid reviewedBy FK
        timestamp reviewedAt
        timestamp createdAt
        timestamp updatedAt
    }

    lawyer_profiles {
        uuid id PK
        uuid userId FK,UK
        varchar headline
        text about
        text[] languages
        integer slotMinutes "15 | 30 | 45 | 60"
        boolean isPublic
        timestamp createdAt
        timestamp updatedAt
    }

    lawyer_services {
        uuid id PK
        uuid lawyerId FK
        varchar mode "chat | phone | video | in_chamber"
        integer durationMinutes
        integer feePkr
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }

    availability_rules {
        uuid id PK
        uuid lawyerId FK
        integer dayOfWeek "0=Sun .. 6=Sat"
        time startTime
        time endTime
        timestamp createdAt
        timestamp updatedAt
    }

    blocked_dates {
        uuid id PK
        uuid lawyerId FK
        date date
        varchar reason
        timestamp createdAt
        timestamp updatedAt
    }

    bookings {
        uuid id PK
        uuid clientId FK
        uuid lawyerId FK
        uuid serviceId FK,NULL
        varchar mode "chat | phone | video | in_chamber"
        date date
        timestamp startUtc
        timestamp endUtc
        timestamp startsAt
        timestamp endsAt
        integer durationMinutes
        integer feePkr
        integer totalFeePkr
        varchar status "requested | accepted | paid | confirmed | completed | declined | cancelled | expired | refunded | pending"
        text issueSummary
        text clientNotes
        text lawyerNotes
        text declineReason
        text cancelReason
        text cancellationReason
        varchar sessionInfo
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }

    payments {
        uuid id PK
        uuid bookingId FK,UK
        integer amountPkr
        varchar method "sandbox"
        varchar status "succeeded | refunded"
        varchar reference UK
        timestamp createdAt
        timestamp updatedAt
    }

    booking_events {
        uuid id PK
        uuid bookingId FK
        varchar fromStatus
        varchar toStatus
        text note
        uuid actorId FK
        timestamp createdAt
        timestamp updatedAt
    }

    enquiries {
        uuid id PK
        uuid clientId FK
        uuid lawyerId FK
        varchar practiceArea
        varchar subject
        text message
        varchar status "pending | answered | closed"
        text answerText
        timestamp answeredAt
        timestamp closedAt
        uuid convertedBookingId FK,NULL
        timestamp createdAt
        timestamp updatedAt
    }

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
        varchar status "active | closed"
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
        integer rating "1 .. 5"
        text comment
        boolean isPublic
        text lawyerReply
        timestamp repliedAt
        timestamp createdAt
        timestamp updatedAt
    }

    cases {
        uuid id PK
        uuid lawyerId FK
        uuid clientId FK,NULL
        uuid bookingId FK,UK,NULL
        varchar title
        varchar practiceArea
        varchar court
        varchar caseOrFirNumber
        date filingDate
        varchar status "Prospect | Active | Stay | Disposed | Archived"
        varchar stage "Pre-filing .. Appeal / Revision"
        timestamp nextHearing
        timestamp createdAt
        timestamp updatedAt
    }

    case_parties {
        uuid id PK
        uuid caseId FK
        varchar name
        varchar roleLabel
        timestamp createdAt
        timestamp updatedAt
    }

    case_status_events {
        uuid id PK
        uuid caseId FK
        varchar fromStatus
        varchar toStatus
        varchar fromStage
        varchar toStage
        uuid changedBy FK
        timestamp createdAt
    }

    case_entries {
        uuid id PK
        uuid caseId FK
        date entryDate
        varchar entryType "petition | order | note"
        varchar title
        text body
        varchar visibility "private | shared"
        timestamp createdAt
        timestamp updatedAt
    }

    hearings {
        uuid id PK
        uuid caseId FK
        timestamp scheduledAt
        varchar court
        varchar bench
        varchar stage
        varchar outcome
        date nextDate
        varchar adjournmentReason
        text note "PRIVATE (lawyer-only)"
        text clientExplanation
        varchar visibility "private | shared"
        timestamp createdAt
        timestamp updatedAt
    }

    documents {
        uuid id PK
        uuid caseId FK
        uuid uploadedBy FK
        varchar originalName
        varchar mimeType
        bigint sizeBytes
        varchar docType "Petition | Court Order | Evidence | Affidavit | Contract | FIR Copy | Identity Document | Other"
        jsonb tags
        varchar visibility "private | shared"
        varchar publicId "Authenticated asset ID"
        varchar resourceType "raw | image"
        timestamp createdAt
        timestamp updatedAt
    }

    fee_agreements {
        uuid id PK
        uuid caseId FK,UK
        varchar type "fixed | per_appearance | stage_wise"
        integer agreedAmountPkr
        varchar notes
        timestamp createdAt
        timestamp updatedAt
    }

    fee_payments {
        uuid id PK
        uuid caseId FK
        integer amountPkr
        varchar method "cash | bank | jazzcash | easypaisa | cheque"
        varchar reference
        date paidOn
        varchar note
        timestamp createdAt
        timestamp updatedAt
    }

    notifications {
        uuid id PK
        uuid userId FK
        varchar type "booking_created | hearing_reminder | ..."
        varchar title
        text body
        varchar link
        timestamp readAt
        varchar emailStatus "queued | sent | failed | skipped"
        jsonb metadata
        timestamp createdAt
        timestamp updatedAt
    }

    messages {
        uuid id PK
        uuid senderId FK
        uuid bookingId FK
        uuid caseId FK
        text content
        jsonb attachments
        timestamp readAt
        timestamp createdAt
        timestamp updatedAt
    }
```

---

## 2. Table-by-Table Architectural Summary

| # | Table Name | Primary Responsibility | Critical Constraints & Indexes |
|---|:---|:---|:---|
| 1 | `users` | Unified authentication & RBAC account store | `email` (UNIQUE), `role` ENUM |
| 2 | `lawyer_applications` | Bar Council credentials & administrative review | `userId` (UNIQUE FK), Composite `(barCouncil, enrolmentNo)` (UNIQUE) |
| 3 | `lawyer_profiles` | Practitioner public bio, languages, and booking settings | `userId` (UNIQUE FK), `slotMinutes` CHECK |
| 4 | `lawyer_services` | Service catalogue (modes, durations, pricing in PKR) | `(lawyerId, mode)` (UNIQUE), max 4 per lawyer |
| 5 | `availability_rules` | Weekly recurring working hours | Index on `lawyerId`, `dayOfWeek` (0–6) |
| 6 | `blocked_dates` | Ad-hoc vacation / court holiday date overrides | `(lawyerId, date)` (UNIQUE) |
| 7 | `bookings` | Appointments, schedules, and FSM lifecycle | **Partial Unique Index:** `(lawyerId, startsAt) WHERE status IN ('requested', 'accepted', 'paid', 'confirmed', 'pending')` |
| 8 | `payments` | Simulated financial checkout records | `bookingId` (UNIQUE FK), `reference` (UNIQUE) |
| 9 | `booking_events` | Immutable transition audit trail | Index on `bookingId`, `actorId` |
| 10 | `enquiries` | Pre-booking prospective client advisory pipeline | Max 3 pending per (client, lawyer) pair |
| 11 | `consultation_notes` | Privileged advocate case work product (*Basta*) | `bookingId` (UNIQUE FK), lawyer-only privacy |
| 12 | `engagements` | Formal ongoing case representation (*Vakalatnama*) | Indexes on `clientId`, `lawyerId`, `status` |
| 13 | `reviews` | Rule 135 compliant verified client ratings (1–5 stars) | `bookingId` (UNIQUE FK), Index on `(lawyerId, rating)` |
| 14 | `cases` | Advocate case files & litigation management (*Basta*) | `bookingId` (UNIQUE FK, NULLABLE), Indexes on `lawyerId`, `clientId`, `status`, `court` |
| 15 | `case_parties` | Litigants, petitioners, and respondents (up to 10) | Index on `caseId`, CASCADE delete on case destruction |
| 16 | `case_status_events` | Immutable audit log of status & stage changes | Index on `caseId`, `changedBy` |
| 17 | `case_entries` | Case diary proceedings, orders, and trial memos (*Roznamcha*) | Indexes on `caseId`, `(caseId, visibility)`, `entryDate` |
| 18 | `hearings` | Court hearing dates, cause lists, and outcomes (*Peshian*) | Indexes on `caseId`, `scheduledAt`, `court`, `(caseId, visibility)` |
| 19 | `documents` | Case files, evidence, petitions, and orders (*Misl / Dastawizat*) | Indexes on `caseId`, `(caseId, visibility)`, `uploadedBy`, `docType` |
| 20 | `fee_agreements` | Case representation fee terms & agreed amounts (*Fee Taiba*) | `caseId` (UNIQUE FK), `agreedAmountPkr` (0–100M PKR) |
| 21 | `fee_payments` | Litigant payment transaction entries (*Wasoolian*) | Indexes on `caseId`, `paidOn`, methods: cash/bank/jazzcash/easypaisa/cheque |
| 22 | `notifications` | In-app alerts, hearing reminders & email audit log (*Ittila-nama*) | Indexes on `(userId, readAt)`, `(userId, createdAt)`, `(userId, type)` |
| 23 | `messages` | Direct client-advocate communications (booking & case contexts) | Indexes on `(bookingId, createdAt DESC)`, `(caseId, createdAt DESC)`, `(senderId, createdAt)` |

---

## 3. Concurrency & Integrity Highlights

1. **Double-Booking Prevention at PostgreSQL Level:**
   `bookings_lawyer_open_slot_idx` guarantees zero slot collisions under simultaneous load without requiring slow distributed locks.
2. **One-to-One Booking to Case Enforced by Unique Constraint:**
   `cases_booking_id_uk` guarantees that a single completed consultation booking can only ever be converted into at most one legal case file.
3. **One-to-One Fee Agreement Enforced by Unique Constraint:**
   `fee_agreements_case_id_uk` guarantees that each case file possesses exactly one authoritative representation fee contract.
4. **Cascading Teardown:**
   Deleting a test user automatically cascades through all 23 dependent tables, enabling sub-second test cleanups.

5. **Privilege Isolation & Zero-Trust Administration:**
   Notes (`consultation_notes`), private diary entries (`case_entries`), hearing notes (`hearings.note`), private documents (`documents`), and fee ledgers (`fee_agreements`, `fee_payments`) are strictly isolated from platform administrators (403 Forbidden) and clients to uphold legal privilege and commercial privacy under the Qanun-e-Shahadat Order 1984.
6. **Private Asset Security & Streaming Proxy:**
   Documents are authenticated private assets in Cloudinary. No public download URLs are ever generated; all files are binary-streamed through LegalHub's authorized controller with magic bytes verification.



