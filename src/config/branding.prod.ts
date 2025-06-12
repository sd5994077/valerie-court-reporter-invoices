export const brandingConfig = {
  business: {
    name: "Valerie De Leon, CSR #13025",
    tagline: "Professional Court Reporting Services", 
    type: "Legal Services",
    ownerName: "Valerie De Leon",
    licenseNumber: "#13025",
    licenseType: "CSR",
    email: "valeriedeleon.csr@gmail.com",
    phone: "(512) 555-0123", // Update with real number
    website: "www.valeriedeleon-csr.com", // Update with real website
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
    secondaryColor: "#A855F7",
    accentColor: "#059669", // Green accent for payment sections
    logoText: "VDL-CSR"
  }
};

export const getBranding = () => brandingConfig; 