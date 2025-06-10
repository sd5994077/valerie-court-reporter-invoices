#!/bin/bash

echo "=========================================="
echo "   Invoice Database Cleanup Script"
echo "=========================================="
echo ""
echo "WARNING: This will DELETE ALL data in your database!"
echo ""

read -p "Are you sure you want to continue? (type YES to confirm): " confirm

if [ "$confirm" != "YES" ]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo ""
echo "Running pre-cleanup check..."
psql $DATABASE_URL -f check-database-content.sql

echo ""
read -p "Proceed with cleanup? (type DELETE to confirm): " final_confirm

if [ "$final_confirm" != "DELETE" ]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo ""
echo "Running database cleanup..."
psql $DATABASE_URL -f cleanup-database.sql

echo ""
echo "Cleanup completed!"
echo "" 