-- Database Content Check Script
-- Run this BEFORE cleanup to see what data will be deleted

-- Check current record counts
SELECT 'CURRENT DATABASE CONTENT' as info;

SELECT 'Invoices' as table_name, COUNT(*) as record_count FROM invoices
UNION ALL
SELECT 'Line Items' as table_name, COUNT(*) as record_count FROM line_items;

-- Show sample of existing data
SELECT '--- SAMPLE INVOICES ---' as info;
SELECT 
    id,
    invoice_number,
    date,
    manual_client_name,
    status,
    created_at
FROM invoices 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '--- SAMPLE LINE ITEMS ---' as info;
SELECT 
    id,
    invoice_id,
    description,
    quantity,
    rate,
    total
FROM line_items 
ORDER BY id DESC 
LIMIT 10;

-- Check for any foreign key constraints
SELECT '--- TABLE CONSTRAINTS ---' as info;
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND (table_name = 'invoices' OR table_name = 'line_items')
ORDER BY table_name, constraint_type; 