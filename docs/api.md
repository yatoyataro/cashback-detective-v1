# API Reference

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

Most endpoints are public. Admin endpoints require JWT authentication:

```
Authorization: Bearer <token>
```

## Endpoints

### Health Check

**GET** `/health`

Returns service status.

**Response:**
```json
{
  "status": "ok",
  "service": "Cashback Detective"
}
```

---

### List Transactions

**GET** `/transactions`

Returns paginated list of all transactions.

**Response:**
```json
{
  "count": 4,
  "transactions": [
    {
      "id": "TX-1001",
      "user_id": "USER-1",
      "merchant_name": "Amazon",
      "amount": "150.00",
      "cashback_amount": "7.50",
      "days_since_purchase": 5,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Create Transaction

**POST** `/transactions`

Creates a new transaction and returns investigation result.

**Request Body:**
```json
{
  "userId": "USER-1",
  "merchant": "Amazon",
  "amount": 150.00,
  "cashbackAmount": 7.50,
  "daysSincePurchase": 5,
  "status": "pending"
}
```

**Validation Rules:**
- `userId`: Format `USER-N` (e.g., `USER-1`)
- `merchant`: Must exist in merchant_policies
- `amount`: Positive number
- `cashbackAmount`: Non-negative number
- `daysSincePurchase`: Integer 0-36500
- `status`: One of `pending`, `canceled`, `returned`, `credited`

**Success Response (201):**
```json
{
  "message": "Demo transaction created successfully.",
  "transaction": { ... },
  "investigation": {
    "transactionId": "TX-1005",
    "status": "pending",
    "decision": "investigation_eligible",
    "message": "Transaction TX-1005 is eligible for investigation.",
    "nextAction": "Wait for the investigation period to complete.",
    "evidence": {
      "purchaseAmount": 150.00,
      "expectedCashback": 7.50,
      "daysSincePurchase": 5,
      "investigationAfterDays": 14
    }
  }
}
```

**Error Responses:**
- `400`: Invalid transaction data or no policy for merchant
- `500`: Server error

---

### Investigate Transaction

**GET** `/investigate/:transactionId`

Investigates a specific transaction by ID.

**Path Parameters:**
- `transactionId`: Format `TX-NNNN` (e.g., `TX-1001`)

**Response (200):**
```json
{
  "transactionId": "TX-1001",
  "status": "pending",
  "decision": "investigation_eligible",
  "message": "Transaction TX-1001 is eligible for investigation.",
  "nextAction": "Wait for the investigation period to complete.",
  "evidence": {
    "purchaseAmount": 150.00,
    "expectedCashback": 7.50,
    "daysSincePurchase": 5,
    "investigationAfterDays": 14
  }
}
```

**Error Responses:**
- `400`: Invalid transaction ID format
- `404`: Transaction not found
- `500`: Server error

---

### Ask Question

**POST** `/ask`

General Q&A endpoint. Detects transaction IDs in questions and automatically investigates.

**Request Body:**
```json
{
  "question": "What about TX-1001?"
}
```

**Validation:**
- `question`: String, 1-1000 characters

**Response with Transaction ID (200):**
```json
{
  "answer": "Transaction TX-1001 is eligible for investigation.\n\nDecision: investigation_eligible.\nNext action: Wait for the investigation period to complete.",
  "investigation": { ... },
  "answerSource": "rules_engine"
}
```

**Response without Transaction ID (200):**
```json
{
  "answer": "Cashback Detective is a demo assistant that checks fictional cashback transactions...",
  "investigation": null,
  "answerSource": "predefined"
}
```

**Error Responses:**
- `400`: Question missing or too long
- `404`: Transaction mentioned but not found
- `500`: Server error

---

### Admin Routes

**GET** `/admin/*`

Requires valid JWT with `admin` role.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "message": "Admin access granted",
  "user": {
    "userId": "admin-1",
    "role": "admin"
  }
}
```

**Error Responses:**
- `401`: Missing or invalid token
- `403`: Valid token but not admin role

---

## Decision Types

| Decision | Description |
|----------|-------------|
| `investigation_eligible` | Transaction meets criteria for investigation |
| `investigation_not_required` | Transaction within normal period, no investigation needed |
| `cashback_credited` | Cashback already credited |
| `transaction_canceled` | Transaction was canceled |
| `transaction_returned` | Transaction was returned |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| All endpoints | 100 requests | 15 minutes |
| `/investigate` | 10 requests | 1 minute |
| `/transactions` | 10 requests | 1 minute |

Exceeding limits returns `429 Too Many Requests`.

## Error Format

All errors follow this format:
```json
{
  "error": "Human-readable error message"
}
```

Validation errors include details:
```json
{
  "error": "Invalid transaction data.",
  "details": [
    { "field": "amount", "message": "Amount must be positive" }
  ]
}
```

## Transaction ID Format

All transaction IDs must match regex: `^TX-\d{4}$`

Examples: `TX-1001`, `TX-9999`

## Merchant Policies

Default merchants and investigation periods:

| Merchant | Investigation After (days) |
|----------|---------------------------|
| Amazon | 14 |
| eBay | 21 |
| Walmart | 14 |
| Target | 14 |
| Best Buy | 30 |

Add custom merchants via direct database insertion.