 #### 💡 Set `BASE_URL` as a Postman environment variable pointing to `http://localhost:3000/api/v1`

### POST `/api/v1/auth/register`

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

### POST `/api/v1/auth/verify-otp`

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
- **URL:** `{{BASE_URL}}/verify-otp`
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
>
> ### POST `/api/v1/auth/login`

Authenticates a user using email and password. On success, generates an
access token, creates a refresh token, stores it in the database,
and sends the refresh token as an HttpOnly cookie.

**Access:** Public

---

#### Request Body

| Field      | Type     | Required | Description                  |
|------------|----------|----------|------------------------------|
| `email`    | `string` | ✅ Yes   | Registered user email        |
| `password` | `string` | ✅ Yes   | User account password        |

---

#### Responses

| Status | Description                                   |
|--------|-----------------------------------------------|
| `200`  | Login successful, tokens returned             |
| `400`  | Email or password missing                     |
| `401`  | Invalid credentials                           |
| `500`  | Internal server error                         |

---

#### Postman Setup

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/login`
- **Headers:**

  | Key            | Value            |
  |----------------|------------------|
  | Content-Type   | application/json |

- **Body** (raw → JSON):

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

---

#### Successful Response Example

```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt_access_token",
  "user": {
    "id": "6653c9d8b2b6a1f9c0e12345",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

#### Notes

> 🔐 **Access token** expires in `15 minutes`

> 🍪 **Refresh token** is automatically stored as an **HttpOnly cookie**
> with a validity of `30 days`

> 🔒 **Password verification** is handled using `bcrypt.compare()`

> 🛡️ **Security:** Refresh tokens are stored in the database to support
> token rotation, logout handling, and token revocation

> 📅 The user's `lastLogin` field is updated after every successful login

> ⚠️ Cookie configuration uses:
>
> - `httpOnly: true`
> - `secure: isProduction`
> - `sameSite: "none"`
>
> which is required for secure cross-origin authentication in production
>

### GET `/api/v1/auth/logout`

Logs out the authenticated user by removing the refresh token
from the database and clearing the refresh token cookie.

**Access:** Private

---

#### Authentication

Requires a valid `refreshToken` cookie.

---

#### Request Body

> No request body required

---

#### Responses

| Status | Description                            |
|--------|----------------------------------------|
| `200`  | Logout successful                      |
| `400`  | Refresh token not found                |
| `500`  | Internal server error                  |

---

#### Postman Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/logout`
- **Headers:**

  | Key            | Value            |
  |----------------|------------------|
  | Content-Type   | application/json |

> 💡 The refresh token is automatically sent through cookies
> if Postman cookie support is enabled.

---

#### Successful Response Example

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

#### Notes

> 🍪 The refresh token cookie is removed using `res.clearCookie()`

> 🗑️ The refresh token is also removed from the database
> to invalidate future token refresh attempts

> 🔐 Logout works even if the token already became invalid,
> as long as the cookie exists

> ⚠️ Cookie clearing configuration must match the original
> cookie settings (`httpOnly`, `secure`, `sameSite`)

---

---

### GET `/api/v1/auth/refresh-token`

Generates a new access token using a valid refresh token
stored in the HttpOnly cookie.

**Access:** Private

---

#### Authentication

Requires a valid `refreshToken` cookie.

---

#### Request Body

> No request body required

---

#### Responses

| Status | Description                            |
|--------|----------------------------------------|
| `200`  | New access token generated             |
| `401`  | Refresh token missing                  |
| `401`  | Invalid refresh token                  |
| `500`  | Internal server error                  |

---

#### Postman Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/v1/auth/refresh-token`
- **Headers:**

  | Key            | Value            |
  |----------------|------------------|
  | Content-Type   | application/json |

> 💡 The refresh token cookie is automatically included
> if cookie persistence is enabled in Postman.

---

#### Successful Response Example

```json
{
  "success": true,
  "accessToken": "new_jwt_access_token"
}
```

---

#### Notes

> 🔐 Access token expires in `15 minutes`

> 🍪 Refresh token is stored as an HttpOnly cookie
> and validated against the database

> 🛡️ Tokens are verified by checking whether the refresh token
> exists inside the user's `refreshTokens` array

> ⚠️ If the refresh token is removed from the database,
> the user must log in again

> 🔄 This endpoint is used to maintain authentication
> without forcing users to repeatedly log in