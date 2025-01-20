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
SELECT 
    t.id,
    t.date,
    t.description,
    c.name AS category_name,
    g.name AS group_name,
    ARRAY_AGG(tag.name) AS tags, -- Aggregate tags into an array
    t.notes
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN groups g ON t.group_id = g.id
LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
LEFT JOIN tags tag ON tt.tag_id = tag.id
WHERE t.id = '07681'
GROUP BY t.id, t.date, t.description, c.name, g.name, t.notes
ORDER BY t.id;



-- Insert test transaction
INSERT INTO transactions (id, date, description, amount, source)
VALUES ('07682', '2024-12-01', 'Test transaction', 10.00, 'testing');

-- Delete that test transaction
DELETE FROM transactions
WHERE id = '07682';

-- Selects the top 10 transactions based on id that show me: id, date, description, category name, group name, tags, and notes. 

SELECT 
    t.id,
    t.date,
    t.description,
    c.name AS category_name,
    g.name AS group_name,
    ARRAY_AGG(tag.name) AS tags, -- Aggregate tags into an array
    t.notes
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN groups g ON t.group_id = g.id
LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
LEFT JOIN tags tag ON tt.tag_id = tag.id
GROUP BY t.id, t.date, t.description, c.name, g.name, t.notes
ORDER BY t.id
LIMIT 10;

-- Previous query but adjusted to show only entries with tags
SELECT 
    t.id,
    t.date,
    t.description,
    c.name AS category_name,
    g.name AS group_name,
    ARRAY_AGG(tag.name) AS tags, -- Aggregate tags into an array
    t.notes
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN groups g ON t.group_id = g.id
JOIN transaction_tags tt ON t.id = tt.transaction_id -- Ensure the transaction has at least one tag
JOIN tags tag ON tt.tag_id = tag.id
GROUP BY t.id, t.date, t.description, c.name, g.name, t.notes
ORDER BY t.id
LIMIT 10;

-- Insert some test data for checking tags
-- Insert Test Transactions
DO $$
DECLARE
    error_message TEXT;
BEGIN
    -- Insert Test Transactions
    INSERT INTO transactions (id, date, description, amount, notes, source)
    VALUES
    ('90000', '2024-12-01', 'Test transaction 1', -5.00, 'Test notes 1', 'test_source'),
    ('90001', '2024-12-02', 'Test transaction 2', -10.00, 'Test notes 2', 'test_source'),
    ('90002', '2024-12-03', 'Test transaction 3', -15.00, 'Test notes 3', 'test_source'),
    ('90003', '2024-12-04', 'Test transaction 4', -20.00, 'Test notes 4', 'test_source');

    -- Insert Tags (if not already present)
    INSERT INTO tags (name)
    VALUES
    ('monsters'),
    ('healthy'),
    ('travel'),
    ('soda')
    ON CONFLICT (name) DO NOTHING;

    -- Link Tags to Transactions (transaction_tags table)
    -- Add multiple tags to transaction 90000
    INSERT INTO transaction_tags (transaction_id, tag_id)
    SELECT '90000', id FROM tags WHERE name IN ('monsters', 'healthy');

    -- Add a single tag to transaction 90001
    INSERT INTO transaction_tags (transaction_id, tag_id)
    SELECT '90001', id FROM tags WHERE name = 'travel';

    -- Add multiple tags to transaction 90002
    INSERT INTO transaction_tags (transaction_id, tag_id)
    SELECT '90002', id FROM tags WHERE name IN ('monsters', 'soda');

    -- Add a single tag to transaction 90003
    INSERT INTO transaction_tags (transaction_id, tag_id)
    SELECT '90003', id FROM tags WHERE name = 'healthy';

    RETURNING id, date, description, amount, notes, source;
    -- Commit the transaction if all goes well
    COMMIT;
EXCEPTION WHEN OTHERS THEN
    -- Roll back the transaction if something goes wrong
    ROLLBACK;
    GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
    RAISE NOTICE 'Error occurred: %', error_message;
END $$;

-- See all the original descriptions from Mint transactions
SELECT id, date, original_description
FROM transactions
WHERE source = 'Mint'
ORDER BY date DESC;

-- See all categories organized by group name
SELECT c.id, c.name, g.name AS "groupName"
FROM categories c
JOIN groups g ON c."groupName" = g.name
ORDER BY g.name, c.name;

