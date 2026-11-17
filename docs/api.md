# API Reference

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication

Most endpoints are public. Admin endpoints require JWT Bearer token with `role: "admin"`.

```http
Authorization: Bearer <jwt-token>
```

For SPA, JWT is also read from `auth_token` httpOnly cookie.

## Endpoints

### Health Check

```http
GET /health
```

**Response (200)**
```json
{
  "status": "ok",
  "service": "Cashback Detective"
}
```

---

### Investigate Transaction

```http
GET /investigate/:transactionId
```

**Path Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| transactionId | string | Yes | Transaction ID in format `TX-NNNN` |

**Response (200)**
```json
{
  "transactionId": "TX-1002",
  "status": "pending",
  "decision": "investigation_eligible",
  "message": "The transaction has been pending for 20 days, which meets the demo threshold of 14 days.",
  "nextAction": "Prepare a missing-cashback investigation for review.",
  "evidence": {
    "purchaseAmount": 200,
    "expectedCashback": 10,
    "daysSincePurchase": 20,
    "investigationAfterDays": 14
  }
}
```

**Error Responses**
- `400`: Invalid transaction ID format
- `404`: Transaction not found
- `500`: Server error

---

### Ask Question

```http
POST /ask
Content-Type: application/json
```

**Request Body**
```json
{
  "question": "Investigate cashback for TX-1001."
}
```

**Response (200) - Transaction Found**
```json
{
  "answer": "The transaction is 5 days old. The demo investigation threshold is 14 days.\n\nDecision: still_pending.\n\nNext action: Wait until the investigation threshold is reached, then check again.",
  "investigation": {
    "transactionId": "TX-1001",
    "status": "pending",
    "decision": "still_pending",
    "message": "The transaction is 5 days old. The demo investigation threshold is 14 days.",
    "nextAction": "Wait until the investigation threshold is reached, then check again.",
    "evidence": {
      "purchaseAmount": 150,
      "expectedCashback": 7.5,
      "daysSincePurchase": 5,
      "investigationAfterDays": 14
    }
  },
  "answerSource": "rules_engine"
}
```

**Response (200) - General Question**
```json
{
  "answer": "Cashback Detective is a demo assistant that checks fictional cashback transactions. Provide a transaction ID, such as TX-1001, and I'll check its status, apply the demo policy, and explain the next recommended action. I can't verify real ShopBack accounts or official ShopBack policies.",
  "investigation": null,
  "answerSource": "predefined"
}
```

**Error Responses**
- `400`: Empty question or invalid format
- `404`: Transaction mentioned but not found
- `500`: Server error

---

### List Transactions

```http
GET /transactions
```

**Response (200)**
```json
{
  "count": 4,
  "transactions": [
    {
      "id": "TX-1001",
      "merchant": "Amazon",
      "amount": 150,
      "cashbackAmount": 7.5,
      "daysSincePurchase": 5,
      "status": "pending",
      "userId": "USER-1"
    }
  ]
}
```

---

### Create Transaction

```http
POST /transactions
Content-Type: application/json
```

**Request Body**
```json
{
  "userId": "USER-1",
  "merchant": "Amazon",
  "amount": 15000,
  "cashbackAmount": 750,
  "daysSincePurchase": 20,
  "status": "pending"
}
```

**Validation Rules**
| Field | Type | Rules |
|-------|------|-------|
| userId | string | Format: `USER-\d+` |
| merchant | string | 1-100 chars, must exist in merchant_policies |
| amount | number | Positive, finite |
| cashbackAmount | number | Non-negative, finite |
| daysSincePurchase | integer | 0-36500 |
| status | string | Enum: pending, canceled, returned, credited |

**Response (201)**
```json
{
  "message": "Demo transaction created successfully.",
  "transaction": {
    "id": "TX-1005",
    "userId": "USER-1",
    "merchant": "Amazon",
    "amount": 15000,
    "cashbackAmount": 750,
    "daysSincePurchase": 20,
    "status": "pending",
    "createdAt": "2026-11-17T12:00:00.000Z"
  },
  "investigation": {
    "transactionId": "TX-1005",
    "status": "pending",
    "decision": "investigation_eligible",
    "message": "The transaction has been pending for 20 days, which meets the demo threshold of 14 days.",
    "nextAction": "Prepare a missing-cashback investigation for review.",
    "evidence": { ... }
  }
}
```

**Error Responses**
- `400`: Validation error or unknown merchant
- `500`: Server error

---

### Admin Endpoint

```http
GET /admin
Authorization: Bearer <admin-jwt>
```

**Response (200)**
```json
{
  "message": "Admin access granted",
  "user": {
    "userId": "USER-1",
    "role": "admin"
  }
}
```

**Error Responses**
- `401`: Missing or invalid token
- `403`: Valid token but not admin role

---

## Decision Types

| Decision | Description |
|----------|-------------|
| `investigation_eligible` | Transaction meets threshold, ready for investigation |
| `still_pending` | Transaction too recent, wait for threshold |
| `ineligible` | Transaction canceled/returned |
| `already_credited` | Cashback already credited |
| `policy_unavailable` | No policy for merchant |

---

## CSRF Protection

All POST endpoints require CSRF token via:
- Header: `X-CSRF-Token: <token>`
- Cookie: `csrf_token=<token>` (auto-set on first GET request)

Token obtained from first GET request to `/health` or any GET endpoint.

---

## Rate Limiting

| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| General API | 15 min | 100 |
| `/investigate` | 1 min | 10 |
| `/transactions` | 1 min | 10 |
| Auth endpoints | 15 min | 10 |

Exceeded limits return `429 Too Many Requests`.

---

## Error Format

```json
{
  "error": "Human-readable error message",
  "details": [
    { "field": "field.name", "message": "Validation error" }
  ]
}
```