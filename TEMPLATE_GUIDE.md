# Template Customization Guide

This invoice system is designed as a universal template that can be easily customized for any professional service business. Here's how to adapt it for different clients.

## Quick Start for New Clients

### 1. Basic Information Update
Edit `src/config/branding.ts` and update these key sections:

```typescript
business: {
  name: "Your Client's Business Name",
  tagline: "Their Professional Tagline", 
  type: "Their Industry Type",
  ownerName: "Owner Name",
  email: "client@email.com",
  // ... other details
}
```

### 2. Choose a Business Template
Use one of the pre-built templates:

```typescript
import { businessTemplates } from './src/config/branding';

// For a consultant:
const consultantConfig = businessTemplates.consultant;

// For a designer:
const designerConfig = businessTemplates.designer;

// For a developer:
const developerConfig = businessTemplates.developer;
```

## Business Type Examples

### Court Reporter (Current - Valerie)
- **Services**: Depositions, Court Hearings, Transcripts
- **Color Scheme**: Purple (#7C3AED)
- **License**: CSR #1111
- **Payment**: Venmo, Check
- **Service Areas**: Texas Counties

### Consultant
- **Services**: Strategy, Implementation, Training
- **Color Scheme**: Blue (#2563EB)
- **License**: Business License
- **Payment**: Wire Transfer, Check, PayPal
- **Service Areas**: Remote/Nationwide

### Graphic Designer
- **Services**: Logo Design, Web Design, Branding
- **Color Scheme**: Red (#DC2626)
- **License**: Business License
- **Payment**: PayPal, Stripe, Check
- **Service Areas**: Remote/Local

### Web Developer
- **Services**: Web Development, Mobile Apps, APIs
- **Color Scheme**: Green (#059669)
- **License**: Business License
- **Payment**: Stripe, PayPal, Wire
- **Service Areas**: Remote/Worldwide

### Attorney
- **Services**: Legal Consultation, Document Review
- **Color Scheme**: Dark Gray (#1F2937)
- **License**: Bar License
- **Payment**: Trust Account, Check, Wire
- **Service Areas**: State/Local

## Customization Steps

### Step 1: Business Information
```typescript
business: {
  name: "Jane Smith, CPA",
  tagline: "Professional Accounting Services",
  type: "Accounting",
  ownerName: "Jane Smith",
  licenseNumber: "CPA-12345",
  licenseType: "CPA",
  email: "jane@smithcpa.com",
  phone: "(555) 123-4567",
  website: "www.smithcpa.com",
}
```

### Step 2: Service Types
```typescript
serviceTypes: [
  // For CPA:
  "Tax Preparation",
  "Bookkeeping", 
  "Financial Planning",
  "Audit Services",
  "Consultation",
  
  // For Photographer:
  "Wedding Photography",
  "Portrait Session",
  "Event Photography", 
  "Photo Editing",
  "Travel Fee",
  
  // For Contractor:
  "Design Consultation",
  "Project Management",
  "Installation",
  "Materials",
  "Labor"
]
```

### Step 3: Visual Branding
```typescript
theme: {
  primaryColor: "#your-brand-color",
  secondaryColor: "#complementary-color",
  accentColor: "#accent-color",
  // ... other theme options
}
```

### Step 4: Payment Methods
```typescript
payment: {
  methods: {
    // Enable relevant payment methods:
    stripe: true,        // For online payments
    paypal: "business@email.com",
    venmo: "@username",
    zelle: "email@domain.com",
    cashapp: "$username",
    // check: true,      // For check payments
    // wire: true,       // For wire transfers
  },
  terms: "Net 15",      // Or Net 30, Due on Receipt
  currency: "USD",      // Or CAD, EUR, etc.
}
```

### Step 5: Geographic Areas
```typescript
serviceAreas: [
  // Local business:
  "Austin, TX",
  "Round Rock, TX", 
  "Cedar Park, TX",
  
  // Regional:
  "Texas",
  "Oklahoma",
  "Louisiana",
  
  // Remote:
  "Remote - Worldwide",
  "United States",
  "North America"
]
```

## Advanced Customization

### Custom Components
Create business-specific components in `src/components/custom/`:

```typescript
// src/components/custom/PhotographyInvoice.tsx
// Custom invoice layout for photographers

// src/components/custom/LegalInvoice.tsx  
// Custom invoice layout for attorneys

// src/components/custom/ConsultingInvoice.tsx
// Custom invoice layout for consultants
```

### Industry-Specific Features
Enable/disable features based on business needs:

```typescript
features: {
  clientManagement: true,     // Most businesses
  projectTracking: true,      // Consultants, developers
  timeTracking: true,         // Hourly billing
  expenseTracking: true,      // Contractors, consultants
  recurringInvoices: true,    // Subscription services
  multiCurrency: true,        // International businesses
  paymentIntegration: true,   // Online businesses
}
```

### Custom Fields
Add industry-specific fields:

```typescript
// For legal services:
customFields: {
  caseNumber: "Case #2023-CV-001",
  courtName: "District Court",
  opposingCounsel: "Smith & Associates"
}

// For photography:
customFields: {
  eventDate: "2024-06-15",
  eventType: "Wedding",
  location: "Austin Country Club"
}

// For consulting:
customFields: {
  projectCode: "PROJ-2024-001", 
  projectManager: "John Doe",
  deliverables: "Strategy Document"
}
```

## File Structure for Templates

```
templates/
├── court-reporter/          # Valerie's current setup
├── consultant/              # Business consultant template
├── designer/                # Graphic designer template  
├── developer/               # Web developer template
├── attorney/                # Attorney template
├── photographer/            # Photography template
├── contractor/              # General contractor template
└── accountant/              # CPA/Accountant template
```

## Deployment for Each Client

### Option 1: Separate Repositories
- Fork the main template
- Customize for each client
- Deploy to separate Replit instances

### Option 2: Multi-tenant
- Single codebase
- Client selection at login
- Shared database with client isolation

### Option 3: White Label
- Remove template branding
- Add client's branding
- Provide as SaaS solution

## Pricing Tiers

### Basic Template ($X)
- Core invoice functionality
- Basic customization
- Standard payment methods
- Email support

### Professional Template ($X)
- Advanced features
- Custom branding
- Multiple payment integrations
- Priority support

### Enterprise Template ($X)
- Full customization
- Custom development
- Training and setup
- Ongoing support

## Support and Maintenance

### Template Updates
- Core functionality improvements
- Security updates
- New feature additions
- Bug fixes

### Client-Specific Support
- Customization assistance
- Training sessions
- Technical support
- Feature requests

## Getting Started Checklist

- [ ] Clone template repository
- [ ] Update `src/config/branding.ts`
- [ ] Replace logo and assets in `public/`
- [ ] Test invoice generation
- [ ] Configure payment methods
- [ ] Set up database
- [ ] Deploy to Replit
- [ ] Train client on usage
- [ ] Provide documentation

This template system allows you to quickly customize and deploy professional invoice systems for any type of service business! 