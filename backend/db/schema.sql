-- schema.sql: Create Database Schema

-- Drop tables if they exist
DROP TABLE IF EXISTS transaction_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Step 1: Create Groups Table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Step 2: Create Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    "groupName" TEXT NOT NULL REFERENCES groups(name) ON DELETE SET NULL
);

-- Step 3: Create Transactions Table
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET DEFAULT,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET DEFAULT,
    is_split BOOLEAN DEFAULT FALSE,
    account_name TEXT,
    notes TEXT,
    source TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    link TEXT,
    location TEXT
);

-- Step 4: Create Tags Table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Step 5: Create Join Table for Transactions and Tags
CREATE TABLE transaction_tags (
    transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Step 6: Update the Categories Table
ALTER TABLE categories ADD CONSTRAINT unique_category_group UNIQUE (name, "groupName");


-- Step 7: Insert Default Group "ungrouped"
-- INSERT INTO groups (id, name) VALUES (1, 'ungrouped') ON CONFLICT DO NOTHING;

-- Step 8: Insert Default Category "uncategorized" in Group "ungrouped"
-- INSERT INTO categories (id, name, "groupName") VALUES (1, 'uncategorized', 'ungrouped') ON CONFLICT DO NOTHING;

-- Step 5: Create Trigger Function
CREATE OR REPLACE FUNCTION set_default_category_group()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default category_id to 'uncategorized' in 'ungrouped' if not provided
    IF NEW.category_id IS NULL THEN
        NEW.category_id := (SELECT id FROM categories WHERE name = 'uncategorized' AND "groupName" = 'ungrouped');
    END IF;

    -- Set default group_id based on the category_id if not provided
    IF NEW.group_id IS NULL THEN
        NEW.group_id := (SELECT g.id FROM groups g
            JOIN categories c ON g.name = c."groupName"
            WHERE c.id = NEW.category_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Attach Trigger to Transactions Table
CREATE TRIGGER set_defaults_on_insert
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_default_category_group();