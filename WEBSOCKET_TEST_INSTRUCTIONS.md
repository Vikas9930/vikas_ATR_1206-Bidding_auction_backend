# WebSocket Testing - Complete Instructions

## Prerequisites
- Server must be running on `http://localhost:3000`
- You need a valid JWT token

---

## Step-by-Step Testing Guide

### Step 1: Navigate to Backend Directory

```bash
cd /data/Ai_backend/backend
```

**Important:** Make sure you're in the `backend` directory, not `frontend`!

### Step 2: Get Your JWT Token

#### Option A: Login (if user exists)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test2@yopmail.com", "password": "your_password"}'
```

#### Option B: Register New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**Copy the `access_token` from the response!**

Example response:
```json
{
  "message": "Login successful! Welcome back.",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "0754422a-1561-4da7-8091-f4c301666082",
    "email": "test2@yopmail.com",
    "balance": 100
  }
}
```

### Step 3: Test WebSocket Connection

#### Method 1: Using the Test Script (Recommended)

```bash
# Make sure you're in /data/Ai_backend/backend
cd /data/Ai_backend/backend

# Run the test script with your token
node test-websocket.js YOUR_TOKEN_HERE
```

**Example:**
```bash
node test-websocket.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNzU0NDIyYS0xNTYxLTRkYTctODA5MS1mNGMzMDE2NjYwODIiLCJlbWFpbCI6InRlc3QyQHlvcG1haWwuY29tIiwiaWF0IjoxNzcwNjQ3MTMxLCJleHAiOjE3NzEyNTE5MzF9.Aiw3MI5CsluSXFOaH_SpoUWbmkFIvcdJcEyNDoFSUCU
```

**What you should see:**
```
🔌 Connecting to WebSocket server: http://localhost:3000
🔑 Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ Connected to WebSocket server
   Socket ID: abc123...

📥 Listening for events...

💰 Balance Updated:
   Balance: $100
   Time: 2/9/2024, 7:30:00 PM
```

#### Method 2: Using Quick Test Script

```bash
cd /data/Ai_backend/backend
./quick-test-socket.sh
```

This script will:
- Check if server is running
- Login automatically
- Test WebSocket connection
- Show all events

### Step 4: Test with Auction (Optional)

To see bid events, you need to:

1. **Create an auction** (in another terminal):
```bash
cd /data/Ai_backend/backend

curl -X POST http://localhost:3000/api/v1/auctions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Auction" \
  -F "description=Test description" \
  -F "startingPrice=100" \
  -F "endsAt=2024-12-31T23:59:59Z" \
  -F "image=@/path/to/image.jpg"
```

**Copy the `auction.id` from response**

2. **Join the auction room** in WebSocket:
```bash
# Run test script with auction ID
node test-websocket.js YOUR_TOKEN auction-id-here
```

3. **Place a bid** (in another terminal):
```bash
curl -X POST http://localhost:3000/api/v1/auctions/AUCTION_ID/bids \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 150.00}'
```

4. **Watch WebSocket terminal** - You should see:
```
💰 Balance Updated:
   Balance: $50
   Time: 2/9/2024, 7:35:00 PM

🎯 New Bid Placed:
   Auction ID: auction-id-here
   Amount: $150
   Bidder: test2
   Bidder ID: 0754422a-1561-4da7-8091-f4c301666082
   Current Price: $150
   Time: 2/9/2024, 7:35:00 PM

📈 Auction Price Updated:
   Auction ID: auction-id-here
   Current Price: $150
```

---

## Complete Example Workflow

### Terminal 1: WebSocket Connection
```bash
cd /data/Ai_backend/backend

# Get token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@yopmail.com","password":"your_password"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Test WebSocket
node test-websocket.js $TOKEN
```

### Terminal 2: Place Bids
```bash
cd /data/Ai_backend/backend

# Place bid
curl -X POST http://localhost:3000/api/v1/auctions/AUCTION_ID/bids \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 200.00}'
```

**Watch Terminal 1 for real-time updates!**

---

## Troubleshooting

### Error: Cannot find module
**Problem:** You're in the wrong directory
**Solution:**
```bash
cd /data/Ai_backend/backend
pwd  # Should show: /data/Ai_backend/backend
```

### Error: Connection refused
**Problem:** Server is not running
**Solution:**
```bash
# Check if server is running
ps aux | grep nest

# Start server if not running
cd /data/Ai_backend/backend
npm run start
```

### Error: Invalid token
**Problem:** Token expired or invalid
**Solution:** Get a fresh token by logging in again

### No events received
**Problem:** Not joined to auction room
**Solution:** Pass auction ID as second argument:
```bash
node test-websocket.js YOUR_TOKEN auction-id-here
```

---

## WebSocket Events Reference

| Event | Description | When |
|-------|-------------|------|
| `BALANCE_UPDATED` | Your balance changed | On connect, after bid, after refund |
| `NEW_BID` | New bid placed | When someone bids on auction you're watching |
| `AUCTION_PRICE_UPDATED` | Auction price changed | When any auction price updates |
| `VIEWER_COUNT` | Number of viewers | When viewers join/leave |
| `AUCTION_ENDING_SOON` | Auction ending soon | Within 60 seconds of end |
| `AUCTION_SOLD` | Auction sold | When auction ends with winner |
| `AUCTION_EXPIRED` | Auction expired | When auction ends with no bids |

---

## Quick Commands Cheat Sheet

```bash
# 1. Navigate to backend
cd /data/Ai_backend/backend

# 2. Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@yopmail.com","password":"your_password"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 3. Test WebSocket
node test-websocket.js $TOKEN

# 4. Test with auction
node test-websocket.js $TOKEN auction-id-here

# 5. Quick test (all-in-one)
./quick-test-socket.sh
```

---

## Expected Output

When everything works correctly, you should see:

```
🔌 Connecting to WebSocket server: http://localhost:3000
🔑 Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ Connected to WebSocket server
   Socket ID: abc123xyz

📥 Listening for events...

💰 Balance Updated:
   Balance: $100
   Time: 2/9/2024, 7:30:00 PM

Press Ctrl+C to exit
```

When a bid is placed:
```
🎯 New Bid Placed:
   Auction ID: auction-123
   Amount: $150
   Bidder: test2
   Bidder ID: user-456
   Current Price: $150
   Time: 2/9/2024, 7:35:00 PM

💰 Balance Updated:
   Balance: $50
   Time: 2/9/2024, 7:35:00 PM
```

