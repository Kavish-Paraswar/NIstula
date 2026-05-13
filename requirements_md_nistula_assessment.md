# Nistula Technical Assessment - Complete Requirements & Architecture Prompt

## Objective

Build a production-style AI-powered guest messaging backend platform for hospitality operations that:

- Accepts inbound guest messages from multiple platforms
- Normalizes all incoming payloads into a unified internal schema
- Classifies guest intent
- Uses Claude AI to generate contextual responses
- Returns confidence-scored draft replies
- Supports operational workflows for escalation and human review
- Stores unified guest communication data in PostgreSQL
- Demonstrates scalable backend architecture and engineering thinking

The system should prioritize:
- Clean architecture
- Extensibility
- Maintainability
- Production readiness
- Error handling
- Clear reasoning and documentation

---

# Core Technology Stack

## Backend

Use:

- Node.js
- Express.js
- TypeScript

Reason:
- Faster API development
- Strong typing
- Better maintainability
- Cleaner DTO/schema handling
- Easier scaling for webhook/event systems

Alternative acceptable:
- Python + FastAPI

Recommended:
- Node.js + TypeScript

---

## AI Integration

Use:

- Anthropic Claude API
- Model:
  `claude-sonnet-4-20250514`

SDK:
- Official Anthropic SDK

---

## Database

Use:

- PostgreSQL

ORM Recommendation:
- Prisma ORM

Reason:
- Strong TypeScript support
- Excellent migrations
- Clean schema management
- Better developer experience

Alternative:
- Drizzle ORM

---

## Validation

Use:

- Zod

Reason:
- Runtime validation
- Type inference
- Request validation
- Safer APIs

---

## Environment Management

Use:

- dotenv

Never hardcode:
- API keys
- Database URLs

---

## Logging

Use:

- Pino

Reason:
- Structured logs
- Production-grade logging
- Better debugging

---

## API Documentation

Use:

- Swagger/OpenAPI

Library:
- swagger-ui-express

---

# Required Project Structure

```txt
nistula-technical-assessment/

├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── db.ts
│   │
│   ├── controllers/
│   │   └── message.controller.ts
│   │
│   ├── routes/
│   │   └── message.routes.ts
│   │
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── classification.service.ts
│   │   ├── normalization.service.ts
│   │   ├── confidence.service.ts
│   │   └── action.service.ts
│   │
│   ├── prompts/
│   │   └── guestReply.prompt.ts
│   │
│   ├── schemas/
│   │   ├── webhook.schema.ts
│   │   └── unified.schema.ts
│   │
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   │
│   ├── utils/
│   │   ├── uuid.ts
│   │   ├── logger.ts
│   │   └── helpers.ts
│   │
│   ├── types/
│   │   └── message.types.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   └── schema.prisma
│
├── schema.sql
├── thinking.md
├── README.md
├── .env.example
├── package.json
└── tsconfig.json
```

---

# System Architecture

## High-Level Flow

```txt
Incoming Webhook
        ↓
Request Validation
        ↓
Message Normalization
        ↓
Query Classification
        ↓
Context Builder
        ↓
Claude AI Prompt Generation
        ↓
AI Response Generation
        ↓
Confidence Scoring
        ↓
Action Decision Engine
        ↓
Database Storage
        ↓
Final JSON Response
```

---

# Architecture Design Principles

## 1. Layered Architecture

Separate:

- Routes
- Controllers
- Business logic
- AI logic
- Validation
- Database logic

Never place business logic inside routes.

---

## 2. Service-Oriented Design

Each service must have a single responsibility.

### Services

#### normalization.service.ts

Responsibilities:
- Transform inbound payloads
- Generate UUID
- Create unified schema

---

#### classification.service.ts

Responsibilities:
- Detect query type
- Rule-based + AI-assisted classification

Recommended:
- Hybrid classification approach

---

#### ai.service.ts

Responsibilities:
- Claude API communication
- Prompt generation
- Retry handling
- Response sanitization

---

#### confidence.service.ts

Responsibilities:
Calculate confidence score based on:
- Query clarity
- Classification certainty
- AI response completeness
- Complaint detection
- Ambiguity

---

#### action.service.ts

Responsibilities:
Determine:
- auto_send
- agent_review
- escalate

Rules:
- Complaint → escalate
- Score > 0.85 → auto_send
- 0.60–0.85 → agent_review
- <0.60 → escalate

---

# Webhook API Requirements

## Endpoint

```http
POST /webhook/message
```

---

## Request Validation

Validate:

- source
- guest_name
- message
- timestamp
- booking_ref
- property_id

Reject invalid payloads.

Return:

```json
{
  "success": false,
  "error": "Invalid source"
}
```

---

# Unified Schema Design

## Internal Message Object

```json
{
  "message_id": "uuid",
  "source": "whatsapp",
  "guest_name": "Rahul Sharma",
  "message_text": "Is the villa available...",
  "timestamp": "2026-05-05T10:30:00Z",
  "booking_ref": "NIS-2024-0891",
  "property_id": "villa-b1",
  "query_type": "pre_sales_availability"
}
```

---

# Query Classification System

## Supported Categories

### 1. pre_sales_availability

Examples:
- "Is villa available?"
- "Can I book from 20 to 24?"

---

### 2. pre_sales_pricing

Examples:
- "What is the rate?"
- "Price for 5 guests?"

---

### 3. post_sales_checkin

Examples:
- "Check-in time?"
- "WiFi password?"

---

### 4. special_request

Examples:
- "Airport pickup?"
- "Early check-in?"

---

### 5. complaint

Examples:
- "AC not working"
- "No hot water"

---

### 6. general_enquiry

Examples:
- "Pets allowed?"
- "Parking available?"

---

# Recommended Classification Strategy

## Hybrid Classification

### Primary Layer

Use:
- Regex
- Keyword matching

Fast and deterministic.

---

### Secondary Layer

Fallback to Claude for ambiguous cases.

This demonstrates engineering maturity.

---

# AI Prompt Engineering

## Prompt Structure

The prompt must include:

### 1. System Role

Example:

```txt
You are an AI hospitality assistant for luxury villas.
```

---

### 2. Property Context

Inject:
- Property details
- Pricing
- Rules
- Amenities
- Availability

---

### 3. Guest Message

Provide:
- Query type
- Guest name
- Raw message

---

### 4. Tone Instructions

Requirements:
- Professional
- Warm
- Concise
- Helpful
- Luxury hospitality tone

---

### 5. Safety Instructions

Avoid:
- Promising unavailable services
- Refund commitments
- Financial guarantees

Escalate complaints.

---

# Claude Integration Requirements

## AI Service Responsibilities

### Handle:
- API failures
- Timeout handling
- Retries
- Rate limits
- Invalid responses

---

## Retry Strategy

Use:
- Exponential backoff

Retry:
- 3 times maximum

---

# Confidence Scoring Design

## Suggested Logic

### High Confidence (0.85–1.0)

- Clear intent
- Deterministic answers
- FAQ-type queries

Examples:
- WiFi password
- Check-in timing

---

### Medium Confidence (0.60–0.85)

- Pricing calculations
- Availability discussions
- Slight ambiguity

---

### Low Confidence (<0.60)

- Complaints
- Refund requests
- Angry tone
- Ambiguous messages

---

# PostgreSQL Database Architecture

# Required Tables

## guests

Purpose:
Unified guest identity.

Fields:

```sql
id UUID PRIMARY KEY
full_name
phone
email
created_at
updated_at
```

---

## reservations

Purpose:
Booking linkage.

Fields:

```sql
id UUID PRIMARY KEY
booking_ref UNIQUE
property_id
check_in
check_out
guest_id
status
```

---

## conversations

Purpose:
Conversation grouping.

Fields:

```sql
id UUID PRIMARY KEY
guest_id
reservation_id
source
created_at
```

---

## messages

Purpose:
Unified messaging table.

Fields:

```sql
id UUID PRIMARY KEY
conversation_id
source
message_type
message_text
query_type
confidence_score
ai_generated
agent_edited
auto_sent
created_at
```

---

## ai_logs

Purpose:
Track AI interactions.

Fields:

```sql
id UUID PRIMARY KEY
message_id
prompt_tokens
response_tokens
model
latency_ms
created_at
```

---

# Important Database Design Principles

## Use UUIDs

Reason:
- Distributed-safe
- Better APIs
- Avoid predictable IDs

---

## Use Foreign Keys

Maintain:
- Referential integrity

---

## Add Indexes

Index:
- booking_ref
- guest_id
- created_at
- source

---

## Store AI Metadata

This demonstrates production thinking.

---

# Error Handling Requirements

## Must Handle

### 1. Invalid Payloads

Return 400.

---

### 2. Claude API Failures

Return graceful fallback.

---

### 3. Database Errors

Return 500 with structured logs.

---

### 4. Timeout Errors

Prevent hanging requests.

---

# Logging Requirements

Log:
- Incoming requests
- AI latency
- Errors
- Classification results
- Confidence score
- Action decisions

Never log:
- API keys

---

# Security Requirements

## Mandatory

### Use .env

Example:

```env
PORT=3000
DATABASE_URL=
ANTHROPIC_API_KEY=
```

---

### Enable Helmet

Security middleware:

```ts
app.use(helmet())
```

---

### Enable Rate Limiting

Prevent abuse.

Library:
- express-rate-limit

---

### Validate All Inputs

Never trust inbound payloads.

---

# README Requirements

Must include:

## 1. Setup Instructions

```bash
npm install
npm run dev
```

---

## 2. Environment Variables

Explain:
- DATABASE_URL
- ANTHROPIC_API_KEY

---

## 3. API Documentation

Example request/response.

---

## 4. Confidence Scoring Logic

Explain thresholds clearly.

---

## 5. Architecture Decisions

Explain:
- Why TypeScript
- Why Prisma
- Why hybrid classification

---

# thinking.md Expectations

The evaluator wants:
- Systems thinking
- Operational awareness
- Escalation workflows
- Reliability mindset

Your answers should include:
- Incident handling
- Escalation chains
- SLA concepts
- Monitoring
- Pattern detection
- Preventive automation

---

# Advanced Features That Will Impress

## 1. AI Fallback Templates

If Claude fails:
- Use canned responses

---

## 2. Conversation Memory

Track previous guest messages.

---

## 3. Sentiment Detection

Complaints escalate automatically.

---

## 4. Queue Architecture

Mention future scalability using:
- RabbitMQ
- Kafka
- BullMQ

---

## 5. Monitoring

Mention:
- Grafana
- Prometheus
- Sentry

---

# What Evaluators Actually Want

They are evaluating:

## Engineering Thinking

Can you structure systems cleanly?

---

## Production Readiness

Do you think beyond happy paths?

---

## Communication

Can another developer understand your code?

---

## Decision Making

Can you justify architecture choices?

---

# Recommended Final Stack

## Best Combination

### Backend
- Node.js
- Express
- TypeScript

### Database
- PostgreSQL
- Prisma

### AI
- Claude Sonnet 4

### Validation
- Zod

### Logging
- Pino

### Docs
- Swagger

### Security
- Helmet
- Rate limiting

---

# Key Implementation Strategy

## Do NOT overbuild.

Focus on:
- Clean structure
- Strong architecture
- Clear logic
- Good README
- Error handling
- Thoughtful decisions

A clean, maintainable system with moderate features is significantly stronger than a rushed complex system.

