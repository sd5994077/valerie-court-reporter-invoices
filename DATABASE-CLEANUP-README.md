# Database Cleanup Scripts

This folder contains scripts to help you clear all data from your invoice database for testing purposes.

## ⚠️ WARNING
**These scripts will permanently delete ALL data in your database. Use with extreme caution!**

## Files Created

1. **`check-database-content.sql`** - Safe script to view current data before cleanup
2. **`cleanup-database.sql`** - The actual cleanup script that deletes all data
3. **`scripts/cleanup-db.bat`** - Windows batch script for easy execution
4. **`scripts/cleanup-db.sh`** - Linux/Mac shell script for easy execution

## How to Use

### Option 1: Using the Automated Scripts (Recommended)

**On Windows:**
```bash
# Make sure your DATABASE_URL environment variable is set
set DATABASE_URL=your_neon_connection_string

# Run the cleanup script
scripts\cleanup-db.bat
```

**On Linux/Mac:**
```bash
# Make sure your DATABASE_URL environment variable is set
export DATABASE_URL="your_neon_connection_string"

# Make script executable (if needed)
chmod +x scripts/cleanup-db.sh

# Run the cleanup script
./scripts/cleanup-db.sh
```

### Option 2: Manual Execution

1. **Check what data exists first:**
   ```bash
   psql "your_neon_connection_string" -f check-database-content.sql
   ```

2. **Run the cleanup:**
   ```bash
   psql "your_neon_connection_string" -f cleanup-database.sql
   ```

### Option 3: Direct in Neon Dashboard

1. Open your Neon dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `check-database-content.sql` first to see what will be deleted
4. Then copy and paste the contents of `cleanup-database.sql` to actually clean up

## What Gets Cleared

- All invoices
- All line items
- Auto-increment sequences are reset to start from 1
- Any other related data

## Safety Features

- The automated scripts require double confirmation (type "YES" then "DELETE")
- Shows you what data exists before deleting
- Includes verification queries to confirm cleanup

## Your Neon Connection String

Replace `your_neon_connection_string` with:
```
postgresql://invoice_main_owner:npg_yxeG8hgFRS3m@ep-restless-grass-a8cewjep-pooler.eastus2.azure.neon.tech/invoice_main?sslmode=require
```

## After Cleanup

After running the cleanup, your database will be completely empty and ready for fresh testing. The next invoice you create will start with ID 1 and invoice number based on your current settings. 