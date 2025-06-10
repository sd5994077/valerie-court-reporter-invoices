export const brandingConfig = {
  business: {
    name: "[TEST] Your Business Name [TEST]",
    tagline: "[TEST ENVIRONMENT] Your Professional Tagline", 
    type: "[Service Type]",
    ownerName: "[Your Full Name]",
    licenseNumber: "[Your License #]",
    licenseType: "[License Type]",
    email: "[your.email@domain.com]",
    phone: "[Your Phone Number]",
    website: "[www.yourbusiness.com]",
    address: {
      street: "[Your Street Address]",
      city: "[Your City]",
      state: "[ST]",
      zipCode: "[ZIP]"
    },
    payment: {
      venmoHandle: "[Your-Venmo-Handle]",
      acceptsChecks: true,
      checkPayableTo: "[Your Business Name]"
    }
  },
  serviceTypes: [
    "[Service Type 1]",
    "[Service Type 2]", 
    "[Service Type 3]",
    "[Service Type 4]",
    "[Service Type 5]",
    "[Service Type 6]",
    "[Other Services]"
  ],
  invoice: {
    dueDays: 30,
    taxRate: 0,
    invoicePrefix: "TEST"
  },
  styling: {
    primaryColor: "#EA580C", // Orange theme for test environment
    secondaryColor: "#FB923C",
    accentColor: "#DC2626", // Red accent for test visibility
    logoText: "[TEST]" // Clear test indicator
  }
};

export const getBranding = () => brandingConfig;

// Example configuration for Court Reporters:
export const courtReporterExample = {
  business: {
    name: "[TEST] Jane Smith, CSR #12345",
    tagline: "[TEST] Professional Court Reporting Services", 
    type: "Legal Services",
    ownerName: "Jane Smith",
    licenseNumber: "#12345",
    licenseType: "CSR",
    email: "jane.smith.csr@example.com",
    phone: "(555) 123-4567",
    website: "www.janesmith-csr.com",
    address: {
      street: "123 Legal Plaza",
      city: "Austin",
      state: "TX",
      zipCode: "78701"
    },
    payment: {
      venmoHandle: "JaneSmith-CSR",
      acceptsChecks: true,
      checkPayableTo: "Jane Smith, CSR"
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