-- Mark migration as executed if column already exists
-- Run this if totalWins column already exists in users table

INSERT INTO migrations (timestamp, name)
SELECT 1700000000003, 'AddAuctionWinsAndTotalWins1700000000003'
WHERE NOT EXISTS (
    SELECT 1 FROM migrations WHERE name = 'AddAuctionWinsAndTotalWins1700000000003'
);

