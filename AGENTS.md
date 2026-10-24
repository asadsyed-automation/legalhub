# Instructions for AI Coding Assistants (AGENTS.md)

This repository contains the Final Year Project (FYP) for **Emerson University Multan** (Pakistan) developed by final-year undergraduate students (Syed Asad, Muhammad Aqeel, Mubashir Mehmood).

Before taking any action, you **MUST** read [docs/PROJECT_BRIEF.md](file:///d:/BS%20CS/FYP/legalhub/docs/PROJECT_BRIEF.md) to understand the project philosophy, scope, and technical boundaries.

---

## The Six Hard Rules (Non-Negotiable)

1. **Zero Secret Leakage & No Direct Git Commits:**
   * Never print, log, commit, or hardcode real credentials, database hosts, passwords, or project references anywhere (in code, docs, tests, or examples). Always use placeholders or dynamic environment variables.
   * **Never run `git commit` or `git push` autonomously.** The student developers commit and push changes manually.
2. **Teaching Protocol (Plan First $\rightarrow$ Approval $\rightarrow$ Code):**
   * Before modifying code, provide a simple English explanation with a relatable Pakistani real-life analogy and technical definitions.
   * Provide a strict line-by-line file plan and **STOP** to wait for user approval.
   * Run automated tests yourself and show genuine, un-faked terminal output. Never weaken or delete a test to pass. Never claim code works without having executed it.
3. **Documentation Derived From Code:**
   * Documentation is generated *from* the code, not imagined.
   * `backend/docs/API_CONTRACT.md` must strictly match the real runtime payload returned by Express controllers and services.
4. **Honest Academic Claims Only:**
   * **Do not use hyperbole.** Never use terms like "production-grade", "100% test coverage", "flawless", or "official Bar Council verification".
   * Advocate status must be termed **"Admin-Reviewed"** or **"Credentials Reviewed"**—never claim an official endorsement from any statutory Bar Council.
   * Absolutely no fake statistics, fabricated user counts, or synthetic customer testimonials.
5. **Regulatory & Legal Compliance (Rule 135):**
   * Under Rule 135 of the Legal Practitioners and Bar Councils Rules 1976, Pakistani advocates are prohibited from commercial solicitation or advertising.
   * Never introduce "Top", "Best", "Featured", or "Premier" rankings or paid priority sorting.
6. **Backend-First Incremental Slices:**
   * Complete the backend API, migrations, and integration tests of a feature slice *first*.
   * Only build the frontend once the backend slice is tested and approved. Keep changes small, clean, and modular.
