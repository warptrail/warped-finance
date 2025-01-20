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
-- Insert Default Category "ungrouped"
INSERT INTO groups (name) VALUES ('ungrouped') ON CONFLICT DO NOTHING;

-- Step 2: Create Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,                     -- Unique identifier for the category
    name TEXT NOT NULL UNIQUE,                 -- Category name, must be unique
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE SET NULL -- Foreign key to groups table
);


-- Insert Default Category "uncategorized" in Group "ungrouped"
INSERT INTO categories (name, "groupName") VALUES ('uncategorized', 'ungrouped') ON CONFLICT DO NOTHING;

-- Step 3: Create Transactions Table
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    original_description TEXT,
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

-- Insert Commonly Used Tags
INSERT INTO tags (name)
VALUES
    ('recurring'),
    ('one-time'),
    ('impulse'),
    ('essential'),
    ('non-essential'),
    ('shared expense'),
    ('reimbursement'),
    ('gift'),
    ('charity'),
    ('budgeted'),
    ('over-budget'),
    ('savings'),
    ('debt payment'),
    ('tax deductible'),
    ('personal development'),
    ('emergency'),
    ('work expense'),
    ('travel'),
    ('frequent'),
    ('rare'),
    ('habit'),
    ('treat yourself'),
    ('upfront cost'),
    ('long-term investment'),
    ('lifestyle upgrade'),
    ('happy'),
    ('regret'),
    ('stress purchase'),
    ('fomo'),
    ('celebration'),
    ('holiday'),
    ('seasonal'),
    ('event'),
    ('home'),
    ('tech'),
    ('decadence'),
    ('monsters'),
    ('diy'),
    ('impulse joy')
ON CONFLICT (name) DO NOTHING;


-- Step 5: Create Join Table for Transactions and Tags
CREATE TABLE transaction_tags (
    transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Add check constraint to prevent infinite splits
ALTER TABLE transactions
    ADD CONSTRAINT check_no_infinite_splits CHECK (
        NOT (is_split = TRUE AND parent_id IS NOT NULL)
    );

-- Add index for parent-child lookups
CREATE INDEX idx_transactions_parent_id ON transactions (parent_id);


-- Step 7: Create Trigger Function
-- Function to set default category_id and group_id
CREATE OR REPLACE FUNCTION set_default_category_and_group()
RETURNS TRIGGER AS $$
BEGIN
    -- If category_id is not provided, set it to the 'uncategorized' category
    IF NEW.category_id IS NULL THEN
        SELECT id INTO NEW.category_id
        FROM categories
        WHERE name = 'uncategorized';
    END IF;

    -- Set group_id based on the category's group_id
    SELECT group_id INTO NEW.group_id
    FROM categories
    WHERE id = NEW.category_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Trigger to call the function before insert on transactions
CREATE TRIGGER set_defaults_on_transactions
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_default_category_and_group();

-- Step 9: Add a trigger function to update group_id when category_id changes
CREATE OR REPLACE FUNCTION update_group_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Update group_id based on the new category_id
    SELECT group_id INTO NEW.group_id
    FROM categories
    WHERE id = NEW.category_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_id ON transactions;

CREATE TRIGGER trigger_update_group_id
BEFORE UPDATE OF category_id ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_group_id();
