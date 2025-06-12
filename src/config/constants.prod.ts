export const BUSINESS_CONFIG = {
  name: "Valerie De Leon, CSR #13025",
  address: "126 Old Settlers Drive, San Marcos, TX 78666",
  phone: "(512) 555-0123", // Update with real number
  email: "valeriedeleon.csr@gmail.com",
  website: "www.valeriedeleon-csr.com", // Update with real website
  
  // Database connection - will use POSTGRES_URL from Vercel
  databaseUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  
  // Invoice settings
  invoicePrefix: "VDL",
  
  // Signature path - production signature
  signaturePath: "/signature-production.png"
}; 