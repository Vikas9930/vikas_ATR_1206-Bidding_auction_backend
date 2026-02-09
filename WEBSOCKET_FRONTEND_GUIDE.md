# WebSocket Frontend Integration Guide

This guide shows how to connect to the LiveBid WebSocket server for real-time updates on balance changes and bidding activity.

## Connection Setup

### Install Socket.IO Client

```bash
npm install socket.io-client
```

### Basic Connection Example (React/TypeScript)

```typescript
import { io, Socket } from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE', // Get this from login/register response
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## Real-Time Events

### 1. Balance Updates

**Event Name:** `BALANCE_UPDATED`

**Description:** Emitted when a user's balance changes (after placing a bid, receiving a refund, etc.)

**Payload:**
```typescript
{
  balance: number;      // New balance amount
  timestamp: string;    // ISO timestamp
}
```

**Example Usage:**
```typescript
socket.on('BALANCE_UPDATED', (data: { balance: number; timestamp: string }) => {
  console.log('Balance updated:', data.balance);
  // Update your UI with the new balance
  setUserBalance(data.balance);
});
```

### 2. New Bid Placed

**Event Name:** `NEW_BID`

**Description:** Emitted when a new bid is placed on an auction (only to users watching that auction)

**Payload:**
```typescript
{
  auctionId: string;
  amount: number;           // Bid amount
  bidderName: string;       // Bidder's name (email prefix)
  bidderId: string;        // Bidder's user ID
  currentPrice: number;     // New current price of auction
  timestamp: string;        // ISO timestamp
}
```

**Example Usage:**
```typescript
socket.on('NEW_BID', (data: {
  auctionId: string;
  amount: number;
  bidderName: string;
  bidderId: string;
  currentPrice: number;
  timestamp: string;
}) => {
  console.log(`New bid on auction ${data.auctionId}: $${data.amount}`);
  // Update auction price in your UI
  updateAuctionPrice(data.auctionId, data.currentPrice);
  // Show notification
  showNotification(`${data.bidderName} placed a bid of $${data.amount}`);
});
```

### 3. Auction Price Updated (Global)

**Event Name:** `AUCTION_PRICE_UPDATED`

**Description:** Emitted to all connected users when any auction's price is updated (useful for dashboard/list views)

**Payload:**
```typescript
{
  auctionId: string;
  currentPrice: number;
}
```

**Example Usage:**
```typescript
socket.on('AUCTION_PRICE_UPDATED', (data: { auctionId: string; currentPrice: number }) => {
  // Update price in auction list/dashboard
  updateAuctionInList(data.auctionId, { currentPrice: data.currentPrice });
});
```

### 4. Auction Updated (General)

**Event Name:** `AUCTION_UPDATED`

**Description:** General auction update event

**Payload:**
```typescript
{
  auctionId: string;
  currentPrice: number;
}
```

### 5. Viewer Count

**Event Name:** `VIEWER_COUNT`

**Description:** Emitted when the number of viewers watching an auction changes

**Payload:**
```typescript
{
  auctionId: string;
  count: number;  // Number of viewers
}
```

### 6. Auction Ending Soon

**Event Name:** `AUCTION_ENDING_SOON`

**Description:** Emitted when an auction is about to end (within 60 seconds)

**Payload:**
```typescript
{
  auctionId: string;
  secondsRemaining: number;
}
```

### 7. Auction Sold

**Event Name:** `AUCTION_SOLD`

**Description:** Emitted when an auction is sold

**Payload:**
```typescript
{
  auctionId: string;
  winnerName: string;
  finalPrice: number;
}
```

### 8. Auction Expired

**Event Name:** `AUCTION_EXPIRED`

**Description:** Emitted when an auction expires without any bids

**Payload:**
```typescript
{
  auctionId: string;
}
```

## Joining Auction Rooms

To receive auction-specific events (like `NEW_BID`), you need to join the auction room:

```typescript
// Join an auction room
socket.emit('join_auction', { auctionId: 'auction-id-here' });

// Leave an auction room
socket.emit('leave_auction', { auctionId: 'auction-id-here' });
```

## Complete React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  socket: Socket | null;
  balance: number;
  isConnected: boolean;
}

export function useWebSocket(token: string | null): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Balance updates
    newSocket.on('BALANCE_UPDATED', (data: { balance: number }) => {
      console.log('Balance updated:', data.balance);
      setBalance(data.balance);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, balance, isConnected };
}

// Usage in component
function AuctionComponent({ auctionId }: { auctionId: string }) {
  const token = localStorage.getItem('token');
  const { socket, balance, isConnected } = useWebSocket(token);
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Join auction room
    socket.emit('join_auction', { auctionId });

    // Listen for new bids
    socket.on('NEW_BID', (data: { currentPrice: number; bidderName: string; amount: number }) => {
      setCurrentPrice(data.currentPrice);
      // Show notification
      alert(`${data.bidderName} placed a bid of $${data.amount}`);
    });

    // Listen for price updates
    socket.on('AUCTION_PRICE_UPDATED', (data: { currentPrice: number }) => {
      setCurrentPrice(data.currentPrice);
    });

    return () => {
      socket.emit('leave_auction', { auctionId });
      socket.off('NEW_BID');
      socket.off('AUCTION_PRICE_UPDATED');
    };
  }, [socket, auctionId]);

  return (
    <div>
      <p>Your Balance: ${balance}</p>
      <p>Current Price: ${currentPrice}</p>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

## Vue.js Example

```javascript
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useWebSocket(token) {
  const socket = ref(null);
  const balance = ref(0);
  const isConnected = ref(false);

  onMounted(() => {
    if (!token) return;

    socket.value = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.value.on('connect', () => {
      isConnected.value = true;
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
    });

    socket.value.on('BALANCE_UPDATED', (data) => {
      balance.value = data.balance;
    });
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close();
    }
  });

  return { socket, balance, isConnected };
}
```

## Important Notes

1. **Authentication:** Always pass the JWT token in the `auth.token` field when connecting
2. **Reconnection:** The client automatically reconnects on disconnect
3. **Balance Updates:** Balance is automatically sent when you connect, and updates in real-time when bids are placed
4. **Auction Rooms:** Join auction rooms to receive auction-specific events
5. **CORS:** Make sure your frontend URL is allowed in the WebSocket gateway CORS configuration

## Server URL

- **Development:** `http://localhost:3000`
- **Production:** Replace with your production server URL

## Testing with cURL

You can test WebSocket connections using `wscat`:

```bash
npm install -g wscat

# Connect with token
wscat -c "ws://localhost:3000" -H "Authorization: Bearer YOUR_TOKEN"
```

