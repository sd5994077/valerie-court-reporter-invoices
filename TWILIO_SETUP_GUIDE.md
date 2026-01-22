# 📱 Twilio SMS Setup Guide

Complete guide for configuring Twilio SMS notifications in the Valerie Court Reporter Invoice System.

## 📋 Prerequisites

- Twilio account (sign up at https://www.twilio.com/try-twilio)
- Twilio phone number (obtained from Twilio Console)
- Access to environment variables on your hosting platform (Vercel, etc.)

---

## 🚀 Step-by-Step Setup

### 1️⃣ Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your email and phone number
4. Complete the onboarding questionnaire

**Free Trial Benefits:**
- $15.50 USD trial credit
- ~2,000 free SMS messages (US)
- Full API access with trial restrictions

---

### 2️⃣ Get a Twilio Phone Number

1. Log in to https://console.twilio.com
2. Navigate to **Phone Numbers** → **Manage** → **Buy a number**
3. Select your country (United States recommended)
4. Choose capabilities: Check **SMS** and **MMS**
5. Click **Search** and select a number
6. Click **Buy** to purchase the number

**Note:** Trial accounts can only send to verified phone numbers. Upgrade to send to any number.

---

### 3️⃣ Get Your Credentials

From the [Twilio Console Dashboard](https://console.twilio.com):

1. **Account SID**: Found in the main dashboard under "Account Info"
   - Format: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   
2. **Auth Token**: Click "View" next to Auth Token in "Account Info"
   - Format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   
3. **Twilio Phone Number**: From **Phone Numbers** → **Manage** → **Active numbers**
   - Format: `+15551234567` (E.164 format with country code)

---

### 4️⃣ Configure Environment Variables

Add these three environment variables to your `.env.local` file (for local development):

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM=+15551234567
```

**For Vercel/Production:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM`
4. Click **Save** and redeploy

---

### 5️⃣ Verify Trial Account Limitations

**Trial Account Restrictions:**
- ✅ Can send to verified phone numbers only
- ✅ All messages include trial warning prefix
- ❌ Cannot send to unverified numbers

**To verify a phone number (Trial):**
1. Go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
2. Click **+ Add a new Caller ID**
3. Enter the phone number in E.164 format (+15551234567)
4. Complete verification process

**To remove restrictions:**
- Upgrade account at https://console.twilio.com/billing/upgrade
- Minimum $20 USD initial balance

---

## ✅ Testing Your Setup

### Test via Admin Panel

1. Navigate to `/admin-notifications` in your application
2. Scroll to "🧪 Test Twilio SMS Configuration" section
3. Enter a phone number in E.164 format: `+15551234567`
4. Click **Send Test SMS**
5. Check for success message with Message SID

### Test via API (Alternative)

```bash
curl -X POST http://localhost:3000/api/notifications/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15551234567"}'
```

**Expected Response:**
```json
{
  "success": true,
  "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "to": "+15551234567",
  "from": "+15559876543",
  "status": "queued"
}
```

---

## 📞 Phone Number Format (E.164)

All phone numbers **must** be in E.164 format:

**Format:** `+[country code][number]`

### Examples:
- ✅ **US:** `+15551234567` (country code: 1)
- ✅ **UK:** `+447911123456` (country code: 44)
- ✅ **Canada:** `+14165551234` (country code: 1)
- ❌ **Invalid:** `5551234567` (missing +1)
- ❌ **Invalid:** `(555) 123-4567` (formatting not allowed)
- ❌ **Invalid:** `15551234567` (missing +)

---

## 💰 Cost Estimate

**Current Twilio Pricing (US):**
- SMS (Outbound): $0.0079 per message
- Phone Number: $1.15/month

**Example Usage Costs:**
- 10 notifications/day × 30 days = 300 messages/month = **$2.37 USD**
- Phone number rental = **$1.15 USD**
- **Total: ~$3.50/month**

**Cost tracking:** The system logs estimated costs in console after each batch send.

---

## 🔧 Troubleshooting

### Error: "Twilio credentials not configured"

**Solution:** Ensure all three environment variables are set:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`

Restart your development server after adding environment variables.

---

### Error: "Permission to send an SMS has not been enabled"

**Solution:** 
1. Check that your Twilio phone number has SMS capability
2. Verify the number in **Phone Numbers** → **Active numbers** has "SMS" checked

---

### Error: "The number +1XXXXXXXXXX is unverified"

**Solution:** 
- **Trial accounts only:** Verify the recipient's phone number in Twilio Console
- **OR** upgrade your Twilio account to send to any number

---

### Error: "Invalid phone number format"

**Solution:** 
- Ensure number is in E.164 format: `+15551234567`
- Must start with `+`
- Must include country code
- No spaces, dashes, or parentheses

---

### Messages not delivering

**Check:**
1. Message status in [Twilio Logs](https://console.twilio.com/monitor/logs/sms)
2. Recipient's phone number is correct and active
3. Trial account sending to verified numbers only
4. Account has sufficient balance

---

## 🔐 Security Best Practices

### ✅ DO:
- Store credentials in environment variables (never in code)
- Use `.env.local` for local development (add to `.gitignore`)
- Rotate Auth Token periodically
- Enable two-factor authentication on Twilio account
- Monitor usage in Twilio Console to detect anomalies

### ❌ DON'T:
- Commit credentials to version control
- Share Auth Token publicly
- Use production credentials in development
- Disable Twilio's fraud detection features

---

## 📊 Monitoring & Analytics

### Twilio Console:
- **Monitor** → **Logs** → **SMS**: View all sent messages
- **Monitor** → **Insights**: Analytics and delivery rates
- **Billing**: Track usage and costs

### Application Logs:
- Check server console for SMS send logs
- Each message logged with SID for tracking
- Estimated costs logged per batch

---

## 🔄 Upgrading from Trial

1. Go to https://console.twilio.com/billing/upgrade
2. Add payment method
3. Add initial balance ($20 minimum)
4. Remove trial restrictions immediately
5. Send to any phone number worldwide

---

## 📚 Additional Resources

- [Twilio SMS Quickstart](https://www.twilio.com/docs/sms/quickstart)
- [E.164 Phone Number Formatting](https://www.twilio.com/docs/glossary/what-e164)
- [Twilio Console](https://console.twilio.com)
- [Twilio Status Page](https://status.twilio.com)
- [Twilio Support](https://support.twilio.com)

---

## 🆘 Need Help?

If you encounter issues not covered here:
1. Check [Twilio Status Page](https://status.twilio.com) for outages
2. Review logs in Twilio Console → Monitor → Logs
3. Contact Twilio Support (Trial accounts have email support)
4. Check application server logs for detailed error messages

---

**Last Updated:** January 2026
