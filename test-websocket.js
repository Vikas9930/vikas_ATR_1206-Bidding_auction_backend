#!/usr/bin/env node

/**
 * WebSocket Test Script for LiveBid
 * 
 * Usage:
 *   node test-websocket.js YOUR_JWT_TOKEN YOUR_AUCTION_ID
 * 
 * Example:
 *   node test-websocket.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... auction-123
 */

const io = require('socket.io-client');

// Get token and auction ID from command line arguments
const token = process.argv[2];
const auctionId = process.argv[3];

if (!token) {
  console.error('❌ Error: JWT token required');
  console.log('Usage: node test-websocket.js YOUR_JWT_TOKEN [AUCTION_ID]');
  console.log('\nExample:');
  console.log('  node test-websocket.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

console.log('🔌 Connecting to WebSocket server:', serverUrl);
console.log('🔑 Token:', token.substring(0, 50) + '...\n');

const socket = io(serverUrl, {
  auth: { token },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('   Socket ID:', socket.id);
  
  if (auctionId) {
    console.log(`\n📡 Joining auction room: ${auctionId}`);
    socket.emit('join_auction', { auctionId });
  } else {
    console.log('\n💡 Tip: Pass auction ID as second argument to join auction room');
    console.log('   Example: node test-websocket.js TOKEN auction-123');
  }
  
  console.log('\n📥 Listening for events...\n');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection Error:', error.message);
  if (error.message.includes('jwt')) {
    console.error('   → Check if your JWT token is valid');
  }
  process.exit(1);
});

// Balance updates
socket.on('BALANCE_UPDATED', (data) => {
  console.log('💰 Balance Updated:');
  console.log('   Balance: $' + data.balance);
  console.log('   Time: ' + new Date(data.timestamp).toLocaleString());
  console.log('');
});

// New bid events
socket.on('NEW_BID', (data) => {
  console.log('🎯 New Bid Placed:');
  console.log('   Auction ID: ' + data.auctionId);
  console.log('   Amount: $' + data.amount);
  console.log('   Bidder: ' + data.bidderName);
  console.log('   Bidder ID: ' + data.bidderId);
  console.log('   Current Price: $' + data.currentPrice);
  console.log('   Time: ' + new Date(data.timestamp).toLocaleString());
  console.log('');
});

// Auction price updates
socket.on('AUCTION_PRICE_UPDATED', (data) => {
  console.log('📈 Auction Price Updated:');
  console.log('   Auction ID: ' + data.auctionId);
  console.log('   Current Price: $' + data.currentPrice);
  console.log('');
});

// Viewer count
socket.on('VIEWER_COUNT', (data) => {
  console.log('👥 Viewer Count:');
  console.log('   Auction ID: ' + data.auctionId);
  console.log('   Viewers: ' + data.count);
  console.log('');
});

// Auction ending soon
socket.on('AUCTION_ENDING_SOON', (data) => {
  console.log('⏰ Auction Ending Soon:');
  console.log('   Auction ID: ' + data.auctionId);
  console.log('   Seconds Remaining: ' + data.secondsRemaining);
  console.log('');
});

// Auction sold
socket.on('AUCTION_SOLD', (data) => {
  console.log('🏆 Auction Sold:');
  console.log('   Auction ID: ' + data.auctionId);
  console.log('   Winner: ' + data.winnerName);
  console.log('   Final Price: $' + data.finalPrice);
  console.log('');
});

// Auction expired
socket.on('AUCTION_EXPIRED', (data) => {
  console.log('⏸️  Auction Expired:');
  console.log('   Auction ID: ' + data.auctionId);
  console.log('');
});

// Keep script running
console.log('Press Ctrl+C to exit\n');

process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

