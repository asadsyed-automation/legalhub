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

    lawyer_services ||--o{ bookings : "booked for service"
    bookings ||--o| payments : "paid via"
    bookings ||--o{ booking_events : "audit logs"
    bookings ||--o| enquiries : "converted from"
    bookings ||--o| consultation_notes : "case notes"
    bookings ||--o| engagements : "converted to"
    bookings ||--o| reviews : "client feedback"

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

---

## 3. Concurrency & Integrity Highlights

1. **Double-Booking Prevention at PostgreSQL Level:**
   `bookings_lawyer_open_slot_idx` guarantees zero slot collisions under simultaneous load without requiring slow distributed locks.
2. **Cascading Teardown:**
   Deleting a test user automatically cascades through all 12 dependent tables, enabling sub-second test cleanups.
3. **Privilege Isolation:**
   Notes (`consultation_notes`) are strictly separated from client-shared booking data to uphold legal confidentiality.
