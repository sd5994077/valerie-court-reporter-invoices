-- Database Cleanup Script for Invoice System
-- This script will clear all data from the tables to start fresh
-- Use with caution - this will permanently delete all data!

-- Disable foreign key constraints temporarily (if using PostgreSQL)
SET session_replication_role = replica;

-- Clear all invoice-related tables
-- Order matters due to foreign key relationships

-- Clear line items first (they reference invoices)
TRUNCATE TABLE line_items CASCADE;

-- Clear invoices
TRUNCATE TABLE invoices CASCADE;

-- Clear clients if you have a separate clients table
-- TRUNCATE TABLE clients CASCADE;

-- Clear any audit or log tables if they exist
-- TRUNCATE TABLE invoice_audit_log CASCADE;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Reset auto-increment sequences (PostgreSQL)
-- This ensures new records start from ID 1 again
ALTER SEQUENCE IF EXISTS invoices_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS line_items_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS clients_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'Invoices' as table_name, COUNT(*) as record_count FROM invoices
UNION ALL
SELECT 'Line Items' as table_name, COUNT(*) as record_count FROM line_items;

-- Success message
SELECT 'Database cleanup completed successfully!' as status; 