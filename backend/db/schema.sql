-- schema.sql: Create Database Schema

-- Drop existing tables if they exist (optional for idempotency)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Create Groups Table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Create Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    "groupName" TEXT REFERENCES groups(name) ON DELETE SET NULL
);

-- Create Transactions Table
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE SET NULL,
    is_split BOOLEAN DEFAULT FALSE,
    account_name TEXT,
    notes TEXT,
    tags TEXT,
    source TEXT NOT NULL,
    quantity INTEGER,
    link TEXT,
    location TEXT
);

-- Insert Default Group "ungrouped"
INSERT INTO groups (name) VALUES ('ungrouped') ON CONFLICT DO NOTHING;

-- Dynamically Set Default group_id for Transactions
DO $$
DECLARE ungrouped_id INTEGER;
BEGIN
    SELECT id INTO ungrouped_id
    FROM groups
    WHERE name = 'ungrouped';

    EXECUTE format('ALTER TABLE transactions ALTER COLUMN group_id SET DEFAULT %s', ungrouped_id);
END $$;

-- Insert Default Category "uncategorized" in Group "ungrouped"
INSERT INTO categories (name, "groupName") VALUES ('uncategorized', 'ungrouped') ON CONFLICT DO NOTHING;

-- Set Default for category_id Dynamically
DO $$
DECLARE uncategorized_id INTEGER;
BEGIN
    SELECT id INTO uncategorized_id
    FROM categories
    WHERE name = 'uncategorized' AND "groupName" = 'ungrouped';

    EXECUTE format('ALTER TABLE transactions ALTER COLUMN category_id SET DEFAULT %s', uncategorized_id);
END $$;