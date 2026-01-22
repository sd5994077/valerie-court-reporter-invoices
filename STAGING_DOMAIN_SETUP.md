# Setting Up Custom Staging Domain in Vercel

## Prerequisites
- You need to own a domain (or have access to DNS settings)
- Domain should be registered (e.g., through GoDaddy, Namecheap, Google Domains, etc.)

## Step-by-Step Guide

### Step 1: Choose Your Staging Domain

**Recommended:** Use a subdomain
- `staging.yourdomain.com`
- `staging.valerie-court-reporter-invoices.com`
- `test.yourdomain.com`

**Alternative:** Separate domain
- `valerie-staging.com`
- `valerie-test.com`

---

### Step 2: Add Domain in Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project: `valerie-court-reporter-invoices`

2. **Navigate to Domains:**
   - Click **Settings** tab (top navigation)
   - Click **Domains** in the left sidebar

3. **Add Domain:**
   - Click **"Add Domain"** button
   - Enter your staging domain (e.g., `staging.yourdomain.com`)
   - Click **"Add"**

---

### Step 3: Configure DNS Records

Vercel will show you DNS configuration options. Choose one:

#### Option A: CNAME Record (Easiest - Recommended)
- **Type:** CNAME
- **Name:** `staging` (or your subdomain)
- **Value:** `cname.vercel-dns.com`
- **TTL:** 3600 (or default)

#### Option B: A Record
- **Type:** A
- **Name:** `staging` (or your subdomain)
- **Value:** Vercel's IP addresses (Vercel will provide these)
- **TTL:** 3600

#### Option C: Use Vercel Nameservers (Best for full control)
- Replace your domain's nameservers with Vercel's
- Vercel will provide the nameserver addresses

**Where to add DNS records:**
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Find "DNS Management" or "DNS Settings"
- Add the record Vercel provides

---

### Step 4: Assign Domain to Staging Branch

1. **In Vercel Dashboard:**
   - Go to **Settings** → **Domains**
   - Find your newly added staging domain
   - Click on it to open domain settings

2. **Configure Branch Assignment:**
   - Look for **"Branch Assignment"** or **"Deployment Target"**
   - Select **`staging`** branch
   - Save changes

3. **Alternative Method:**
   - Go to **Settings** → **Git**
   - Look for branch-specific domain settings
   - Assign `staging` branch to your custom domain

---

### Step 5: Verify Setup

1. **Wait for DNS Propagation:**
   - DNS changes can take 5 minutes to 48 hours
   - Usually takes 5-15 minutes

2. **Test the Domain:**
   - Push a commit to `staging` branch:
     ```bash
     git checkout staging
     git commit --allow-empty -m "Test staging domain"
     git push origin staging
     ```

3. **Check Deployment:**
   - Go to **Deployments** tab in Vercel
   - Find the new staging deployment
   - It should show your custom staging domain

4. **Visit Your Staging URL:**
   - Go to: `https://staging.yourdomain.com`
   - Should show your staging deployment

---

## Troubleshooting

### Domain Not Working?
1. **Check DNS Propagation:**
   - Use: https://dnschecker.org
   - Enter your staging domain
   - Verify DNS records are propagated

2. **Check Vercel Domain Status:**
   - Go to **Settings** → **Domains**
   - Check if domain shows "Valid" or "Pending"
   - Red status = DNS not configured correctly

3. **Verify Branch Assignment:**
   - Make sure domain is assigned to `staging` branch
   - Not assigned to `main` or "All branches"

### SSL Certificate Issues?
- Vercel automatically provisions SSL certificates
- May take a few minutes after DNS is configured
- Check domain status in Vercel dashboard

---

## Example Configuration

**If your main domain is:** `valerie-court-reporter-invoices.com`

**Staging domain would be:** `staging.valerie-court-reporter-invoices.com`

**DNS Record:**
```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: 3600
```

**Result:**
- Production: `valerie-court-reporter-invoices.com` (main branch)
- Staging: `staging.valerie-court-reporter-invoices.com` (staging branch)
- Previews: Dynamic URLs per commit

---

## Benefits of Custom Staging Domain

✅ **Stable URL** - Same URL every time you deploy staging  
✅ **Easy to Share** - Give clients/stakeholders one URL  
✅ **Professional** - Looks more polished than random Vercel URLs  
✅ **Bookmarkable** - Can bookmark staging URL  
✅ **Environment-Specific** - Clear separation between staging and production  

---

## Quick Reference Commands

```bash
# Check current branch
git branch

# Switch to staging
git checkout staging

# Make a test commit to trigger deployment
git commit --allow-empty -m "Test staging domain deployment"
git push origin staging

# Check deployment status
# Visit: https://vercel.com/dashboard
```

---

## Next Steps After Setup

1. ✅ Test staging domain works
2. ✅ Verify iOS PDF fix works on staging
3. ✅ Test mobile overflow fix on staging
4. ✅ When ready, merge staging → main for production
