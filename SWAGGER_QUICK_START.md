# Swagger Quick Start Guide

## 🚀 Access Swagger UI

```
http://localhost:3000/api/docs
```

## 📋 Quick Steps

### 1. Start Server
```bash
npm run start:dev
```

### 2. Open Swagger UI
Navigate to: `http://localhost:3000/api/docs`

### 3. Get Authentication Token

**Option A: Register New User**
1. Expand `POST /auth/register`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "email": "newuser@example.com",
     "password": "password123",
     "confirmPassword": "password123"
   }
   ```
4. Click "Execute"
5. Copy `access_token` from response

**Option B: Login**
1. Expand `POST /auth/login`
2. Click "Try it out"
3. Enter credentials
4. Copy `access_token` from response

### 4. Authorize
1. Click **"Authorize"** button (🔒) at top right
2. Paste: `Bearer <your_token>`
3. Click "Authorize"
4. Click "Close"

### 5. Test Protected Endpoints
Now you can test any protected endpoint!

---

## 🎯 Common Use Cases

### Get User Statistics
1. Expand `GET /users/statistics`
2. Click "Try it out"
3. Click "Execute"
4. See your balance, wins, and created auctions

### Get Available Auctions
1. Expand `GET /auctions/available`
2. Click "Try it out"
3. Optionally set page/limit
4. Click "Execute"
5. See auctions you can bid on

### Place a Bid
1. Expand `POST /auctions/:id/bid`
2. Click "Try it out"
3. Enter auction ID
4. Enter bid amount:
   ```json
   {
     "amount": 150.00
   }
   ```
5. Click "Execute"
6. See bid result and updated balance

### Create Auction
1. Expand `POST /auctions`
2. Click "Try it out"
3. Fill form data:
   - title: "My Auction"
   - description: "Description here"
   - startingPrice: 100
   - endsAt: "2024-01-20T12:00:00.000Z"
   - image: [Select file]
4. Click "Execute"

---

## 📚 Documentation Files

- **SWAGGER_SETUP.md** - Setup instructions
- **SWAGGER_API_DOCUMENTATION.md** - Complete API reference
- **API_DOCUMENTATION.md** - Detailed endpoint documentation
- **FRONTEND_INTEGRATION_GUIDE.md** - Frontend integration guide

---

## ✅ All Set!

Swagger is configured and ready to use. Share the Swagger UI URL with your frontend developer for easy API exploration and testing!

