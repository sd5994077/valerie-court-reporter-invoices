# 🗄️ Database Setup Guide - Neon + Vercel

## Overview
Since you already have a development database in Neon, we'll create staging and production databases there and configure Vercel to use them.

## 📊 **Database Environment Strategy**

| Environment | Database Location | Purpose |
|-------------|------------------|---------|
| **Development** | Neon (existing) | Local development |
| **Staging** | Neon (new) | Vercel preview deployments |
| **Production** | Neon (new) | Live production site |

## 🔧 **Setup Steps**

### **Step 1: Create Databases in Neon**

1. **Log into your Neon console**
2. **Create Staging Database:**
   - Name: `valerie-invoice-staging`
   - Purpose: Testing Vercel previews
3. **Create Production Database:**
   - Name: `valerie-invoice-production`
   - Purpose: Live production site

### **Step 2: Run Schema Setup**

For each new database, run your schema:

```sql
-- Copy from your existing database-schema.sql
-- Run in both staging and production databases
```

### **Step 3: Configure Vercel Environment Variables**

#### **For Preview Deployments (Staging)**
```bash
vercel env add POSTGRES_URL preview
# Paste your Neon staging connection string
```

#### **For Production Deployments**
```bash
vercel env add POSTGRES_URL production  
# Paste your Neon production connection string
```

#### **Feature Flags (Both Environments)**
```bash
vercel env add NEXT_PUBLIC_ENHANCED_VALIDATION true production
vercel env add NEXT_PUBLIC_IMPROVED_PDF true production
vercel env add NEXT_PUBLIC_ADVANCED_FORM true production

# Same for preview
vercel env add NEXT_PUBLIC_ENHANCED_VALIDATION true preview
vercel env add NEXT_PUBLIC_IMPROVED_PDF true preview
vercel env add NEXT_PUBLIC_ADVANCED_FORM true preview
```

## 🔒 **Security Best Practices**

1. **Different databases for each environment**
2. **Separate connection strings**
3. **No production data in staging**
4. **Read-only access for monitoring tools**

## 🚀 **Deployment Flow**

```
npm run prepare-production
     ↓
git push origin feature-branch
     ↓
Vercel creates preview → Staging DB
     ↓
Test preview thoroughly
     ↓
Merge to main → Production DB
```

## 📋 **Environment Variables Checklist**

### **Required for Both Preview & Production:**
- [ ] `POSTGRES_URL` (different for each environment)
- [ ] `NEXT_PUBLIC_ENHANCED_VALIDATION=true`
- [ ] `NEXT_PUBLIC_IMPROVED_PDF=true` 
- [ ] `NEXT_PUBLIC_ADVANCED_FORM=true`

### **Optional:**
- [ ] `NODE_ENV=production` (auto-set by Vercel)
- [ ] `NEXT_PUBLIC_ENV=production` (for custom logic)

## 💰 **Cost Considerations**

**Neon Free Tier Limits:**
- 3 databases (perfect for dev/staging/prod)
- 512 MB storage per database
- Should be plenty for invoice system

**If you exceed free tier:**
- Neon Pro: $19/month for all databases
- Still cheaper than managing separate services

## 🛠️ **Connection String Format**

Your Neon connection strings will look like:
```
postgresql://user:password@host.neon.tech/database_name?sslmode=require
```

## 🚨 **Common Issues & Solutions**

### **"Database doesn't exist" error:**
- Verify connection string is correct
- Ensure database was created in Neon console
- Check environment variable is set in Vercel

### **Permission denied:**
- Verify user has access to database
- Check connection string includes correct credentials

### **SSL errors:**
- Ensure `?sslmode=require` is in connection string
- Neon requires SSL connections

## 🎯 **Next Steps**

1. Create staging and production databases in Neon
2. Set up Vercel environment variables
3. Test with preview deployment
4. Deploy to production

**Total setup time: ~10 minutes** 