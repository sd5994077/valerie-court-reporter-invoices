import { sql } from '@vercel/postgres';

/**
 * Database connection utility using Neon PostgreSQL via Vercel
 * Automatically uses POSTGRES_URL from environment variables
 */

export { sql };

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    return { success: true, time: result.rows[0].current_time };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Initialize database tables
 * Creates all necessary tables for invoices, appeals, and admin functionality
 */
export async function initializeTables() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        business_name VARCHAR(255),
        license_number VARCHAR(100),
        license_type VARCHAR(50),
        phone VARCHAR(20),
        website VARCHAR(255),
        venmo_handle VARCHAR(100),
        address_street TEXT,
        address_city VARCHAR(100),
        address_state VARCHAR(10),
        address_zip VARCHAR(20),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Invoices table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        due_date DATE,
        
        -- Client information
        client_name VARCHAR(255),
        client_company VARCHAR(255),
        client_address TEXT,
        client_email VARCHAR(255),
        client_phone VARCHAR(20),
        
        -- Case/Project information
        case_name VARCHAR(255),
        cause_number VARCHAR(255),
        county VARCHAR(100),
        date_of_hearing DATE,
        service_type VARCHAR(50),
        description TEXT,
        comments TEXT,
        
        -- Financial data
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        
        -- Status and metadata
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        pdf_generated BOOLEAN DEFAULT false,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finalized_at TIMESTAMP,
        
        -- Ensure unique invoice numbers per user
        UNIQUE(user_id, invoice_number)
      )
    `;

    // Line items table
    await sql`
      CREATE TABLE IF NOT EXISTS line_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
        item_number INTEGER,
        description TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        rate DECIMAL(10,2) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Invoice sequences table
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_sequences (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        last_number INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, year)
      )
    `;

    // Appeals table
    await sql`
      CREATE TABLE IF NOT EXISTS appeals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        requester_name VARCHAR(255),
        requester_email VARCHAR(255),
        requester_phone VARCHAR(50),
        requester_address TEXT,
        court_of_appeals_number VARCHAR(100),
        trial_court_case_number VARCHAR(100),
        style TEXT,
        appeal_deadline DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Intake',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `;

    // Appeal extensions table
    await sql`
      CREATE TABLE IF NOT EXISTS appeal_extensions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appeal_id UUID REFERENCES appeals(id) ON DELETE CASCADE,
        requested_on DATE NOT NULL,
        days_granted INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON invoices(user_id, date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(status, date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON line_items(invoice_id, order_index)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appeals_user_status ON appeals(user_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appeals_deadline ON appeals(appeal_deadline)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appeal_extensions_appeal ON appeal_extensions(appeal_id)`;

    return { success: true, message: 'All tables created successfully' };
  } catch (error) {
    console.error('Failed to initialize tables:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if tables exist
 */
export async function checkTables() {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    return {
      success: true,
      tables: result.rows.map(row => row.table_name)
    };
  } catch (error) {
    console.error('Failed to check tables:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tables: []
    };
  }
}
