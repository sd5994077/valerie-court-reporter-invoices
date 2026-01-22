# Vercel Deployment Guide

## Current Situation
- **iOS PDF fix** is on `staging` branch (commit `0c496fd`)
- **Mobile overflow fix** is on `staging` branch (commit `9784936`)
- **Production URL**: https://valerie-court-reporter-invoices-5an17hol8.vercel.app/
- **Main branch** does NOT have these fixes yet

## Option 1: Merge Staging → Main (RECOMMENDED)

This will make all fixes live on your production URL.

### Step-by-step:

1. **Merge staging to main locally:**
   ```bash
   git checkout main
   git pull origin main
   git merge staging
   git push origin main
   ```

2. **Vercel will auto-deploy:**
   - Vercel watches your `main` branch
   - It will automatically deploy within 1-2 minutes
   - You'll get a notification when deployment completes

3. **Verify deployment:**
   - Visit: https://valerie-court-reporter-invoices-5an17hol8.vercel.app/
   - Check the deployment in Vercel dashboard: https://vercel.com/sd5994077s-projects/valerie-court-reporter-invoices

---

## Option 2: Deploy Staging Branch Directly in Vercel

If you want to test staging separately before merging to main:

### Step-by-step in Vercel Dashboard:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/
   - Log in
   - Click on your project: `valerie-court-reporter-invoices`

2. **Go to Settings:**
   - Click "Settings" tab at top
   - Click "Git" in the left sidebar

3. **Change Production Branch:**
   - Find "Production Branch" section
   - Change from `main` to `staging`
   - Click "Save"

4. **Trigger Deployment:**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - OR just push any commit to staging (already done!)

5. **Wait for deployment:**
   - Watch the deployment logs
   - Takes 1-2 minutes
   - Green checkmark = success

---

## What's Fixed:

### 1. ✅ iOS PDF Download Issue
- **Before:** Spinning infinitely, download didn't work
- **After:** PDF opens in new Safari tab, user can tap share button to save
- **Files changed:** 
  - `src/components/InvoiceReview.tsx`
  - `src/components/RecentInvoices.tsx`
  - `pages/view-invoice.tsx`
  - `ERROR_LOG.md`

### 2. ✅ Mobile Horizontal Overflow
- **Before:** Page could shift left/right when swiping on mobile
- **After:** Page is locked, no horizontal movement
- **Files changed:**
  - `src/styles/globals.css` - Added `overflow-x: hidden`
  - `pages/_document.tsx` - Added viewport meta tag

---

## Testing After Deployment:

### Test iOS PDF Download:
1. Open site on iPhone/iPad Safari
2. Create or view an invoice
3. Click "Download PDF" button
4. PDF should open in new tab (not download)
5. Tap Safari's share button → "Save to Files" or "Print"

### Test Mobile Overflow:
1. Open site on any mobile device
2. Try swiping left/right on any page
3. Page should NOT shift or show white space on sides
4. Content should stay locked in viewport

---

## Quick Commands Reference:

```bash
# Check current branch
git branch

# Switch to main
git checkout main

# Merge staging into main
git merge staging

# Push to GitHub (triggers Vercel deploy)
git push origin main

# Check deployment status
# Visit: https://vercel.com/sd5994077s-projects/valerie-court-reporter-invoices
```

---

## Commits on Staging (Not Yet on Main):

1. `9784936` - Fix mobile horizontal overflow ✅ (JUST ADDED)
2. `0c496fd` - Fix iOS PDF download issue ✅
3. `7d99020` - Update AppealCard to compact view
4. `41546ef` - Fix mobile modal scrolling
5. `86e958e` - Add tester guide
6. `ae88854` - Add Vercel environment variables docs
7. `1fb653c` - Staging initial preview deployment

**All of these will go live when you merge staging → main.**
