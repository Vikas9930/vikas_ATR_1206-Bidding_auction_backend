# Swagger API Documentation - LiveBid

## 🎯 Overview

Complete Swagger/OpenAPI documentation for the LiveBid auction platform API. This documentation is automatically generated and provides interactive testing capabilities.

## 📍 Access Swagger UI

**URL:** `http://localhost:3000/api/docs`

**OpenAPI JSON:** `http://localhost:3000/api/docs-json`

**OpenAPI YAML:** `http://localhost:3000/api/docs-yaml`

---

## 🔐 Authentication Setup

### Step 1: Get JWT Token
1. Use `POST /auth/login` or `POST /auth/register` to get a token
2. Copy the `access_token` from the response

### Step 2: Authorize in Swagger
1. Click the **"Authorize"** button (🔒 lock icon) at the top right
2. In the "Value" field, enter: `Bearer <your_token>`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"**
4. Click **"Close"**

Now all protected endpoints will include the token automatically!

---

## 📚 API Endpoints Documentation

### 🔑 Authentication Endpoints

#### 1. Register User
- **Endpoint:** `POST /auth/register`
- **Auth:** Not required
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }
  ```
- **Response:** Returns JWT token and user info

#### 2. Login User
- **Endpoint:** `POST /auth/login`
- **Auth:** Not required
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** Returns JWT token and user info

---

### 👤 User Endpoints (Protected)

#### 3. Get User Profile
- **Endpoint:** `GET /users/me`
- **Auth:** ✅ Required (Bearer Token)
- **Response:** User profile with balance and account info

#### 4. Get User Statistics
- **Endpoint:** `GET /users/statistics`
- **Auth:** ✅ Required
- **Response:**
  ```json
  {
    "statistics": {
      "balance": 1000.00,
      "auctionsWon": 5,
      "auctionsCreated": 12
    }
  }
  ```

#### 5. Get Won Auctions
- **Endpoint:** `GET /users/won-auctions`
- **Auth:** ✅ Required
- **Response:** List of auctions user has won

#### 6. Get Win History (Paginated)
- **Endpoint:** `GET /users/win-history?page=1&limit=20`
- **Auth:** ✅ Required
- **Query Parameters:**
  - `page` (optional): Page number
  - `limit` (optional): Items per page
- **Response:** Paginated win history

---

### 🎯 Auction Endpoints

#### 7. Get All Auctions
- **Endpoint:** `GET /auctions?page=1&limit=10&status=active`
- **Auth:** Not required
- **Query Parameters:**
  - `page`: Page number
  - `limit`: Items per page
  - `status`: Filter by status (active, sold, expired, all)

#### 8. Get Dashboard Auctions
- **Endpoint:** `GET /auctions/dashboard?page=1&limit=20`
- **Auth:** Not required
- **Response:** Active auctions for dashboard

#### 9. Get Available Auctions
- **Endpoint:** `GET /auctions/available?page=1&limit=20`
- **Auth:** ✅ Required
- **Description:** Returns auctions user can bid on (excludes own auctions)
- **Response:** Includes time remaining and bid counts

#### 10. Get My Auctions
- **Endpoint:** `GET /auctions/my-auctions`
- **Auth:** ✅ Required
- **Response:** Auctions created by authenticated user

#### 11. Get Auction Details
- **Endpoint:** `GET /auctions/:id`
- **Auth:** Not required
- **Path Parameter:** `id` (UUID)
- **Response:** Complete auction details with bids

#### 12. Create Auction
- **Endpoint:** `POST /auctions`
- **Auth:** ✅ Required
- **Content-Type:** `multipart/form-data`
- **Body (Form Data):**
  - `title` (string): Auction title
  - `description` (string): Auction description
  - `startingPrice` (number): Starting price
  - `endsAt` (string): End date (ISO 8601)
  - `image` (file): Image file (jpg, jpeg, png, gif, webp, max 1MB)

#### 13. Place Bid
- **Endpoint:** `POST /auctions/:id/bid`
- **Auth:** ✅ Required
- **Path Parameter:** `id` (UUID)
- **Body:**
  ```json
  {
    "amount": 150.00
  }
  ```
- **Response:** Bid details and updated balance

---

## 🚨 Error Responses

All endpoints document error responses:

### 400 Bad Request
- Insufficient balance
- Bid too low
- Auction ended
- Auction not active
- Validation errors

### 401 Unauthorized
- Invalid or missing JWT token

### 403 Forbidden
- Cannot bid on own auction

### 404 Not Found
- Auction not found
- User not found

---

## 🧪 Testing in Swagger UI

### Example: Test Login Flow

1. **Expand** `POST /auth/login`
2. Click **"Try it out"**
3. Enter test credentials:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
4. Click **"Execute"**
5. Copy the `access_token` from response
6. Click **"Authorize"** button
7. Paste: `Bearer <access_token>`
8. Now test protected endpoints!

### Example: Place a Bid

1. **Authorize** first (see above)
2. **Expand** `POST /auctions/:id/bid`
3. Click **"Try it out"**
4. Enter auction ID in path parameter
5. Enter bid amount:
   ```json
   {
     "amount": 150.00
   }
   ```
6. Click **"Execute"**
7. See response with bid details and updated balance

---

## 📋 Features

### ✅ Complete Documentation
- All endpoints documented
- Request/response examples
- Error responses with examples
- Query parameters explained

### ✅ Interactive Testing
- Test endpoints directly in browser
- No need for Postman/curl
- See real-time responses
- JWT authentication support

### ✅ Organized Structure
- Grouped by tags (Authentication, Users, Auctions)
- Alphabetically sorted
- Easy to navigate

### ✅ Request/Response Examples
- Example payloads for all endpoints
- Success response examples
- Error response examples
- Multiple error scenarios documented

---

## 🔧 Technical Details

### Swagger Configuration
- **Title:** LiveBid API
- **Version:** 1.0
- **Base Path:** `/api/v1`
- **Authentication:** Bearer JWT

### Tags
- **Authentication** - User registration and login
- **Users** - User profile and statistics
- **Auctions** - Auction management and bidding

### Security Scheme
- **Type:** HTTP Bearer
- **Scheme:** bearer
- **Bearer Format:** JWT

---

## 📖 For Frontend Developers

### Using Swagger Documentation

1. **Explore Endpoints:**
   - Browse all available endpoints
   - See request/response formats
   - Understand error handling

2. **Test API:**
   - Try endpoints with sample data
   - See actual responses
   - Understand data structures

3. **Copy Examples:**
   - Use example payloads in your code
   - Reference response structures
   - Understand error formats

4. **Generate Client Code:**
   - Export OpenAPI spec
   - Use code generators (if needed)
   - Import into frontend project

---

## 🎨 Swagger UI Features

- **Try it out** - Test endpoints directly
- **Authorize** - Add JWT token for protected endpoints
- **Schema** - View request/response schemas
- **Examples** - See example payloads
- **Responses** - View all possible responses
- **Download** - Export OpenAPI spec

---

## 📝 Notes

- Swagger UI is available at `/api/docs`
- OpenAPI JSON available at `/api/docs-json`
- All endpoints are documented with examples
- Error responses include detailed messages
- Authentication is clearly marked on protected endpoints

---

## 🚀 Quick Start

1. Start the server: `npm run start:dev`
2. Open browser: `http://localhost:3000/api/docs`
3. Test login endpoint to get token
4. Authorize with token
5. Explore and test all endpoints!

---

**Swagger documentation is live and ready to use!** 🎉

