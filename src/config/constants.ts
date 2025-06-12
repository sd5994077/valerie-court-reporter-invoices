export const BUSINESS_CONFIG = {
  name: "Valerie De Leon, CSR #13025",
  address: "126 Old Settlers Drive, San Marcos, TX 78666",
  phone: "(555) 123-4567",
  email: "valeriedeleon.csr@gmail.com",
  website: "www.valeriedeleon-csr.com",
  
  // Database connection
  // For testing, you can use a separate test database
  databaseUrl:  process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/production_invoices',
  
  // Invoice settings
  invoicePrefix: "VDL",
  
  // Signature path
  signaturePath: "/signature-production.png"
}; 