# LiveBid API - Quick Reference

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All protected endpoints require: `Authorization: Bearer <token>`

---

## 📊 User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | ✅ | Get user profile |
| GET | `/users/statistics` | ✅ | Get balance, auctions won, auctions created |
| GET | `/users/won-auctions` | ✅ | Get all auctions user has won |

---

## 🎯 Auction Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/auctions/available?page=1&limit=20` | ✅ | Get auctions user can bid on (excludes own) |
| GET | `/auctions/my-auctions` | ✅ | Get auctions created by user |
| GET | `/auctions/dashboard?page=1&limit=20` | ❌ | Get active auctions for dashboard |
| GET | `/auctions?page=1&limit=10&status=active` | ❌ | Get all auctions (with filters) |
| GET | `/auctions/:id` | ❌ | Get single auction details |
| POST | `/auctions` | ✅ | Create new auction (multipart/form-data) |
| POST | `/auctions/:id/bid` | ✅ | Place a bid on auction |

---

## 🔌 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### Join/Leave Auction
```javascript
socket.emit('join_auction', { auctionId: 'uuid' });
socket.emit('leave_auction', { auctionId: 'uuid' });
```

### Events to Listen For

| Event | Description | Use Case |
|-------|-------------|----------|
| `BALANCE_UPDATED` | User balance changed | Update balance display |
| `NEW_BID` | New bid placed on auction | Update auction page |
| `AUCTION_PRICE_UPDATED` | Auction price changed | Update auction list |
| `AUCTION_WON` | User won an auction | Show notification, refresh stats |
| `AUCTION_SOLD` | Auction ended and sold | Update auction status |
| `AUCTION_EXPIRED` | Auction expired with no bids | Update auction status |
| `VIEWER_COUNT` | Number of viewers changed | Show viewer count |
| `AUCTION_ENDING_SOON` | Auction ending in 5 minutes | Show countdown warning |

---

## 📝 Request/Response Examples

### Get Statistics
```javascript
GET /users/statistics
Headers: Authorization: Bearer <token>

Response:
{
  "statistics": {
    "balance": 1000.00,
    "auctionsWon": 5,
    "auctionsCreated": 12
  }
}
```

### Place Bid
```javascript
POST /auctions/:id/bid
Headers: Authorization: Bearer <token>
Body: { "amount": 150.00 }

Response:
{
  "message": "Congratulations! Your bid of $150.00 is now the highest bid...",
  "bidderBalance": 850.00,
  "isHighestBid": true
}
```

### WebSocket - Won Auction
```javascript
socket.on('AUCTION_WON', (data) => {
  // data.message: "Congratulations! You won..."
  // data.auctionTitle: "Vintage Watch"
  // data.finalPrice: 150.00
});
```

---

## ⚠️ Important Rules

1. **Users cannot bid on their own auctions**
2. **Bid must be higher than current price**
3. **User must have sufficient balance**
4. **Balance is deducted immediately when bidding**
5. **Previous bidder gets refunded when outbid**
6. **Winner receives notification via WebSocket when auction ends**

---

## 🎨 Frontend Integration Checklist

- [ ] Connect to WebSocket after login
- [ ] Listen for `BALANCE_UPDATED` to keep balance in sync
- [ ] Join auction room when viewing auction details
- [ ] Show notification when `AUCTION_WON` event received
- [ ] Refresh statistics after winning auction
- [ ] Update auction list when `NEW_BID` received
- [ ] Handle error messages gracefully

---

For detailed documentation, see `API_DOCUMENTATION.md`

