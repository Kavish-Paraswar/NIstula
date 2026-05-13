# Sample Requests

Three commit-ready test inputs covering distinct query types and sources. Each request hits `POST http://localhost:3000/webhook/message`.

## Run via REST client

Open [`requests.http`](./requests.http) in VS Code (with the REST Client extension), JetBrains IDEs, or any HTTP client that understands the `.http` format, and click "Send Request" above each block.

## Run via curl

Start the server first:

```bash
npm install
npm run dev
```

Then in another terminal:

### 1. Pre-sales availability (WhatsApp)

```bash
curl -X POST http://localhost:3000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "source": "whatsapp",
    "guest_name": "Rahul Sharma",
    "message": "Is the villa available from April 20 to 24? What is the rate for 2 adults?",
    "timestamp": "2026-05-05T10:30:00Z",
    "booking_ref": "NIS-2024-0891",
    "property_id": "villa-b1"
  }'
```

Expected: `query_type = "pre_sales_availability"`, `action` typically `auto_send`.

### 2. Post-sales check-in (Airbnb)

```bash
curl -X POST http://localhost:3000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "source": "airbnb",
    "guest_name": "Aanya Verma",
    "message": "Hi, what time is check-in tomorrow and can you share the WiFi password?",
    "timestamp": "2026-05-12T18:05:00Z",
    "booking_ref": "NIS-2024-0917",
    "property_id": "villa-b1"
  }'
```

Expected: `query_type = "post_sales_checkin"`, `action = "auto_send"`.

### 3. Complaint at 3am (Instagram)

```bash
curl -X POST http://localhost:3000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "source": "instagram",
    "guest_name": "Priya Menon",
    "message": "There is no hot water and we have guests arriving for breakfast in 4 hours. This is unacceptable. I want a refund for tonight.",
    "timestamp": "2026-05-13T03:02:00Z",
    "booking_ref": "NIS-2024-0934",
    "property_id": "villa-b1"
  }'
```

Expected: `query_type = "complaint"`, `action = "escalate"` (the 0.55 hard-cap forces escalation regardless of other signals).

## Run via curl on Windows PowerShell

PowerShell parses single quotes differently — use a here-string:

```powershell
$body = @'
{
  "source": "whatsapp",
  "guest_name": "Rahul Sharma",
  "message": "Is the villa available from April 20 to 24? What is the rate for 2 adults?",
  "timestamp": "2026-05-05T10:30:00Z",
  "booking_ref": "NIS-2024-0891",
  "property_id": "villa-b1"
}
'@

Invoke-RestMethod -Uri http://localhost:3000/webhook/message -Method Post -ContentType 'application/json' -Body $body
```
