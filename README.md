 #### 💡 Set `BASE_URL` as a Postman environment variable pointing to `http://localhost:3000/api/v1`

### POST `/api/auth/register`

**Postman Setup:**

- Method: `POST`
- URL: `{{BASE_URL}}/register`
- Headers:
  | Key          | Value            |
  | ------------ | ---------------- |
  | Content-Type | application/json |

- Body (raw → JSON):
```json
  {
    "email": "user@example.com",
    "password": "secret123"
  }
```

**Expected Response:**
```json
  {
    "success": true,
    "message": "OTP sent successfully"
  }
```
---

### POST `/api/auth/verify-otp`

Verifies the OTP sent to the user's email. On success, hashes the password,
creates the user in the database, and returns an access token with a refresh token cookie.

**Access:** Public

---

#### Request Body

| Field   | Type     | Required | Description                        |
|---------|----------|----------|------------------------------------|
| `email` | `string` | ✅ Yes   | Email used during registration     |
| `otp`   | `string` | ✅ Yes   | 6-digit OTP received in email      |

---

#### Responses

| Status | Description                                      |
|--------|--------------------------------------------------|
| `201`  | User registered successfully, tokens returned    |
| `400`  | Email or OTP missing                             |
| `400`  | OTP expired or invalid (Redis key not found)     |
| `400`  | Incorrect OTP                                    |
| `409`  | User already exists                              |
| `500`  | Internal server error                            |

---

#### Postman Setup

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/auth/verify-otp`
- **Headers:**

  | Key            | Value            |
  |----------------|------------------|
  | Content-Type   | application/json |

- **Body** (raw → JSON):

```json
  {
    "email": "user@example.com",
    "otp": "482910"
  }
```


> 💡 The refresh token is set automatically as an **HttpOnly cookie** — 
> Postman handles it automatically if cookie saving is enabled.

---

#### Notes

> ⚠️ **OTP expires in 5 minutes** — call this endpoint before expiry

> 🔐 **Access token** expires in `15 minutes` — use the refresh token endpoint to rotate it

> 🍪 **Refresh token** is stored as an HttpOnly cookie (valid for 30 days)
> and also saved in the database for rotation/revocation support

> 🔒 **Security:** Password is hashed with `bcrypt` (salt rounds: 10) before
> being saved to the database. The temporary Redis key is deleted immediately
> after successful verification.