# LegalHub - Complete Database Architecture & Relational Design

This document details the complete PostgreSQL relational database schema for **LegalHub**, hosted on Supabase and managed using Sequelize ORM migrations. It encompasses all 13 core production tables spanning Authentication, Verified Practitioner Directory, Weekly Calendars & Exceptions, Consultation Bookings, Financial Transactions, Legal Retainerships, Privileged Case Work Product, and Verified Client Feedback.

---

## 1. Complete Visual Entity-Relationship (ER) Diagram

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

## 2. Table Specifications

### 2.1 `users` Table
Stores authentication credentials, access roles, and account security lockouts.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `name` | `VARCHAR(255)` | No | None | User's full legal name |
| `email` | `VARCHAR(255)` | No | None | **Unique**, stored strictly in lowercase |
| `passwordHash` | `VARCHAR(255)` | No | None | Bcrypt hash (12 salt rounds, never exposed) |
| `role` | `VARCHAR(50)` | No | `'client'` | Allowed: `'client'`, `'lawyer'`, `'admin'`, `'law_firm'` |
| `failedLoginAttempts` | `INTEGER` | No | `0` | Incremented on bad password; reset on success |
| `lockedUntil` | `TIMESTAMP` | Yes | `NULL` | Future timestamp until which logins are blocked |
| `createdAt` | `TIMESTAMP` | No | Current time | Standard creation audit |
| `updatedAt` | `TIMESTAMP` | No | Current time | Standard modification audit |

---

### 2.2 `lawyer_applications` Table
Stores advocate onboarding submissions, Bar Council credentials, and administrative review states.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `userId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)`, **Unique** (1-to-1) |
| `barCouncil` | `VARCHAR(255)` | No | None | Approved Bar Council (e.g. Punjab Bar Council) |
| `enrolmentNo` | `VARCHAR(255)` | No | None | Bar Council license enrollment number |
| `courtLevel` | `VARCHAR(255)` | No | None | Lower Courts, High Court, or Supreme Court |
| `city` | `VARCHAR(255)` | No | None | City of legal practice |
| `practiceAreas` | `TEXT[]` | No | `ARRAY[]` | Native PostgreSQL string array (1 to 5 practice categories) |
| `experienceYears` | `INTEGER` | No | None | Years of courtroom practice (0 to 60) |
| `chamberAddress` | `TEXT` | No | None | Office location (confidential, never exposed publicly) |
| `bio` | `TEXT` | Yes | `NULL` | Public summary of advocate practice |
| `status` | `VARCHAR(50)` | No | `'pending'` | Allowed: `'pending'`, `'approved'`, `'rejected'` |
| `rejectionReason` | `TEXT` | Yes | `NULL` | Mandatory reason if rejected |
| `reviewedBy` | `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `users(id)` of reviewing Admin |
| `reviewedAt` | `TIMESTAMP` | Yes | `NULL` | Verification timestamp |
| `createdAt` | `TIMESTAMP` | No | Current time | Application submission date |
| `updatedAt` | `TIMESTAMP` | No | Current time | Audit update date |

---

### 2.3 `lawyer_profiles` Table
Stores public practitioner presentation, consultation slot duration defaults, and visibility flags.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `userId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)`, **Unique** (1-to-1) |
| `headline` | `VARCHAR(255)` | Yes | `NULL` | Professional title (e.g. "Senior Civil & High Court Litigator") |
| `about` | `TEXT` | Yes | `NULL` | Detailed bio and chamber philosophy |
| `languages` | `TEXT[]` | No | `ARRAY[]` | Languages spoken (Urdu, English, Punjabi, Saraiki, Pashto, Sindhi) |
| `slotMinutes` | `INTEGER` | No | `30` | Default appointment length (`15`, `30`, `45`, `60`) |
| `isPublic` | `BOOLEAN` | No | `true` | Public directory discovery toggle |
| `createdAt` | `TIMESTAMP` | No | Current time | Profile creation date |
| `updatedAt` | `TIMESTAMP` | No | Current time | Profile update date |

---

### 2.4 `lawyer_services` Table
Stores consultation mode catalog and chamber fee tariffs in Pakistani Rupees (PKR).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `mode` | `VARCHAR(50)` | No | None | `'chat'`, `'phone'`, `'video'`, `'in_chamber'` |
| `durationMinutes` | `INTEGER` | No | `30` | Duration of consultation session |
| `feePkr` | `INTEGER` | No | `0` | Consultation fee in PKR |
| `isActive` | `BOOLEAN` | No | `true` | Active offering flag |
| `createdAt` | `TIMESTAMP` | No | Current time | Service creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Service modification timestamp |

---

### 2.5 `availability_rules` Table
Stores recurring weekly working hours (e.g. Mondays 10:00 to 14:00).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `dayOfWeek` | `INTEGER` | No | None | `0` (Sunday) to `6` (Saturday) |
| `startTime` | `TIME` | No | None | Slot start time (HH:MM:SS) |
| `endTime` | `TIME` | No | None | Slot end time (HH:MM:SS) |
| `createdAt` | `TIMESTAMP` | No | Current time | Audit creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Audit modification timestamp |

---

### 2.6 `blocked_dates` Table
Stores ad-hoc date overrides, court holidays, and vacations.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `date` | `DATE` | No | None | Calendar date blocked (YYYY-MM-DD) |
| `reason` | `VARCHAR(255)` | Yes | `NULL` | Optional memo (e.g. "Summer Court Vacation", "Personal Leave") |
| `createdAt` | `TIMESTAMP` | No | Current time | Creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Modification timestamp |

---

### 2.7 `bookings` Table
The central consultation appointment ledger and Finite State Machine (FSM).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `clientId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` of citizen client |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` of appointed advocate |
| `serviceId` | `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `lawyer_services(id)` |
| `mode` | `VARCHAR(50)` | No | None | `'chat'`, `'phone'`, `'video'`, `'in_chamber'` |
| `date` | `DATE` | Yes | `NULL` | Date of consultation |
| `startsAt` / `startUtc` | `TIMESTAMP` | No | None | Standardized start timestamp |
| `endsAt` / `endUtc` | `TIMESTAMP` | No | None | Standardized end timestamp |
| `durationMinutes` | `INTEGER` | No | `30` | Duration of consultation |
| `feePkr` / `totalFeePkr`| `INTEGER` | No | `0` | Agreed consultation tariff in PKR |
| `status` | `VARCHAR(50)` | No | `'requested'` | `'requested'`, `'accepted'`, `'paid'`, `'confirmed'`, `'completed'`, `'declined'`, `'cancelled'`, `'expired'`, `'refunded'` |
| `issueSummary` | `TEXT` | Yes | `NULL` | Citizen brief complaint description |
| `clientNotes` | `TEXT` | Yes | `NULL` | Client supplementary remarks |
| `lawyerNotes` | `TEXT` | Yes | `NULL` | Advocate remarks |
| `declineReason` | `TEXT` | Yes | `NULL` | Reason given if advocate declines appointment |
| `cancelReason` | `TEXT` | Yes | `NULL` | Reason given if appointment is cancelled |
| `sessionInfo` | `VARCHAR(500)`| Yes | `NULL` | Video link or physical chamber meeting coordinates |
| `expiresAt` | `TIMESTAMP` | Yes | `NULL` | Expiry deadline for payment remittance |
| `createdAt` | `TIMESTAMP` | No | Current time | Appointment request creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Lifecycle state modification timestamp |

---

### 2.8 `payments` Table
Records simulated checkout transactions and fee remittance audits.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `bookingId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `bookings(id)`, **Unique** (1-to-1) |
| `amountPkr` | `INTEGER` | No | None | Amount transacted in PKR |
| `method` | `VARCHAR(50)` | No | `'sandbox'` | Payment method identifier |
| `status` | `VARCHAR(50)` | No | `'succeeded'` | `'succeeded'` or `'refunded'` |
| `reference` | `VARCHAR(100)`| No | None | **Unique** checkout reference token |
| `createdAt` | `TIMESTAMP` | No | Current time | Transaction timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Status update timestamp |

---

### 2.9 `booking_events` Table
Immutable audit trail capturing all state transitions across the consultation lifecycle.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `bookingId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `bookings(id)` |
| `fromStatus` | `VARCHAR(50)` | Yes | `NULL` | Pre-transition status |
| `toStatus` | `VARCHAR(50)` | No | None | New status |
| `note` | `TEXT` | Yes | `NULL` | Event rationale or reason string |
| `actorId` | `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `users(id)` of actor who triggered change |
| `createdAt` | `TIMESTAMP` | No | Current time | Audit log creation date |
| `updatedAt` | `TIMESTAMP` | No | Current time | Modification timestamp |

---

### 2.10 `enquiries` Table
Pre-booking prospective advisory pipeline allowing citizens to submit structured inquiries.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `clientId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `practiceArea` | `VARCHAR(100)`| No | None | Target legal discipline |
| `subject` | `VARCHAR(255)`| No | None | Inquiry title |
| `message` | `TEXT` | No | None | Citizen grievance text |
| `status` | `VARCHAR(50)` | No | `'pending'` | `'pending'`, `'answered'`, `'closed'` |
| `answerText` / `lawyerReply`| `TEXT` | Yes | `NULL` | Advocate prelim response |
| `answeredAt` | `TIMESTAMP` | Yes | `NULL` | Response timestamp |
| `closedAt` | `TIMESTAMP` | Yes | `NULL` | Archive timestamp |
| `convertedBookingId`| `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `bookings(id)` if converted |
| `createdAt` | `TIMESTAMP` | No | Current time | Submission timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Update timestamp |

---

### 2.11 `consultation_notes` Table
Privileged case work product (*Basta*) system. Strictly isolated to the assigned advocate.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `bookingId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `bookings(id)`, **Unique** (1-to-1) |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` of assigned practitioner |
| `summary` | `TEXT` | Yes | `NULL` | Case facts and legal assessment summary |
| `actionItems` | `JSONB` | Yes | `'[]'` | Action checklist array of string items |
| `privateNotes` | `TEXT` | Yes | `NULL` | Strictly confidential litigation strategy |
| `createdAt` | `TIMESTAMP` | No | Current time | Initial record timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Save/edit timestamp |

---

### 2.12 `engagements` Table
Formal ongoing case representation (*Vakalatnama*) retaining an advocate for ongoing litigation.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `clientId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `bookingId` | `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `bookings(id)` if converted from consultation |
| `title` | `VARCHAR(255)`| No | None | Formal matter title (e.g. "Civil Revision in High Court Bench") |
| `practiceArea` | `VARCHAR(100)`| No | None | Practice area of the ongoing case |
| `status` | `VARCHAR(50)` | No | `'active'` | `'active'` or `'closed'` |
| `startedAt` | `TIMESTAMP` | No | Current time | Retainership commencement date |
| `closedAt` | `TIMESTAMP` | Yes | `NULL` | Case resolution or file closure date |
| `notes` | `TEXT` | Yes | `NULL` | Engagement scope, terms, and closing remarks |
| `createdAt` | `TIMESTAMP` | No | Current time | Record creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Record update timestamp |

---

### 2.13 `reviews` Table
Rule 135 compliant verified client ratings (1–5 stars) and chamber responses.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `bookingId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `bookings(id)`, **Unique** (1-to-1) |
| `clientId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` |
| `rating` | `INTEGER` | No | None | Rating score from 1 to 5 stars |
| `comment` | `TEXT` | No | None | Client narrative feedback (10 to 1000 characters) |
| `isPublic` | `BOOLEAN` | No | `true` | Public visibility flag |
| `lawyerReply` | `TEXT` | Yes | `NULL` | Official chamber response to feedback |
| `repliedAt` | `TIMESTAMP` | Yes | `NULL` | Timestamp of advocate reply |
| `createdAt` | `TIMESTAMP` | No | Current time | Submission timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Modification timestamp |

---

### 2.14 `cases` Table
Advocate confidential case files (*Basta*). Linked to clients via completed bookings or offline walk-ins.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `lawyerId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` (Managing advocate) |
| `clientId` | `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `users(id)` (Linked litigant) |
| `bookingId` | `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `bookings(id)`, **Unique** (1-to-1) |
| `title` | `VARCHAR(255)`| No | None | Formal litigation or petition title |
| `practiceArea` | `VARCHAR(50)` | No | None | Practice area classification |
| `court` | `VARCHAR(255)`| No | None | Target judicial forum / bench |
| `caseOrFirNumber`| `VARCHAR(100)`| Yes | `NULL` | Formal court suit number or police FIR number |
| `filingDate` | `DATE` | Yes | `NULL` | Date of institution or filing |
| `status` | `VARCHAR(50)` | No | `'Prospect'` | Lifecycle status (`Prospect`, `Active`, `Stay`, `Disposed`, `Archived`) |
| `stage` | `VARCHAR(100)`| Yes | `NULL` | Litigation stage (`Pre-filing`, `Notice Issued`, `Evidence`, etc.) |
| `nextHearing` | `TIMESTAMP` | Yes | `NULL` | Scheduled next hearing date |
| `createdAt` | `TIMESTAMP` | No | Current time | Case creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Modification timestamp |

---

### 2.15 `case_parties` Table
Up to 10 litigants, petitioners, and respondents associated with a legal case file.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `caseId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `cases(id)`, **CASCADE DELETE** |
| `name` | `VARCHAR(255)`| No | None | Litigant or party legal name |
| `roleLabel` | `VARCHAR(100)`| No | None | Formal designation (`Plaintiff`, `Defendant`, `Petitioner`, `Respondent`) |
| `createdAt` | `TIMESTAMP` | No | Current time | Addition timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Update timestamp |

---

### 2.16 `case_status_events` Table
Immutable audit log of all case status and stage transitions.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `caseId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `cases(id)`, **CASCADE DELETE** |
| `fromStatus` | `VARCHAR(50)` | Yes | `NULL` | Pre-transition status |
| `toStatus` | `VARCHAR(50)` | No | None | Post-transition status |
| `fromStage` | `VARCHAR(100)`| Yes | `NULL` | Pre-transition stage |
| `toStage` | `VARCHAR(100)`| Yes | `NULL` | Post-transition stage |
| `changedBy` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)` of actor who transitioned the case |
| `createdAt` | `TIMESTAMP` | No | Current time | Audit record timestamp |

---

### 2.17 `case_entries` Table
Case diary proceedings, interim orders, and privileged trial notes (*Roznamcha*).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `caseId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `cases(id)`, **CASCADE DELETE** |
| `entryDate` | `DATE` | No | None | Date of court proceeding or chamber memo |
| `entryType` | `VARCHAR(30)` | No | None | Proceeding classification (`petition`, `order`, `note`) |
| `title` | `VARCHAR(150)`| No | None | Heading / memo title |
| `body` | `TEXT` | No | None | Narrative details (up to 5000 characters) |
| `visibility` | `VARCHAR(20)` | No | `'private'` | Visibility flag (`private`, `shared`) |
| `createdAt` | `TIMESTAMP` | No | Current time | Record creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Modification timestamp |

---

### 2.18 `hearings` Table
Scheduled court appearance dates (*Peshian*), judicial benches, and hearing outcomes.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `caseId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `cases(id)`, **CASCADE DELETE** |
| `scheduledAt`| `TIMESTAMP` | No | None | Scheduled appearance timestamp (UTC) |
| `court` | `VARCHAR(255)`| No | None | Forum / Bench (defaults to case's court) |
| `bench` | `VARCHAR(120)`| Yes | `NULL` | Presiding courtroom / bench designation |
| `stage` | `VARCHAR(50)` | Yes | `NULL` | Hearing stage (`Pleadings`, `Issues`, `Evidence`, etc.) |
| `outcome` | `VARCHAR(300)`| Yes | `NULL` | Summary of order or judicial decision |
| `nextDate` | `DATE` | Yes | `NULL` | Next scheduled hearing date announced in court |
| `adjournmentReason`| `VARCHAR(300)`| Yes | `NULL` | Cause for adjournment if not decided |
| `note` | `TEXT` | Yes | `NULL` | **Private** attorney work-product (lawyer-only) |
| `clientExplanation`| `TEXT` | Yes | `NULL` | Plain explanation for litigant transparency |
| `visibility` | `VARCHAR(20)` | No | `'shared'` | Visibility flag (`private`, `shared`) |
| `createdAt` | `TIMESTAMP` | No | Current time | Scheduling timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Modification timestamp |

---

### 2.19 `documents` Table
Digital case files, certified court orders, evidence scans, affidavits, and FIR copies (*Misl / Dastawizat*). Stored as authenticated private assets in Cloudinary with magic bytes file signature validation.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `caseId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `cases(id)`, **CASCADE DELETE** |
| `uploadedBy` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)`, **CASCADE DELETE** |
| `originalName` | `VARCHAR(255)` | No | None | Original upload filename (e.g. `writ_petition.pdf`) |
| `mimeType` | `VARCHAR(100)` | No | None | MIME type validated via magic bytes header |
| `sizeBytes` | `BIGINT` | No | None | Exact file size in bytes ($\le$ 10 MB) |
| `docType` | `VARCHAR(50)` | No | None | Document category (`Petition`, `Court Order`, `Evidence`, etc.) |
| `tags` | `JSONB` | No | `'[]'` | Searchable categorisation tags (max 5 tags, max 30 chars each) |
| `visibility` | `VARCHAR(20)` | No | `'private'` | Access scope (`private` = lawyer only, `shared` = client visible) |
| `publicId` | `VARCHAR(255)` | No | None | Authenticated private Cloudinary asset reference |
| `resourceType` | `VARCHAR(50)` | No | `'raw'` | Cloudinary resource type (`raw`, `image`) |
| `createdAt` | `TIMESTAMP` | No | Current time | Upload timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Modification timestamp |

---

## 3. Database Indexes & High-Speed Constraints

| Index Name | Table | Columns | Type | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `users_email_unique_idx` | `users` | `email` | Unique B-Tree | High-speed login lookup & prevents duplicate emails |
| `lawyer_applications_bar_enrolment_unique` | `lawyer_applications` | `(barCouncil, enrolmentNo)` | Composite Unique | **Anti-fraud**: Prevents duplicate Bar Council credentials |
| `lawyer_applications_status_idx` | `lawyer_applications` | `status` | B-Tree | Fast filtering for directory (approved lawyers only) |
| `lawyer_services_lawyer_mode_unique` | `lawyer_services` | `(lawyerId, mode)` | Composite Unique | Enforces 1 active service tariff per mode |
| `availability_rules_lawyer_day_idx` | `availability_rules` | `(lawyerId, dayOfWeek)` | B-Tree | High-speed weekly schedule calculation |
| `blocked_dates_lawyer_date_unique` | `blocked_dates` | `(lawyerId, date)` | Composite Unique | Prevents duplicate holiday blocks on the same date |
| `bookings_lawyer_open_slot_idx` | `bookings` | `(lawyerId, startsAt) WHERE status IN ('requested', 'accepted', 'paid', 'confirmed', 'pending')` | Partial Unique | **Zero Double-Bookings**: Prevents overlapping slots under simultaneous bookings |
| `payments_booking_unique` | `payments` | `bookingId` | Unique B-Tree | Strict 1-to-1 payment remittance guarantee |
| `payments_reference_unique` | `payments` | `reference` | Unique B-Tree | Prevents duplicate transaction references |
| `consultation_notes_booking_unique` | `consultation_notes` | `bookingId` | Unique B-Tree | Strict 1-to-1 privileged note guarantee |
| `reviews_booking_unique` | `reviews` | `bookingId` | Unique B-Tree | Prevents multiple reviews for the same consultation session |
| `reviews_lawyer_rating_idx` | `reviews` | `(lawyerId, rating)` | Composite B-Tree | High-speed average rating aggregation for advocate profiles |
| `cases_booking_id_uk` | `cases` | `bookingId` | Unique B-Tree (Nullable) | Strict 1-to-1 booking-to-case link; prevents reuse of consultation |
| `cases_lawyer_id_idx` | `cases` | `lawyerId` | B-Tree | High-speed advocate case list querying |
| `cases_client_id_idx` | `cases` | `clientId` | B-Tree | High-speed client case list querying |
| `cases_status_idx` | `cases` | `status` | B-Tree | Fast case lifecycle filtering |
| `cases_court_idx` | `cases` | `court` | B-Tree | Forum & bench filtering |
| `case_parties_case_id_idx` | `case_parties` | `caseId` | B-Tree | Rapid party list retrieval during case queries |
| `case_status_events_case_id_idx`| `case_status_events`| `caseId` | B-Tree | Rapid audit history retrieval |
| `case_entries_case_id_idx` | `case_entries` | `caseId` | B-Tree | Rapid case diary entries querying |
| `case_entries_case_visibility_idx`| `case_entries` | `(caseId, visibility)` | Composite B-Tree | Filtered client visibility query optimization |
| `case_entries_entry_date_idx` | `case_entries` | `entryDate` | B-Tree | Chronological diary order index |
| `hearings_case_id_idx` | `hearings` | `caseId` | B-Tree | Rapid hearing list retrieval per case |
| `hearings_scheduled_at_idx` | `hearings` | `scheduledAt` | B-Tree | High-speed cause list & nextHearing lookup |
| `hearings_court_idx` | `hearings` | `court` | B-Tree | Fast judicial forum filtering |
| `hearings_case_visibility_idx` | `hearings` | `(caseId, visibility)` | Composite B-Tree | Filtered client hearing query optimization |
| `documents_case_id_idx` | `documents` | `caseId` | B-Tree | Rapid document retrieval per case file |
| `documents_case_visibility_idx` | `documents` | `(caseId, visibility)` | Composite B-Tree | Filtered client shared document query optimization |
| `documents_uploaded_by_idx` | `documents` | `uploadedBy` | B-Tree | Fast user upload auditing |
| `documents_doc_type_idx` | `documents` | `docType` | B-Tree | Category-specific filtering (`Petition`, `Evidence`) |

---

### 2.20 `fee_agreements` Table
Contracted terms of professional representation and fee agreements (*Fee Taiba / Muawaza*). Exactly one fee agreement per case file enforced by unique constraint.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `caseId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `cases(id)`, **UNIQUE**, **CASCADE DELETE** |
| `type` | `VARCHAR(30)` | No | None | Agreement model (`fixed`, `per_appearance`, `stage_wise`) |
| `agreedAmountPkr` | `INTEGER` | No | `0` | Contracted amount in PKR ($0$ to $100,000,000$) |
| `notes` | `VARCHAR(500)` | Yes | `NULL` | Fee stages breakdown or billing terms memo |
| `createdAt` | `TIMESTAMP` | No | Current time | Initial agreement timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Terms modification timestamp |

---

### 2.21 `fee_payments` Table
Litigant fee payment ledger entries (*Wasoolian / Khata*). Tracks all payments made across diverse channels (cash, bank, JazzCash, EasyPaisa, cheque).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `caseId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `cases(id)`, **CASCADE DELETE** |
| `amountPkr` | `INTEGER` | No | None | Payment amount in PKR ($1$ to $100,000,000$) |
| `method` | `VARCHAR(30)` | No | None | Payment channel (`cash`, `bank`, `jazzcash`, `easypaisa`, `cheque`) |
| `reference` | `VARCHAR(60)` | Yes | `NULL` | Cheque number, bank IBFT TID, or mobile transaction ID |
| `paidOn` | `DATE` | No | None | Date payment was remitted |
| `note` | `VARCHAR(300)` | Yes | `NULL` | Memo or stage description (e.g., "Advance for evidence stage") |
| `createdAt` | `TIMESTAMP` | No | Current time | Entry recording timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Modification timestamp |

---

### 2.22 `notifications` Table
In-app notification inbox, hearing reminder alerts (*Ittila-nama*), and email delivery tracking.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `userId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)`, **CASCADE DELETE** |
| `type` | `VARCHAR(50)` | No | None | Event kind (`booking_created`, `hearing_reminder`, `document_uploaded`, etc.) |
| `title` | `VARCHAR(255)` | No | None | Short headline for user alert bell |
| `body` | `TEXT` | No | None | Detailed notification message |
| `link` | `VARCHAR(500)` | Yes | `NULL` | Deep link / routing path (e.g., `/cases/:id`) |
| `readAt` | `TIMESTAMPTZ` | Yes | `NULL` | Timestamp when user opened/marked as read (`NULL` = unread) |
| `emailStatus` | `VARCHAR(20)` | No | `'skipped'` | Outbound email status (`queued`, `sent`, `failed`, `skipped`) |
| `metadata` | `JSONB` | Yes | `NULL` | Contextual payload (e.g., `hearingId`, `caseId`, `milestone`, `recipientRole`) |
| `createdAt` | `TIMESTAMP` | No | Current time | Notification generation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Last modification timestamp |

---

### 2.23 `messages` Table
Direct communications between litigants and advocates within consultation booking or active case contexts (*Muraslat*).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `UUIDV4` | **Primary Key** |
| `senderId` | `UUID` | No | None | **Foreign Key** $\rightarrow$ `users(id)`, **CASCADE DELETE** |
| `bookingId` | `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `bookings(id)`, **CASCADE DELETE** |
| `caseId` | `UUID` | Yes | `NULL` | **Foreign Key** $\rightarrow$ `cases(id)`, **CASCADE DELETE** |
| `content` | `TEXT` | No | None | Message text ($1$ to $2,000$ characters) |
| `attachments` | `JSONB` | Yes | `NULL` | Array of optional file metadata objects (max 5) |
| `readAt` | `TIMESTAMPTZ` | Yes | `NULL` | Timestamp when counter-party viewed message (`NULL` = unread) |
| `createdAt` | `TIMESTAMP` | No | Current time | Message sent timestamp |
| `updatedAt` | `TIMESTAMP` | No | Current time | Last modification timestamp |

* **Integrity Constraint:** Check constraint requires `(bookingId IS NOT NULL OR caseId IS NOT NULL)`.

---

## 3. Database Indexes & High-Speed Constraints

| Index Name | Table | Columns | Type | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `users_email_unique_idx` | `users` | `email` | Unique B-Tree | High-speed login lookup & prevents duplicate emails |
| `lawyer_applications_bar_enrolment_unique` | `lawyer_applications` | `(barCouncil, enrolmentNo)` | Composite Unique | **Anti-fraud**: Prevents duplicate Bar Council credentials |
| `lawyer_applications_status_idx` | `lawyer_applications` | `status` | B-Tree | Fast filtering for directory (approved lawyers only) |
| `lawyer_services_lawyer_mode_unique` | `lawyer_services` | `(lawyerId, mode)` | Composite Unique | Enforces 1 active service tariff per mode |
| `availability_rules_lawyer_day_idx` | `availability_rules` | `(lawyerId, dayOfWeek)` | B-Tree | High-speed weekly schedule calculation |
| `blocked_dates_lawyer_date_unique` | `blocked_dates` | `(lawyerId, date)` | Composite Unique | Prevents duplicate holiday blocks on the same date |
| `bookings_lawyer_open_slot_idx` | `bookings` | `(lawyerId, startsAt) WHERE status IN ('requested', 'accepted', 'paid', 'confirmed', 'pending')` | Partial Unique | **Zero Double-Bookings**: Prevents overlapping slots under simultaneous bookings |
| `payments_booking_unique` | `payments` | `bookingId` | Unique B-Tree | Strict 1-to-1 payment remittance guarantee |
| `payments_reference_unique` | `payments` | `reference` | Unique B-Tree | Prevents duplicate transaction references |
| `consultation_notes_booking_unique` | `consultation_notes` | `bookingId` | Unique B-Tree | Strict 1-to-1 privileged note guarantee |
| `reviews_booking_unique` | `reviews` | `bookingId` | Unique B-Tree | Prevents multiple reviews for the same consultation session |
| `reviews_lawyer_rating_idx` | `reviews` | `(lawyerId, rating)` | Composite B-Tree | High-speed average rating aggregation for advocate profiles |
| `cases_booking_id_uk` | `cases` | `bookingId` | Unique B-Tree (Nullable) | Strict 1-to-1 booking-to-case link; prevents reuse of consultation |
| `cases_lawyer_id_idx` | `cases` | `lawyerId` | B-Tree | High-speed advocate case list querying |
| `cases_client_id_idx` | `cases` | `clientId` | B-Tree | High-speed client case list querying |
| `cases_status_idx` | `cases` | `status` | B-Tree | Fast case lifecycle filtering |
| `cases_court_idx` | `cases` | `court` | B-Tree | Forum & bench filtering |
| `case_parties_case_id_idx` | `case_parties` | `caseId` | B-Tree | Rapid party list retrieval during case queries |
| `case_status_events_case_id_idx`| `case_status_events`| `caseId` | B-Tree | Rapid audit history retrieval |
| `case_entries_case_id_idx` | `case_entries` | `caseId` | B-Tree | Rapid case diary entries querying |
| `case_entries_case_visibility_idx`| `case_entries` | `(caseId, visibility)` | Composite B-Tree | Filtered client visibility query optimization |
| `case_entries_entry_date_idx` | `case_entries` | `entryDate` | B-Tree | Chronological diary order index |
| `hearings_case_id_idx` | `hearings` | `caseId` | B-Tree | Rapid hearing list retrieval per case |
| `hearings_scheduled_at_idx` | `hearings` | `scheduledAt` | B-Tree | High-speed cause list & nextHearing lookup |
| `hearings_court_idx` | `hearings` | `court` | B-Tree | Fast judicial forum filtering |
| `hearings_case_visibility_idx` | `hearings` | `(caseId, visibility)` | Composite B-Tree | Filtered client hearing query optimization |
| `documents_case_id_idx` | `documents` | `caseId` | B-Tree | Rapid document retrieval per case file |
| `documents_case_visibility_idx` | `documents` | `(caseId, visibility)` | Composite B-Tree | Filtered client shared document query optimization |
| `documents_uploaded_by_idx` | `documents` | `uploadedBy` | B-Tree | Fast user upload auditing |
| `documents_doc_type_idx` | `documents` | `docType` | B-Tree | Category-specific filtering (`Petition`, `Evidence`) |
| `fee_agreements_case_id_uk` | `fee_agreements` | `caseId` | Unique B-Tree | Enforces 1 contractual fee agreement per case |
| `fee_payments_case_id_idx` | `fee_payments` | `caseId` | B-Tree | Rapid fee payment retrieval and sum calculation per case |
| `fee_payments_paid_on_idx` | `fee_payments` | `paidOn` | B-Tree | Chronological payment receipt ordering |
| `notifications_user_id_read_at_idx` | `notifications` | `(userId, readAt)` | Composite B-Tree | Rapid unread badge count & read-filtered queries |
| `notifications_user_id_created_at_idx` | `notifications` | `(userId, createdAt)` | Composite B-Tree | Chronological pagination of user notification inbox |
| `notifications_user_id_type_idx` | `notifications` | `(userId, type)` | Composite B-Tree | Type-specific filtering & reminder idempotency checks |
| `messages_booking_id_created_at_idx` | `messages` | `(bookingId, createdAt DESC)` | Composite B-Tree | High-speed reverse-chronological booking message history |
| `messages_case_id_created_at_idx` | `messages` | `(caseId, createdAt DESC)` | Composite B-Tree | High-speed reverse-chronological case message history |
| `messages_sender_id_created_at_idx` | `messages` | `(senderId, createdAt)` | Composite B-Tree | Audit logging of sent communications |






