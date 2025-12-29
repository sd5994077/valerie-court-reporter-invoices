# 🚀 Quick Setup Guide

## Step 1: Configure Your Business Information

Edit `src/config/branding.ts` with your business details:

### Court Reporter Example:
```typescript
export const brandingConfig = {
  business: {
    name: "Sarah Johnson, CSR #98765",
    tagline: "Professional Court Reporting Services",
    type: "Legal Services",
    ownerName: "Sarah Johnson",
    licenseNumber: "#98765",
    licenseType: "CSR",
    email: "sarah.johnson@csr-services.com",
    phone: "(555) 987-6543",
    website: "www.sarahjohnson-csr.com",
    address: {
      street: "456 Legal Center Dr",
      city: "Dallas",
      state: "TX",
      zipCode: "75201"
    },
    payment: {
      venmoHandle: "SarahJohnson-CSR",
      acceptsChecks: true,
      checkPayableTo: "Sarah Johnson, CSR"
    }
  },
  serviceTypes: [
    "Deposition",
    "Court Hearing",
    "Arbitration",
    "Examination Under Oath",
    "Statement Under Oath",
    "Transcript Preparation",
    "Other Services"
  ]
};
```

### Consultant Example:
```typescript
export const brandingConfig = {
  business: {
    name: "Strategic Solutions LLC",
    tagline: "Transforming Business Through Strategy",
    type: "Business Consulting",
    ownerName: "Michael Chen",
    licenseNumber: "LLC-123456",
    licenseType: "Business License",
    email: "michael@strategicsolutions.com",
    phone: "(555) 123-8901",
    website: "www.strategicsolutions.com",
    address: {
      street: "789 Business Plaza",
      city: "Seattle",
      state: "WA",
      zipCode: "98101"
    },
    payment: {
      venmoHandle: "StrategicSolutions",
      acceptsChecks: true,
      checkPayableTo: "Strategic Solutions LLC"
    }
  },
  serviceTypes: [
    "Strategy Consulting",
    "Process Improvement",
    "Project Management",
    "Training & Development",
    "Business Analysis",
    "Change Management",
    "Other Consulting"
  ]
};
```

### Freelancer Example:
```typescript
export const brandingConfig = {
  business: {
    name: "Creative Design Studio",
    tagline: "Bringing Your Vision to Life",
    type: "Creative Services",
    ownerName: "Jessica Martinez",
    licenseNumber: "DBA-789012",
    licenseType: "DBA",
    email: "jessica@creativedesignstudio.com",
    phone: "(555) 456-7890",
    website: "www.creativedesignstudio.com",
    address: {
      street: "321 Art District Ave",
      city: "Portland",
      state: "OR",
      zipCode: "97201"
    },
    payment: {
      venmoHandle: "CreativeDesignStudio",
      acceptsChecks: true,
      checkPayableTo: "Creative Design Studio"
    }
  },
  serviceTypes: [
    "Logo Design",
    "Website Design",
    "Branding Package",
    "Print Design",
    "Digital Marketing",
    "Consultation",
    "Other Design Services"
  ]
};
```

## Step 2: Customize Your Logo

### Option A: Replace Logo Component
Edit `src/components/Logo.tsx` to use your own logo:

```typescript
export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <img 
      src="/your-logo.png" 
      alt="Your Business Name"
      className={className}
    />
  );
};
```

### Option B: Use Text-Based Logo
Keep the SVG but customize the text and colors:

```typescript
// In branding.ts
styling: {
  primaryColor: "#your-color", // Change the color
  logoText: "YBS" // Your business initials
}
```

## Step 3: Customize Form Fields (Optional)

### For Legal Professionals:
In `src/components/InvoiceForm.tsx`, you might want fields like:
- Case Number
- Court Name  
- Judge Name
- Attorney Names
- Proceeding Type

### For Consultants:
- Project Name
- Client Department
- Project Phase
- Billing Category
- Contract Number

### For Creative Services:
- Project Type
- Deliverables
- Revision Round
- Usage Rights
- Project Timeline

## Step 4: Set Up Payment Information

### Venmo QR Code:
1. Generate your Venmo QR code
2. Save as `public/venmo-qr.png`
3. Update the path in `InvoiceReview.tsx`

### Check Payments:
Update your mailing address in the branding config

## Step 5: Test Your Setup

```bash
npm run dev
```

1. Create a test invoice
2. Verify all your business information appears correctly
3. Test the mobile layout
4. Check payment information display

## Step 6: Deploy

### Vercel (Recommended):
```bash
npm install -g vercel
vercel
```

#### Vercel Environment Variables (Optional but Recommended):
For staging/production environment detection:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:
   - **Preview deployments:** `NEXT_PUBLIC_ENV` = `staging`
   - **Production:** `NEXT_PUBLIC_ENV` = `production`

Then in your code, you can use environment-specific behavior:
```typescript
// Example: Show different UI or enable test features in staging
if (process.env.NEXT_PUBLIC_ENV === "staging") {
  // test-only UI, banners, logging, fake data, etc
  console.log("Running in staging mode");
  // Show staging banner, enable debug logs, etc.
}

// Example: Different API endpoints
const apiUrl = process.env.NEXT_PUBLIC_ENV === "staging" 
  ? "https://staging-api.example.com"
  : "https://api.example.com";
```

### Netlify:
```bash
npm run build
# Upload dist folder to Netlify
```

## 🔧 Advanced Customization

### Colors:
Update Tailwind config or use CSS variables for brand colors

### Industry-Specific Features:
- Add custom validation rules
- Modify the invoice template layout
- Add industry-specific calculations
- Integrate with industry tools

### Database Integration:
When ready, the system is prepared for:
- PostgreSQL
- MongoDB  
- Supabase
- Firebase

### Authentication:
Add user authentication with:
- Auth0
- Firebase Auth
- NextAuth.js
- Supabase Auth

---

**🎯 Your Professional Invoice System is Ready!**

Need help with customization? Check the main README.md for detailed documentation. 