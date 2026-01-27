# Database Setup - Neon PostgreSQL

## Connection Details

### Production Database
- Branch: `production`
- Endpoint: `ep-divine-scene-a8215e27-pooler.eastus2.azure.neon.tech`

### Staging Database
- Branch: `valerie-invoice-staging`
- Endpoint: `ep-restless-grass-a8cewjep-pooler.eastus2.azure.neon.tech`

---

## Environment Variables

The `.env` file contains:
- `POSTGRES_URL` - Points to production by default (@vercel/postgres expects this variable name)
- Staging connection string is commented out for local testing

To switch to staging locally:
1. Comment out the production `POSTGRES_URL`
2. Uncomment the staging `POSTGRES_URL`
3. Restart your dev server (`npm run dev`)

---

## Database Schema

### Tables Created:

1. **users** - User accounts with business information
   - Multi-user support with user isolation
   - Stores business details, license info, contact info

2. **invoices** - Invoice records
   - Linked to users
   - Contains client info, case details, financial data
   - Unique invoice numbers per user

3. **line_items** - Invoice line items
   - Normalized line item data
   - Linked to invoices

4. **invoice_sequences** - Auto-numbering system
   - Tracks last invoice number per user per year
   - Ensures sequential INV-YYYY-#### format

5. **appeals** - Appeal cases
   - Tracks appeal deadlines and status
   - Contains requester information and case details

6. **appeal_extensions** - Appeal extension requests
   - Tracks extension dates and days granted
   - Linked to appeals

---

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install @vercel/postgres
```
✅ Already done!

### Step 2: Initialize Database Tables

**Option A: Using the Admin UI (Recommended)**
1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/db-admin`
3. Click "Create Missing Tables" button

**Option B: Using API directly**
```bash
# Check status
curl http://localhost:3000/api/db/status

# Initialize tables
curl -X POST http://localhost:3000/api/db/init
```

### Step 3: Verify Setup
Visit `/db-admin` to see:
- ✅ Connection status
- ✅ List of created tables
- ✅ Database environment (production/staging)

---

## API Endpoints

### GET `/api/db/status`
Returns database connection status and list of tables

Response:
```json
{
  "success": true,
  "environment": "development",
  "database": "production",
  "connection": {
    "status": "connected",
    "serverTime": "2026-01-25T..."
  },
  "tables": {
    "count": 6,
    "list": ["users", "invoices", ...]
  }
}
```

### POST `/api/db/init`
Creates all database tables

Response:
```json
{
  "success": true,
  "message": "All tables created successfully",
  "tables": ["users", "invoices", ...]
}
```

---

## Vercel Deployment

### Environment Variables to Set:

**Production:**
```
# Get the production connection string from Vercel environment variables or your password manager.
# Format: postgresql://username:password@host/database?sslmode=require
POSTGRES_URL=postgresql://<username>:<password>@<host>/<database>?sslmode=require
```

**Staging (Preview Deployments):**
```
# Get the staging connection string from Vercel environment variables or your password manager.
# Format: postgresql://username:password@host/database?sslmode=require
POSTGRES_URL=postgresql://<username>:<password>@<host>/<database>?sslmode=require
```

In Vercel:
1. Go to Project Settings → Environment Variables
2. Add `POSTGRES_URL` for Production environment
3. Add `POSTGRES_URL` for Preview environment (staging)

**Important:** `@vercel/postgres` expects `POSTGRES_URL`, not `DATABASE_URL`

---

## Database Utility (`src/lib/db.ts`)

### Available Functions:

```typescript
import { sql, testConnection, checkTables, initializeTables } from '../src/lib/db';

// Execute raw SQL
const result = await sql`SELECT * FROM users WHERE email = ${email}`;

// Test connection
const status = await testConnection();

// Check existing tables
const tables = await checkTables();

// Initialize all tables
const result = await initializeTables();
```

---

## Migration from localStorage

### Current Status:
- ✅ Database connected
- ✅ Tables defined
- ⏳ Data migration pending

### Next Steps:
1. Create API routes for CRUD operations
2. Update dashboard to use database
3. Update appeals page to use database
4. Add authentication (NextAuth.js)
5. Migrate existing localStorage data

---

## Indexes for Performance

All tables have appropriate indexes:
- `idx_invoices_user_date` - Fast invoice queries by user and date
- `idx_invoices_user_status` - Status filtering per user
- `idx_appeals_user_status` - Appeal status queries
- `idx_appeals_deadline` - Deadline-based queries
- And more...

---

## Security Notes

- ✅ Connection uses SSL (`sslmode=require`)
- ✅ User isolation via `user_id` foreign keys
- ✅ Prepared statements prevent SQL injection
- 🔒 Authentication coming next (NextAuth.js)

---

## Troubleshooting

### Connection Issues
1. Check `.env` file has correct `POSTGRES_URL` (not `DATABASE_URL`)
2. Restart dev server after changing `.env` file
3. Verify Neon database is active (not paused)
4. Check Vercel deployment logs

### Table Creation Issues
1. Visit `/db-admin` to see specific errors
2. Check Neon dashboard for connection limits
3. Verify database user has CREATE TABLE permissions

---

## What's Next?

1. **Add Authentication** - NextAuth.js with Google OAuth
2. **Create API Routes** - CRUD operations for invoices and appeals
3. **Update Components** - Replace localStorage with API calls
4. **Data Migration** - Move existing data from localStorage to database
5. **Test Everything** - Verify all features work with database

Would you like me to start on any of these next steps?
