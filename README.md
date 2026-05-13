# Nistula AI Guest Messaging Backend

Backend for AI-assisted guest messaging in hospitality operations. The webhook accepts an inbound guest message from any supported channel, normalizes it into a unified schema, classifies intent, generates a draft reply with Claude (with template fallback if the API is unavailable), scores confidence, decides an operational action, and best-effort persists the conversation to PostgreSQL.

## Tech Stack

- Node.js, Express, TypeScript
- PostgreSQL via Prisma (optional)
- Zod for runtime validation
- Anthropic Claude SDK using `claude-sonnet-4-20250514`
- Pino structured logging
- Helmet and rate limiting
- Swagger UI at `/docs`

## Setup

```bash
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env (optional — fallback templates are used if absent).
# Optionally set DATABASE_URL and run migrations:
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

On Windows PowerShell, if script execution blocks `npm`, use `npm.cmd` for each command.

### DATABASE_URL is optional

The webhook works without PostgreSQL. If `DATABASE_URL` is unset:

- The endpoint still returns a fully drafted reply.
- Persistence (guests, reservations, conversations, messages, ai_logs) is skipped.
- Persistence failures with a configured DB are also non-fatal — they are logged but never break the response.

This makes it trivial to test the webhook end-to-end with just `npm install && npm run dev`.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port, defaults to `3000`. |
| `DATABASE_URL` | **Optional** | PostgreSQL connection string. Unset → persistence is skipped. |
| `ANTHROPIC_API_KEY` | **Optional** | Enables Claude draft generation. Unset → fallback templates are used. |
| `RATE_LIMIT_WINDOW_MS` | No | Rate-limit window in ms. Defaults to `60000`. |
| `RATE_LIMIT_MAX` | No | Requests allowed per window. Defaults to `120`. |

## API

### Health

```http
GET /health
```

### Process Message

```http
POST /webhook/message
Content-Type: application/json
```

Allowed `source` values: `whatsapp`, `booking_com`, `airbnb`, `instagram`, `direct`.

Request:

```json
{
  "source": "whatsapp",
  "guest_name": "Rahul Sharma",
  "message": "Is the villa available from April 20 to 24? What is the rate for 2 adults?",
  "timestamp": "2026-05-05T10:30:00Z",
  "booking_ref": "NIS-2024-0891",
  "property_id": "villa-b1"
}
```

Response (HTTP 200 — flat shape, no wrapper):

```json
{
  "message_id": "5b6d9f62-46a9-4f43-9f7c-e9a0b97bfc1e",
  "query_type": "pre_sales_availability",
  "drafted_reply": "Hi Rahul! Great news — Villa B1 is available from April 20 to 24...",
  "confidence_score": 0.91,
  "action": "auto_send"
}
```

Validation error response (HTTP 400):

```json
{ "success": false, "error": "Invalid source" }
```

## Testing With Three Inputs

`samples/requests.http` ships three concrete request examples covering the main paths through the classifier and action logic:

1. WhatsApp pre-sales availability (the brief's literal example).
2. Airbnb post-sales check-in (WiFi + arrival).
3. Instagram complaint at 3am (no hot water) — exercises the complaint cap and `escalate` path.

Open the file in any REST client (VS Code REST Client, JetBrains HTTP, etc.) or use the `curl` snippets in `samples/README.md`.

## Classification

A deterministic keyword / regex classifier runs first — fast, explainable, and well-suited to the small set of hospitality intent categories:

- `pre_sales_availability`
- `pre_sales_pricing`
- `post_sales_checkin`
- `special_request`
- `complaint`
- `general_enquiry`

`complaint` is prioritized over all other categories so operational issues escalate even when the message also contains booking-related language ("the AC is broken, can we still extend our stay?").

## Confidence Scoring Logic

The confidence score is a number in `[0.20, 0.98]` (clamped, 2-decimal precision) that decides which `action` the message gets. It is built from five explicit signals:

| Signal | Effect | Why |
| --- | --- | --- |
| Classifier base certainty | `0.58` default, `0.72–0.92` for keyword-driven matches, `0.96` for complaint signals | Strong signals are the classifier's keyword hits; a default of 0.58 leaves room for both upward and downward adjustment. |
| Short-message ambiguity | `−0.18` if message has fewer than 3 words | Very short messages ("price?") are ambiguous — the draft is more likely to be wrong. |
| Short-draft penalty | `−0.12` if the generated draft is under 40 characters | A short draft usually means Claude hedged or returned almost nothing useful. |
| Fallback template used | `−0.05` if Claude was unavailable and a template was substituted | Templates are safe but generic — they shouldn't be auto-sent. |
| Complaint hard cap | `min(score, 0.55)` if the message is classified as a complaint OR matches complaint-like text | Complaints must never auto-send under any circumstances. The cap forces them into the `escalate` path regardless of other heuristics. |

The action thresholds applied to the final score:

| Condition | Action |
| --- | --- |
| `query_type == "complaint"` | `escalate` (unconditional — set before the score is even read) |
| `score > 0.85` | `auto_send` |
| `0.60 ≤ score ≤ 0.85` | `agent_review` |
| `score < 0.60` | `escalate` |

This produces a safe default: anything ambiguous, anything short, anything that smells like a complaint, and anything where the AI fell back to a template all land in front of a human.

## Architecture Decisions

TypeScript keeps DTOs, service boundaries, and API contracts explicit. Prisma provides typed database access and migrations; it sits behind a `getPrisma()` accessor that returns `null` when no DB is configured, so the webhook works in either mode. Zod validates inbound payloads at runtime. Claude is isolated behind `ai.service.ts`, which handles retries and falls back to deterministic templates so the endpoint is never blocked by an AI outage. The pipeline is a flat service chain (`normalize → classify → AI → confidence → action → persist`) — no event bus, no DI container, just functions composed in the controller.

## Useful Commands

```bash
npm run dev               # tsx watch on src/server.ts
npm run build             # TypeScript compile to dist/
npm run start             # node dist/server.js
npm test                  # vitest run
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```
