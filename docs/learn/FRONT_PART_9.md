# LegalHub Frontend Engineering Guide: FE-9 (Notifications Bell, Inbox, Direct Case Messages & Live Dashboard)

> **Final Year Project (FYP) — Emerson University Multan**  
> **Student Developers:** Syed Asad, Muhammad Aqeel, Mubashir Mehmood  
> **Module:** Frontend Phase 3 — Connected Case Journey (FE-9: Notifications, Privileged Direct Messaging & Real Dashboard Analytics)  
> **Target Scope:** 60s Background Notification Polling, Topbar Bell Badge, Notifications Inbox Page (`/notifications`), 15s Case-Scoped Direct Messaging (`/cases/:id`), Automatic Read Receipts, and Live Litigation Dashboard Analytics

---

## 1. Architectural Philosophy & Pakistani Court Metaphor

### The Chamber Munshi's Call (*Ittilaa*) & Direct Privileged Conference
* **The Munshi's Alert Bell (*Ghantee / Ittilaa*):** In a traditional Pakistani advocate's chamber, the advocate's clerk (*Munshi*) is the nerve center of all communications. When a bench clerk (*Ahlmad*) fixes an urgent date, or a client deposits an installment via mobile banking, the Munshi immediately alerts the advocate. Without rapid notices, crucial appeal deadlines (*Miyaad*) expire, leading to irrecoverable default judgments (*Yak-Tarfa Faisla*).
* **The Notification Bell System:** In LegalHub, **FE-9** implements an automatic 60-second background polling cycle (`GET /api/v1/notifications/unread-count`). The topbar bell icon dynamically reflects the count of unread judicial notices. Clicking the bell navigates to the dedicated inbox (`/notifications`) where alerts can be reviewed, marked as read, or followed directly to the referenced court brief.
* **The Danger of WhatsApp in Legal Practice:** In conventional Pakistani litigation, advocates and clients communicate through ad-hoc WhatsApp or SMS chats. This leads to leaked evidence, accidental message deletions, and lack of accountability. In LegalHub, **context-scoped direct messaging** anchors all attorney-client communication directly inside the lawsuit's master file (`/cases/:id`).
* **15-Second Synchronized Polling & Automatic Read Receipts:** To ensure responsiveness without the heavy infrastructure and stateful complexity of WebSockets in an undergraduate project, the chat component short-polls the backend every 15 seconds. When the counter-party opens the message view, the backend query automatically marks all unread incoming messages as seen (`readAt = NOW()`), providing clean `✓✓ Seen` receipts.

---

## 2. Complete Trace: From User Send to Database & Counter-Party Receipt

**User Action:** Litigant `ali.client@demo.legalhub.local` sends an urgent inquiry to his advocate:
* **Case ID:** `d290f1ee-6c54-4b01-90e6-d701748f0851`
* **Message:** *"Advocate Sahab, please confirm if the revenue Patwari was served with court summons for tomorrow's hearing."*

```
[ Litigant UI: CaseMessagesTab.jsx ]
       |
       | 1. Litigant types inquiry into textarea (validates length <= 5000)
       | 2. Presses Enter or clicks "Send" button -> handleSendMessage()
       v
[ Frontend API: caseApi.sendCaseMessage(caseId, { content }) ]
       |
       | 3. Axios issues POST /api/v1/cases/:id/messages with Bearer JWT
       v
[ Backend Route: case.routes.js ]
       |
       | 4. verifyToken -> validate(createMessageSchema)
       v
[ Controller Layer: message.controller.js ]
       |
       | 5. messageController.sendCaseMessage(req, res, next)
       v
[ Service Layer: message.service.js ]
       |
       | 6. Finds Case record by PK
       | 7. Verifies user is authorized participant (case.clientId === user.id)
       | 8. Resolves counter-party recipientId (case.lawyerId)
       | 9. Creates database record in "messages" table
       | 10. Dispatches asynchronous notification alert to advocate:
       |     createNotification({ userId: lawyerId, type: 'system', title: 'New Case Message', ... })
       v
[ PostgreSQL Database (Supabase) ]
       |
       | 11. INSERT INTO messages (sender_id, case_id, content, read_at) VALUES (...) RETURNING *;
       | 12. INSERT INTO notifications (user_id, type, title, body, link) VALUES (...) RETURNING *;
       v
[ Backend Response ]
       |
       | 13. Returns 201 Created: { success: true, message: 'Message sent successfully', data: { ... } }
       v
[ Litigant Frontend Update ]
       |
       | 14. Input field clears; local message list appends new message with "✓ Sent" pill
       | 15. Chat area smoothly auto-scrolls to bottom
       v
[ Advocate UI: Background 15s Polling (CaseMessagesTab.jsx) ]
       |
       | 16. Advocate's active browser triggers scheduled 15s poll:
       |     GET /api/v1/cases/:id/messages?page=1&limit=100
       | 17. Backend marks incoming message as read:
       |     UPDATE messages SET read_at = NOW() WHERE case_id = ... AND sender_id != user.id
       | 18. Advocate's chat area appends incoming message on the left with blue timestamp
       v
[ Litigant Next Poll: Read Receipt ]
       |
       | 19. Litigant's client polls 15s later; message now shows "✓✓ Seen"
```

---

## 3. Student Hands-On Exercises

### Exercise 1: Live Case-Scoped Messaging Simulation
**Objective:** Observe the 15-second polling synchronization and automatic read receipt mechanism.
1. Open two browser windows side-by-side:
   - Window A: Log in as advocate `sikandar.adv@demo.legalhub.local`.
   - Window B: Log in as client `ali.client@demo.legalhub.local`.
2. Both users navigate to the same active case (`/cases/:id`) and click the **"Messages"** tab.
3. In Window B (Client), type: *"Respected counsel, please review the draft rejoinder."* and press Enter.
4. Observe that Window B shows the message bubble on the right with a `✓ Sent` marker.
5. In Window A (Advocate), wait up to 15 seconds without refreshing.
6. **Expected Observation:** Window A's chat automatically refreshes, playing a subtle visual pop as the incoming message appears on the left. In Window B, the receipt flips to `✓✓ Seen`.

### Exercise 2: 60-Second Notification Bell Polling
**Objective:** Verify that topbar background polling operates without page refreshes.
1. In Window A (Advocate), navigate to `/dashboard`.
2. In Window B (Client), send a new case message.
3. In Window A, observe the topbar Notification Bell.
4. **Expected Observation:** Within 60 seconds, the background polling cycle updates the unread badge to `1` with a red circular indicator.

### Exercise 3: Notifications Inbox & "Mark All as Read"
**Objective:** Test the full notifications lifecycle and direct deep-linking.
1. Click the topbar Notification Bell (or navigate to `/notifications`).
2. Verify that the incoming case alert appears with a blue `CASE` badge, bold headline, and a blue left-border indicating unread status.
3. Click the **"View"** button on the notification card.
4. **Expected Observation:** The browser navigates directly to the linked case file (`/cases/:id`), and the notification is automatically marked as read.

---

## 4. Final Year Project Viva Voce Defense Q&As

### Q1: Why did you choose 15-second short polling instead of WebSockets (Socket.IO) for case messaging?
**Answer:**  
In our Final Year Project, prioritizing operational reliability, architectural simplicity, and stateless scaling was paramount. WebSockets require stateful persistent TCP connections, custom heartbeat management, sticky sessions across server instances, and complex authentication handshakes. For legal case communication—where messages are deliberate procedural notes exchanged over hours rather than rapid-fire instant messaging—a lightweight 15-second HTTP short-poll (`GET /cases/:id/messages`) guarantees 100% firewall and corporate proxy compatibility, zero connection dropouts, and effortless deployment on standard serverless or containerized hosts without maintaining socket state.

### Q2: How does the messaging endpoint enforce statutory attorney-client privilege?
**Answer:**  
In accordance with Section 126 of the **Qanun-e-Shahadat Order 1984**, communication between an advocate and their client regarding pending litigation is confidential. When `GET /cases/:id/messages` or `POST /cases/:id/messages` is called, the service layer verifies that `req.user.id` is either the case's appointed `lawyerId` or linked `clientId`. Any attempt by an unlinked litigant or third-party advocate returns `HTTP 403 Forbidden`. Furthermore, platform administrators are barred from viewing private case messages.

### Q3: Why does the system mark messages as read automatically during GET requests rather than requiring manual button clicks?
**Answer:**  
In modern messaging paradigms (like WhatsApp and Slack), opening a chat thread constitutes implicit consumption of the content. Requiring users to click an explicit "Mark Read" button on every chat bubble creates unnecessary friction. When `getCaseMessages` executes, it performs an atomic bulk update `UPDATE messages SET read_at = NOW() WHERE sender_id != user.id AND read_at IS NULL`, ensuring read receipts are synchronized effortlessly.

### Q4: How does the notification system prevent notification fatigue for users?
**Answer:**  
The notification service enforces three structural protections:
1. Targeted dispatch: notifications are generated only for substantive milestones (hearing scheduled, bench outcome recorded, direct message sent, or fee payment logged).
2. Unread filtering: the inbox provides an instant "Unread Only" toggle so users can focus on action items.
3. "Mark All as Read": a single click bulk-clears historical unread alerts using `PATCH /api/v1/notifications/read-all`.

### Q5: How do the new dashboard widgets calculate real-time litigation statistics without slowing down initial page load?
**Answer:**  
Rather than executing heavy, monolithic SQL queries that block rendering, the Dashboard leverages `Promise.allSettled` to issue lightweight, decoupled API calls (`caseApi.listCases({ limit: 1 })`, `caseApi.listHearingsAcrossCases()`, and `notificationApi.getUnreadCount()`). If any single query encounters an intermittent delay, the other widgets render immediately without crashing the page, satisfying resilience best practices.

---

## 5. Numbered Manual Test Script

| Step | Action | User Session | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | Open `/login` | `sikandar.adv@demo.legalhub.local`<br>`Advocate@12345` | Authenticates; redirected to `/dashboard`. Topbar displays **Notification Bell** with unread count. |
| **2** | Inspect Dashboard Widgets | Advocate | Dashboard renders **Active Litigation & Court Cause List** panel showing real counts for **Active Case Files**, **Upcoming Hearings**, and **Unread Alerts**. |
| **3** | Click **"All Case Files"** | Advocate | Navigates to `/cases`. Select an active case to open `/cases/:id`. |
| **4** | Switch to **"Messages"** tab | Advocate | Messages workspace loads. Top notice displays **"Privileged Communication"** and green **"Live (15s poll)"** indicator. |
| **5** | Type and Send Message | Advocate | Enter: *"Please provide the original registered deed for tomorrow's evidence hearing."* Click **"Send"**. |
| **6** | Verify Outgoing Bubble | Advocate | Message appears in green bubble on right with `✓ Sent` receipt and local timestamp. Chat auto-scrolls down. |
| **7** | Sign out and log in as client | `ali.client@demo.legalhub.local`<br>`Client@12345` | Client dashboard loads. Within 60 seconds, Notification Bell reflects new alert badge (`1`). |
| **8** | Click Notification Bell | Client | Navigates to `/notifications`. New alert displays headline *"New Case Message"* with blue left border. |
| **9** | Click **"View"** on notification | Client | Directly redirects to the case file (`/cases/:id`). Switch to **"Messages"** tab. |
| **10** | Verify Incoming Message | Client | Lawyer's message appears on the left in white card bubble with lawyer name pill and timestamp. |
| **11** | Reply as Client | Client | Enter: *"Noted Advocate Sahab, I will bring the original deed to your chamber at 08:30 AM."* Click **"Send"**. |
| **12** | Inspect Notifications Inbox | Client | Navigate to `/notifications`. Click **"Mark All as Read"**. All unread borders clear, and bell counter resets to 0. |
| **13** | Mobile Viewport Check (375px) | Either | In mobile view, chat composer remains fixed at bottom, bubbles wrap within 88% screen width, and bell badge remains cleanly aligned. |
