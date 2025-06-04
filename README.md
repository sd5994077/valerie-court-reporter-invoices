# Professional Invoice System Template

A modern, responsive invoice management system template built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**. Perfect for **court reporters**, **consultants**, **freelancers**, and any professional service provider.

## 🚀 Features

### ✅ **Core Functionality**
- **Professional Invoice Creation** with comprehensive form validation
- **Sequential Invoice Numbering** (INV-YYYY-0001 format with yearly reset)
- **Invoice Review & Edit** with complete workflow management
- **Smart Dashboard** with enhanced sorting (Date → Status priority)
- **PDF Generation** ready for implementation
- **Mobile-First Design** with responsive layouts

### 📱 **Mobile Optimized**
- **Responsive Form Validation** with absolute positioning (no layout shifts)
- **Mobile Card View** for invoice tables
- **Touch-Friendly Interface** with proper mobile UX
- **Collapsible Navigation** optimized for mobile

### 📊 **Advanced Dashboard**
- **Smart Sorting**: Date (newest first) → Status Priority (Overdue → Pending → Complete → Closed)
- **Status Management** with visual indicators
- **Revenue Analytics** by location/category
- **Real-time Status Updates** with toast notifications

### 💼 **Business Features**
- **Client Management** with comprehensive contact information
- **Custom Fields** for industry-specific data (case names, counties, etc.)
- **Payment Integration** ready (Venmo QR codes, check payments)
- **Professional Branding** with configurable styling

## 🛠️ Quick Setup

### 1. **Clone & Install**
```bash
git clone [your-repo-url]
cd professional-invoice-system-template
npm install
```

### 2. **Configure Your Branding**
Edit `src/config/branding.ts`:

```typescript
export const brandingConfig = {
  business: {
    name: "Your Business Name",
    tagline: "Your Professional Tagline",
    ownerName: "Your Full Name",
    licenseNumber: "Your License #",
    licenseType: "License Type",
    email: "your.email@domain.com",
    phone: "Your Phone Number",
    address: {
      street: "Your Street Address",
      city: "Your City",
      state: "ST",
      zipCode: "ZIP"
    },
    payment: {
      venmoHandle: "Your-Venmo-Handle",
      checkPayableTo: "Your Business Name"
    }
  },
  serviceTypes: [
    "Service Type 1",
    "Service Type 2",
    // Add your services...
  ]
};
```

### 3. **Customize Industry Fields** (Optional)
Update form fields in `src/components/InvoiceForm.tsx` to match your industry:
- Case information for legal professionals
- Project details for consultants
- Custom billing categories

### 4. **Run Development Server**
```bash
npm run dev
```
Visit `http://localhost:3000`

## 🎨 **Customization Guide**

### **Colors & Styling**
- **Primary Color**: Update `primaryColor` in branding config
- **Logo**: Replace logo component in `src/components/Logo.tsx`
- **Styling**: Modify Tailwind classes throughout components

### **Industry-Specific Examples**

#### **Court Reporter Setup**
```typescript
const courtReporterConfig = {
  business: {
    name: "Jane Smith, CSR #12345",
    licenseType: "CSR",
    tagline: "Professional Court Reporting Services"
  },
  serviceTypes: [
    "Deposition", "Court Hearing", "Arbitration",
    "Examination Under Oath", "Transcript Preparation"
  ]
};
```

#### **Consultant Setup**
```typescript
const consultantConfig = {
  business: {
    name: "ABC Consulting LLC",
    licenseType: "Business License",
    tagline: "Strategic Business Solutions"
  },
  serviceTypes: [
    "Strategy Consulting", "Process Improvement",
    "Project Management", "Training & Development"
  ]
};
```

## 📁 **Project Structure**

```
professional-invoice-system-template/
├── pages/
│   ├── index.tsx              # Homepage
│   ├── create-invoice.tsx     # Invoice creation/editing
│   ├── review-invoice.tsx     # Invoice review & finalization
│   └── dashboard.tsx          # Revenue dashboard
├── src/
│   ├── components/
│   │   ├── InvoiceForm.tsx    # Main form component
│   │   ├── InvoiceReview.tsx  # Invoice preview
│   │   ├── RecentInvoices.tsx # Dashboard table with sorting
│   │   ├── MobileNavigation.tsx # Responsive navigation
│   │   └── Logo.tsx           # Customizable logo
│   ├── config/
│   │   └── branding.ts        # ⭐ Main configuration file
│   └── types/
│       └── invoice.ts         # TypeScript definitions
├── package.json
└── README.md
```

## 🔧 **Technology Stack**

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS for responsive design
- **TypeScript**: Full type safety
- **State Management**: React hooks with localStorage
- **PDF Generation**: html2pdf.js (ready for implementation)

## 📱 **Mobile Features**

### **Form Validation UX**
- **No Layout Shifts**: Error messages use absolute positioning
- **Touch-Friendly**: Optimized input sizes and spacing
- **Smart Validation**: Only validates on field blur, not while typing

### **Dashboard Sorting**
- **Default**: Date (newest first) → Status Priority
- **Status Order**: Overdue → Pending → Complete → Closed
- **Visual Feedback**: Clear sort indicators and status badges

### **Responsive Design**
- **Mobile Cards**: Invoice table becomes card layout on mobile
- **Touch Navigation**: Optimized mobile navigation with proper z-index
- **Responsive Images**: QR codes and signatures scale properly

## 🚀 **Ready for Production**

### **Database Integration**
The system is ready for database integration:
- Currently uses localStorage for development
- Database schema design included
- Easy migration path to PostgreSQL/MongoDB

### **Authentication Ready**
Prepared for user authentication:
- Multi-user support planned
- Role-based access ready
- OAuth integration prepared

### **Deployment Options**
- **Vercel**: Deploy with one click
- **Netlify**: Static site generation ready
- **Replit**: Database integration ready

## 📄 **Sample Industries**

This template works great for:
- **Court Reporters** (depositions, hearings, transcripts)
- **Consultants** (hourly billing, project-based)
- **Freelancers** (design, writing, development)
- **Legal Professionals** (case-based billing)
- **Healthcare Providers** (service-based billing)
- **Any Professional Service** requiring invoicing

## 🔄 **Data Flow**

1. **Invoice Creation**: Form data → localStorage validation
2. **Review Process**: Professional preview → Edit capability
3. **Finalization**: Database storage → PDF generation
4. **Dashboard**: Real-time analytics → Status management

## 📞 **Support & Customization**

Need help customizing for your industry? This template includes:
- ✅ Complete documentation
- ✅ Example configurations
- ✅ Industry-specific examples
- ✅ Mobile optimization guide

---

**Built with ❤️ for Professional Service Providers**

Transform your invoicing process with modern, mobile-first design and professional features. 