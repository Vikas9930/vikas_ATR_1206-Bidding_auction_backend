# Frontend Integration Guide - Auction Bidding System

## 🎯 Overview

This guide provides complete details for frontend developers to integrate with the LiveBid auction system, including bidding rules, winner tracking, history management, and real-time updates.

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 User Endpoints

### 1. Get User Profile
**GET** `/users/me`

**Headers:**
```
Authorization: Bearer <token>
```

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
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "User statistics retrieved successfully",
  "statistics": {
    "balance": 1000.00,
    "auctionsWon": 5,        // ✅ Uses totalWins from database
    "auctionsCreated": 12
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Frontend Usage:**
```typescript
// Display dashboard statistics
const stats = await getUserStatistics();
setBalance(stats.statistics.balance);
setAuctionsWon(stats.statistics.auctionsWon);
setAuctionsCreated(stats.statistics.auctionsCreated);
```

---

### 3. Get Won Auctions
**GET** `/users/won-auctions`

**Headers:**
```
Authorization: Bearer <token>
```

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

**Frontend Usage:**
```typescript
// Display "Won Auctions" tab
const wonAuctions = await getWonAuctions();
wonAuctions.wins.forEach(win => {
  console.log(`Won: ${win.auction.title} for $${win.finalPrice}`);
});
```

---

### 4. Get Win History (Paginated)
**GET** `/users/win-history?page=1&limit=20`

**Headers:**
```
Authorization: Bearer <token>
```

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
        "creator": { ... }
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

---

## 🎯 Auction Endpoints

### 5. Place Bid
**POST** `/auctions/:id/bid`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 150.00
}
```

**Success Response:**
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

#### ❌ Cannot Bid on Own Auction (403)
```json
{
  "statusCode": 403,
  "message": "You cannot bid on your own auction. Please bid on auctions created by other users."
}
```

#### ❌ Auction Not Active (400)
```json
{
  "statusCode": 400,
  "message": "This auction is currently sold. Only active auctions can receive bids."
}
```

#### ❌ Auction Ended (400)
```json
{
  "statusCode": 400,
  "message": "This auction has ended on 1/15/2024, 12:00:00 PM. You can no longer place bids on this auction."
}
```

#### ❌ Bid Too Low (400)
```json
{
  "statusCode": 400,
  "message": "Your bid of $100.00 must be higher than the current price of $120.00. Please increase your bid amount."
}
```

#### ❌ Insufficient Balance (400)
```json
{
  "statusCode": 400,
  "message": "Insufficient balance. Your current balance is $50.00, but you need $150.00 to place this bid."
}
```

**Frontend Implementation:**
```typescript
async function placeBid(auctionId: string, amount: number) {
  try {
    const response = await fetch(`/api/v1/auctions/${auctionId}/bid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Handle specific error cases
      if (response.status === 403) {
        // User trying to bid on own auction
        showError('You cannot bid on your own auction');
      } else if (response.status === 400) {
        // Validation error (ended, not active, insufficient balance, etc.)
        showError(error.message);
      }
      return;
    }

    const data = await response.json();
    // Update UI
    updateBalance(data.bidderBalance);
    showSuccess(data.message);
    
    // Balance will be updated via WebSocket, but you can update immediately
  } catch (error) {
    console.error('Error placing bid:', error);
  }
}
```

---

## 🔌 WebSocket Integration

### Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN' // Get from login response
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Join Auction Room

```typescript
// When user views an auction page
socket.emit('join_auction', { auctionId: 'auction-uuid' });

// When user leaves auction page
socket.emit('leave_auction', { auctionId: 'auction-uuid' });
```

---

## 📡 WebSocket Events

### 1. BALANCE_UPDATED
**Event:** `BALANCE_UPDATED`

**When:** User's balance changes (after placing bid, receiving refund, winning auction)

**Payload:**
```typescript
{
  balance: number;      // New balance amount
  timestamp: string;     // ISO timestamp
}
```

**Frontend Handler:**
```typescript
socket.on('BALANCE_UPDATED', (data: { balance: number; timestamp: string }) => {
  // Update balance display in real-time
  setUserBalance(data.balance);
  
  // Show notification if balance decreased significantly
  if (previousBalance > data.balance) {
    showNotification(`Balance updated: $${data.balance.toFixed(2)}`);
  }
});
```

---

### 2. NEW_BID
**Event:** `NEW_BID`

**When:** A new bid is placed on an auction (only to users watching that auction)

**Payload:**
```typescript
{
  auctionId: string;
  amount: number;
  bidderName: string;      // Email prefix (e.g., "john" from "john@example.com")
  bidderId: string;
  currentPrice: number;
  timestamp: string;
}
```

**Frontend Handler:**
```typescript
socket.on('NEW_BID', (data: {
  auctionId: string;
  amount: number;
  bidderName: string;
  bidderId: string;
  currentPrice: number;
  timestamp: string;
}) => {
  // Update auction page with new bid
  if (currentAuctionId === data.auctionId) {
    updateCurrentPrice(data.currentPrice);
    addBidToHistory({
      amount: data.amount,
      bidderName: data.bidderName,
      timestamp: data.timestamp,
    });
    
    // Show notification
    showNotification(`${data.bidderName} placed a bid of $${data.amount}`);
  }
});
```

---

### 3. AUCTION_SOLD
**Event:** `AUCTION_SOLD`

**When:** Auction ends and is sold (broadcast to all viewers)

**Payload:**
```typescript
{
  auctionId: string;
  winnerId: string;        // ✅ NEW: Winner's user ID
  winnerName: string;       // Email prefix
  finalPrice: number;
  timestamp: string;
}
```

**Frontend Handler:**
```typescript
socket.on('AUCTION_SOLD', (data: {
  auctionId: string;
  winnerId: string;        // ✅ NEW
  winnerName: string;
  finalPrice: number;
  timestamp: string;
}) => {
  // Update auction status
  if (currentAuctionId === data.auctionId) {
    setAuctionStatus('sold');
    setWinner(data.winnerName);
    setFinalPrice(data.finalPrice);
    
    // Show winner announcement
    showWinnerAnnouncement({
      winner: data.winnerName,
      price: data.finalPrice,
    });
    
    // If current user won, show special notification
    if (currentUserId === data.winnerId) {
      showCelebrationModal('🎉 Congratulations! You won!');
    }
  }
  
  // Update auction list
  updateAuctionInList(data.auctionId, {
    status: 'sold',
    winner: data.winnerName,
    finalPrice: data.finalPrice,
  });
});
```

---

### 4. AUCTION_WON (Personal Notification)
**Event:** `AUCTION_WON`

**When:** User wins an auction (sent only to the winner)

**Payload:**
```typescript
{
  message: string;         // "Congratulations! You won the auction \"Vintage Watch\" for $1500.00!"
  auctionId: string;
  auctionTitle: string;
  finalPrice: number;
  winnerName: string;
  timestamp: string;
}
```

**Frontend Handler:**
```typescript
socket.on('AUCTION_WON', (data: {
  message: string;
  auctionId: string;
  auctionTitle: string;
  finalPrice: number;
  winnerName: string;
  timestamp: string;
}) => {
  // Show celebration modal/notification
  showCelebrationModal({
    title: '🎉 You Won!',
    message: data.message,
    auctionTitle: data.auctionTitle,
    finalPrice: data.finalPrice,
  });
  
  // Refresh statistics
  refreshUserStatistics();
  
  // Refresh won auctions list
  refreshWonAuctions();
  
  // Update dashboard
  updateDashboardStats();
  
  // Navigate to won auctions page (optional)
  // router.push('/won-auctions');
});
```

---

### 5. AUCTION_EXPIRED
**Event:** `AUCTION_EXPIRED`

**When:** Auction ends with no bids

**Payload:**
```typescript
{
  auctionId: string;
}
```

**Frontend Handler:**
```typescript
socket.on('AUCTION_EXPIRED', (data: { auctionId: string }) => {
  // Update auction status
  if (currentAuctionId === data.auctionId) {
    setAuctionStatus('expired');
    showNotification('Auction expired with no bids');
  }
  
  // Update auction list
  updateAuctionInList(data.auctionId, {
    status: 'expired',
  });
});
```

---

### 6. AUCTION_PRICE_UPDATED
**Event:** `AUCTION_PRICE_UPDATED`

**When:** Auction price changes (broadcast to all connected clients)

**Payload:**
```typescript
{
  auctionId: string;
  currentPrice: number;
}
```

**Frontend Handler:**
```typescript
socket.on('AUCTION_PRICE_UPDATED', (data: {
  auctionId: string;
  currentPrice: number;
}) => {
  // Update price in auction list
  updateAuctionPrice(data.auctionId, data.currentPrice);
});
```

---

## 🎨 Complete Frontend Integration Example

### React/TypeScript Hook

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UserStats {
  balance: number;
  auctionsWon: number;
  auctionsCreated: number;
}

interface AuctionWin {
  id: string;
  auctionId: string;
  finalPrice: number;
  endedAt: string;
  auction: {
    id: string;
    title: string;
    description: string;
    creator: { email: string };
  };
}

export function useLiveBid(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    // Balance updates
    newSocket.on('BALANCE_UPDATED', (data: { balance: number }) => {
      setBalance(data.balance);
    });

    // Won auction notification
    newSocket.on('AUCTION_WON', (data: {
      message: string;
      auctionId: string;
      auctionTitle: string;
      finalPrice: number;
    }) => {
      setNotifications(prev => [...prev, {
        type: 'success',
        title: '🎉 You Won!',
        message: data.message,
        timestamp: new Date(),
      }]);
      
      // Refresh statistics
      fetchUserStatistics();
    });

    // New bid on auction
    newSocket.on('NEW_BID', (data: {
      auctionId: string;
      amount: number;
      bidderName: string;
      currentPrice: number;
    }) => {
      // Update auction if currently viewing
      if (currentAuctionId === data.auctionId) {
        updateAuctionPrice(data.currentPrice);
      }
    });

    // Auction sold
    newSocket.on('AUCTION_SOLD', (data: {
      auctionId: string;
      winnerId: string;
      winnerName: string;
      finalPrice: number;
    }) => {
      // Update auction status
      updateAuctionStatus(data.auctionId, 'sold', data.winnerId);
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

  const fetchUserStatistics = async () => {
    const response = await fetch('/api/v1/users/statistics', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setStats(data.statistics);
    setBalance(data.statistics.balance);
  };

  const fetchWonAuctions = async (): Promise<AuctionWin[]> => {
    const response = await fetch('/api/v1/users/won-auctions', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    return data.wins;
  };

  return {
    socket,
    balance,
    stats,
    notifications,
    joinAuction,
    leaveAuction,
    fetchUserStatistics,
    fetchWonAuctions,
  };
}
```

---

## 🚨 Error Handling Guide

### Bidding Rules Validation

```typescript
async function handlePlaceBid(auctionId: string, amount: number) {
  try {
    const response = await fetch(`/api/v1/auctions/${auctionId}/bid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      switch (response.status) {
        case 403:
          // User trying to bid on own auction
          showError('You cannot bid on your own auction');
          break;
        
        case 400:
          // Check error message for specific cases
          if (data.message.includes('ended')) {
            showError('This auction has ended');
          } else if (data.message.includes('not active')) {
            showError('This auction is no longer accepting bids');
          } else if (data.message.includes('Insufficient balance')) {
            showError(data.message);
            // Optionally redirect to add funds page
            router.push('/add-funds');
          } else if (data.message.includes('must be higher')) {
            showError(data.message);
            // Update bid input with suggested minimum
            setMinBidAmount(parseMinBidFromError(data.message));
          }
          break;
        
        default:
          showError('Failed to place bid. Please try again.');
      }
      return;
    }

    // Success
    showSuccess(data.message);
    updateBalance(data.bidderBalance);
    
  } catch (error) {
    console.error('Error placing bid:', error);
    showError('Network error. Please check your connection.');
  }
}
```

---

## 📊 Dashboard Integration

### Statistics Display

```typescript
// Fetch and display statistics
const { stats, balance } = useLiveBid(token);

useEffect(() => {
  fetchUserStatistics();
}, []);

// Display in UI
<div className="stats">
  <StatCard 
    icon="💰" 
    label="Balance" 
    value={`$${balance.toFixed(2)}`} 
  />
  <StatCard 
    icon="🏆" 
    label="Auctions Won" 
    value={stats?.auctionsWon || 0} 
  />
  <StatCard 
    icon="🔨" 
    label="Auctions Created" 
    value={stats?.auctionsCreated || 0} 
  />
</div>
```

---

## 🎯 Won Auctions Page

```typescript
function WonAuctionsPage() {
  const [wins, setWins] = useState<AuctionWin[]>([]);
  const { fetchWonAuctions } = useLiveBid(token);

  useEffect(() => {
    loadWonAuctions();
  }, []);

  const loadWonAuctions = async () => {
    const data = await fetchWonAuctions();
    setWins(data);
  };

  return (
    <div>
      <h1>Won Auctions</h1>
      {wins.length === 0 ? (
        <EmptyState message="You haven't won any auctions yet. Keep bidding!" />
      ) : (
        <div className="wins-list">
          {wins.map(win => (
            <WinCard
              key={win.id}
              title={win.auction.title}
              finalPrice={win.finalPrice}
              endedAt={win.endedAt}
              creator={win.auction.creator.email}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Implementation Checklist

- [ ] Set up WebSocket connection with JWT authentication
- [ ] Listen for `BALANCE_UPDATED` events and update UI
- [ ] Listen for `AUCTION_WON` events and show celebration
- [ ] Listen for `NEW_BID` events and update auction pages
- [ ] Listen for `AUCTION_SOLD` events and update auction status
- [ ] Handle bidding error cases (403, 400)
- [ ] Display user statistics (balance, wins, created)
- [ ] Show won auctions list
- [ ] Join/leave auction rooms when viewing auction details
- [ ] Refresh statistics after winning auction
- [ ] Update balance display in real-time
- [ ] Show notifications for important events

---

## 🔗 API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | ✅ | Get user profile |
| GET | `/users/statistics` | ✅ | Get balance, wins, created count |
| GET | `/users/won-auctions` | ✅ | Get all won auctions |
| GET | `/users/win-history?page=1&limit=20` | ✅ | Get paginated win history |
| POST | `/auctions/:id/bid` | ✅ | Place a bid |
| GET | `/auctions/available` | ✅ | Get auctions user can bid on |

---

## 📝 Important Notes

1. **Balance Updates:** Balance is updated via WebSocket (`BALANCE_UPDATED`), but you can also update immediately after placing a bid using the response.

2. **Winner Notification:** When a user wins, they receive `AUCTION_WON` event. Always refresh statistics and won auctions list when this event is received.

3. **Bidding Rules:** 
   - Users cannot bid on their own auctions (403 error)
   - Only active auctions accept bids
   - Bid must be higher than current price
   - User must have sufficient balance

4. **Real-time Updates:** Always join auction rooms when viewing auction details to receive real-time bid updates.

5. **Error Handling:** Check error messages for specific validation failures and provide helpful UI feedback.

---

## 🆘 Support

For questions or issues, contact the backend team or refer to:
- `API_DOCUMENTATION.md` - Complete API reference
- `API_QUICK_REFERENCE.md` - Quick endpoint reference
- `IMPLEMENTATION_SUMMARY.md` - Backend implementation details

