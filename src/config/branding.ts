export const brandingConfig = {
  business: {
    name: "Valerie De Leon, CSR #13025",
    tagline: "Professional Court Reporting Services", 
    type: "Legal Services",
    ownerName: "Valerie De Leon",
    licenseNumber: "#13025",
    licenseType: "CSR",
    email: "valeriedeleon.csr@gmail.com",
    phone: "(512) 555-0123",
    website: "www.valeriedeleon-csr.com",
    address: {
      street: "126 Old Settlers Drive",
      city: "San Marcos",
      state: "TX",
      zipCode: "78666"
    },
    payment: {
      venmoHandle: "ValerieDeLeon-CSR",
      acceptsChecks: true,
      checkPayableTo: "Valerie De Leon, CSR"
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
  ],
  invoice: {
    dueDays: 30,
    taxRate: 0,
    invoicePrefix: "VDL"
  },
  styling: {
    primaryColor: "#7C3AED", // Professional purple
    secondaryColor: "#A855F7", // Purple secondary
    accentColor: "#059669", // Green accent for payment sections
    logoText: "VDL CSR" // Professional branding
  }
};

export const getBranding = () => brandingConfig;

// Example configuration for Court Reporters:
export const courtReporterExample = {
  business: {
    name: "Jane Smith, CSR #12345",
    tagline: "Professional Court Reporting Services", 
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