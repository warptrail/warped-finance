-- ***********************************
-- USEFUL SQL QUERIES FOR THIS PROJECT
-- ***********************************

-- Get the most recent transaction
SELECT *
FROM transactions
ORDER BY date DESC
LIMIT 1;

-- Get the Transaction with the Lowest Amount:
-- Not this one, will give the lowest negative number
SELECT * 
FROM transactions
ORDER BY amount ASC
LIMIT 1;

-- This one is the lowest expense
SELECT * 
FROM transactions
WHERE amount < 0
ORDER BY ABS(amount) ASC
LIMIT 1;

-- Get a specific Transaction
SELECT id, date, description, amount, group_id, category_id
FROM transactions
WHERE id = '07682';


-- Insert test transaction
INSERT INTO transactions (id, date, description, amount, source)
VALUES ('07682', '2024-12-01', 'Test transaction', 10.00, 'testing');

-- Delete that test transaction
DELETE FROM transactions
WHERE id = '07682';