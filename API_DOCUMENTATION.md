# LiveBid API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

All protected endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## User Endpoints

### 1. Get User Profile
**GET** `/users/me`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "User profile retrieved successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "balance": 1000.00,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 2. Get User Statistics
**GET** `/users/statistics`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "User statistics retrieved successfully",
  "statistics": {
    "balance": 1000.00,
    "auctionsWon": 5,
    "auctionsCreated": 12
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:** Display dashboard statistics (Balance, Auctions Won, Auctions Created)

---

### 3. Get Won Auctions
**GET** `/users/won-auctions`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "You have won 5 auction(s). Congratulations!",
  "wins": [
    {
      "id": "win-uuid",
      "auctionId": "auction-uuid",
      "finalPrice": 1500.00,
      "endedAt": "2024-01-15T12:00:00.000Z",
      "createdAt": "2024-01-15T12:00:01.000Z",
      "auction": {
        "id": "auction-uuid",
        "title": "Vintage Watch",
        "description": "Beautiful vintage watch",
        "startingPrice": 100.00,
        "currentPrice": 1500.00,
        "status": "sold",
        "endsAt": "2024-01-15T12:00:00.000Z",
        "createdAt": "2024-01-10T10:00:00.000Z",
        "creator": {
          "id": "uuid",
          "email": "creator@example.com"
        }
      }
    }
  ],
  "count": 5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:** Display "Won Auctions" tab in user profile

---

### 4. Get Win History (Paginated)
**GET** `/users/win-history?page=1&limit=20`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "message": "Found 10 win(s) in history",
  "wins": [
    {
      "id": "win-uuid",
      "auctionId": "auction-uuid",
      "finalPrice": 1500.00,
      "endedAt": "2024-01-15T12:00:00.000Z",
      "createdAt": "2024-01-15T12:00:01.000Z",
      "auction": {
        "id": "auction-uuid",
        "title": "Vintage Watch",
        "description": "...",
        "creator": {
          "id": "uuid",
          "email": "creator@example.com"
        }
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:** Display paginated win history for user profile/analytics

---

### 5. Get Won Auctions (Old Format - Deprecated)
**GET** `/users/won-auctions` (Returns new format with `wins` array)

**Note:** This endpoint now returns win history from `auction_wins` table with complete auction details.

**Old Response Format (for reference):**
```json
{
  "message": "You have won 5 auction(s). Congratulations!",
  "auctions": [
    {
      "id": "uuid",
      "title": "Vintage Watch",
      "description": "Beautiful vintage watch",
      "startingPrice": 100.00,
      "currentPrice": 150.00,
      "status": "sold",
      "endsAt": "2024-01-15T12:00:00.000Z",
      "imageUrl": "/uploads/auctions/image.jpg",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "creator": {
        "id": "uuid",
        "email": "creator@example.com"
      },
      "bids": [...]
    }
  ],
  "count": 5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:** Display "Won Auctions" tab in user profile

---

## Auction Endpoints

### 4. Get Available Auctions (For Bidding)
**GET** `/auctions/available?page=1&limit=20`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "message": "Found 10 auction(s) available for bidding. These are auctions you can place bids on.",
  "items": [
    {
      "id": "uuid",
      "title": "Vintage Watch",
      "description": "Beautiful vintage watch",
      "startingPrice": 100.00,
      "currentPrice": 150.00,
      "status": "active",
      "endsAt": "2024-01-20T12:00:00.000Z",
      "imageUrl": "/uploads/auctions/image.jpg",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "bidCount": 5,
      "timeRemaining": {
        "milliseconds": 432000000,
        "hours": 120,
        "minutes": 0,
        "formatted": "120h 0m"
      },
      "creator": {
        "id": "uuid",
        "email": "creator@example.com"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasMore": false,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Note:** This endpoint excludes auctions created by the current user (they can't bid on their own auctions)

**Use Case:** Show list of auctions user can bid on

---

### 5. Get Dashboard Auctions
**GET** `/auctions/dashboard?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "message": "Found 10 active auction(s) on dashboard",
  "items": [
    {
      "id": "uuid",
      "title": "Vintage Watch",
      "description": "Beautiful vintage watch",
      "startingPrice": 100.00,
      "currentPrice": 150.00,
      "status": "active",
      "endsAt": "2024-01-20T12:00:00.000Z",
      "imageUrl": "/uploads/auctions/image.jpg",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "bidCount": 5,
      "creator": {
        "id": "uuid",
        "email": "creator@example.com"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasMore": false,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:** Display active auctions on dashboard/homepage

---

### 6. Get My Auctions (Created by User)
**GET** `/auctions/my-auctions`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "You have created 12 auction(s)",
  "auctions": [
    {
      "id": "uuid",
      "title": "My Auction",
      "description": "Description",
      "startingPrice": 50.00,
      "currentPrice": 75.00,
      "status": "active",
      "endsAt": "2024-01-20T12:00:00.000Z",
      "imageUrl": "/uploads/auctions/image.jpg",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "bids": [
        {
          "id": "uuid",
          "amount": 75.00,
          "createdAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "winner": {
        "id": "uuid",
        "email": "winner@example.com"
      }
    }
  ],
  "count": 12,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:** Display "My Auctions" tab in user profile/dashboard

---

### 7. Get All Auctions
**GET** `/auctions?page=1&limit=10&status=active`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`active`, `sold`, `expired`, `all`)

**Response:**
```json
{
  "message": "Found 25 auction(s)",
  "items": [...],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "hasMore": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 8. Get Single Auction Details
**GET** `/auctions/:id`

**Response:**
```json
{
  "message": "Auction details retrieved successfully",
  "auction": {
    "id": "uuid",
    "title": "Vintage Watch",
    "description": "Beautiful vintage watch",
    "startingPrice": 100.00,
    "currentPrice": 150.00,
    "status": "active",
    "endsAt": "2024-01-20T12:00:00.000Z",
    "imageUrl": "/uploads/auctions/image.jpg",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "creator": {
      "id": "uuid",
      "email": "creator@example.com"
    },
    "winner": null,
    "bids": [
      {
        "id": "uuid",
        "amount": 150.00,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "bidder": {
          "id": "uuid",
          "email": "bidder@example.com"
        }
      }
    ]
  }
}
```

---

### 9. Create Auction
**POST** `/auctions`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body (Form Data):**
- `title` (string, required)
- `description` (string, required)
- `startingPrice` (number, required)
- `endsAt` (ISO date string, required)
- `image` (file, required) OR `imageUrl` (string, optional)

**Response:**
```json
{
  "message": "Auction created successfully! Your item is now live.",
  "auction": {
    "id": "uuid",
    "title": "Vintage Watch",
    "description": "Beautiful vintage watch",
    "startingPrice": 100.00,
    "currentPrice": 100.00,
    "status": "active",
    "endsAt": "2024-01-20T12:00:00.000Z",
    "imageUrl": "/uploads/auctions/image.jpg",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 10. Place Bid
**POST** `/auctions/:id/bid`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "amount": 150.00
}
```

**Response:**
```json
{
  "message": "Congratulations! Your bid of $150.00 is now the highest bid on \"Vintage Watch\". Your balance has been updated.",
  "bid": {
    "id": "uuid",
    "amount": 150.00,
    "auctionItemId": "uuid",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "auction": {
    "id": "uuid",
    "title": "Vintage Watch",
    "currentPrice": 150.00,
    "endsAt": "2024-01-20T12:00:00.000Z"
  },
  "bidderBalance": 850.00,
  "isHighestBid": true,
  "previousHighestBid": {
    "amount": 120.00,
    "bidderId": "uuid"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

**Insufficient Balance:**
```json
{
  "statusCode": 400,
  "message": "Insufficient balance. Your current balance is $50.00, but you need $150.00 to place this bid."
}
```

**Bid Too Low:**
```json
{
  "statusCode": 400,
  "message": "Your bid of $100.00 must be higher than the current price of $120.00. Please increase your bid amount."
}
```

**Cannot Bid on Own Auction:**
```json
{
  "statusCode": 403,
  "message": "You cannot bid on your own auction. Please bid on auctions created by other users."
}
```

---

## WebSocket Events

### Connection

Connect to WebSocket server:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### Join Auction Room

To receive updates for a specific auction:
```javascript
socket.emit('join_auction', { auctionId: 'auction-uuid' });
```

### Leave Auction Room

```javascript
socket.emit('leave_auction', { auctionId: 'auction-uuid' });
```

---

## WebSocket Events List

### 1. BALANCE_UPDATED
Emitted when user's balance changes (after placing bid, receiving refund, etc.)

**Event:** `BALANCE_UPDATED`

**Payload:**
```json
{
  "balance": 850.00,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:** Update balance display in real-time

---

### 2. NEW_BID
Emitted when a new bid is placed on an auction (only to users watching that auction)

**Event:** `NEW_BID`

**Payload:**
```json
{
  "auctionId": "uuid",
  "amount": 150.00,
  "bidderName": "john",
  "bidderId": "uuid",
  "currentPrice": 150.00,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:** Update auction page with new bid in real-time

---

### 3. AUCTION_PRICE_UPDATED
Emitted when auction price changes (broadcast to all connected clients)

**Event:** `AUCTION_PRICE_UPDATED`

**Payload:**
```json
{
  "auctionId": "uuid",
  "currentPrice": 150.00
}
```

**Use Case:** Update auction list prices in real-time

---

### 4. AUCTION_WON
Emitted to the winner when an auction ends (personal notification)

**Event:** `AUCTION_WON`

**Payload:**
```json
{
  "message": "Congratulations! You won the auction \"Vintage Watch\" for $150.00!",
  "auctionId": "uuid",
  "auctionTitle": "Vintage Watch",
  "finalPrice": 150.00,
  "winnerName": "john",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Use Case:** Show winner notification, update statistics, refresh won auctions list

---

### 5. AUCTION_SOLD
Emitted to all viewers when an auction ends and is sold

**Event:** `AUCTION_SOLD`

**Payload:**
```json
{
  "auctionId": "uuid",
  "winnerName": "john",
  "finalPrice": 150.00,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Use Case:** Update auction status, show auction ended message

---

### 6. AUCTION_EXPIRED
Emitted when an auction expires with no bids

**Event:** `AUCTION_EXPIRED`

**Payload:**
```json
{
  "auctionId": "uuid"
}
```

**Use Case:** Update auction status to expired

---

### 7. VIEWER_COUNT
Emitted when viewer count changes for an auction

**Event:** `VIEWER_COUNT`

**Payload:**
```json
{
  "auctionId": "uuid",
  "count": 5
}
```

**Use Case:** Display number of people watching the auction

---

### 8. AUCTION_ENDING_SOON
Emitted when auction is ending soon (within 5 minutes)

**Event:** `AUCTION_ENDING_SOON`

**Payload:**
```json
{
  "auctionId": "uuid",
  "secondsRemaining": 300
}
```

**Use Case:** Show countdown warning

---

## Frontend Integration Example

### React/TypeScript Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function useLiveBidSocket(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    // Balance updates
    newSocket.on('BALANCE_UPDATED', (data) => {
      setBalance(data.balance);
    });

    // New bid on auction
    newSocket.on('NEW_BID', (data) => {
      // Update auction page
      console.log('New bid:', data);
    });

    // Won auction notification
    newSocket.on('AUCTION_WON', (data) => {
      setNotifications(prev => [...prev, {
        type: 'success',
        message: data.message,
        timestamp: data.timestamp,
      }]);
      // Refresh statistics and won auctions list
    });

    // Auction sold
    newSocket.on('AUCTION_SOLD', (data) => {
      console.log('Auction sold:', data);
      // Update auction status
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const joinAuction = (auctionId: string) => {
    socket?.emit('join_auction', { auctionId });
  };

  const leaveAuction = (auctionId: string) => {
    socket?.emit('leave_auction', { auctionId });
  };

  return { socket, balance, notifications, joinAuction, leaveAuction };
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message description",
  "error": "Bad Request"
}
```

### Common Error Codes:
- `400` - Bad Request (validation errors, insufficient balance, etc.)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (cannot bid on own auction)
- `404` - Not Found (auction/user not found)

---

## Important Notes

1. **Balance Management:**
   - When a user places a bid, their balance is immediately deducted
   - If someone outbids them, their balance is refunded
   - When auction ends, winner's balance stays deducted (already paid)
   - Creator receives payment when auction ends

2. **Auction Status:**
   - `active` - Auction is live and accepting bids
   - `sold` - Auction ended with a winner
   - `expired` - Auction ended with no bids
   - `draft` - Auction not yet published

3. **Bidding Rules:**
   - Users cannot bid on their own auctions
   - Bid must be higher than current price
   - User must have sufficient balance
   - Auction must be active and not ended

4. **Real-time Updates:**
   - Always connect to WebSocket after user logs in
   - Join auction rooms when viewing auction details
   - Listen for balance updates to keep UI in sync
   - Show notifications for won auctions

---

## Testing

Use the provided test script:
```bash
node test-websocket.js YOUR_JWT_TOKEN auction-id
```

---

## Support

For questions or issues, contact the backend team.

