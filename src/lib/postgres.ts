import { Pool, PoolClient, QueryResult } from 'pg';

// Create PostgreSQL connection pool
let pool: Pool;

const poolConfig: any = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'postgres',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    };

if (
    process.env.POSTGRES_SSL === 'true' || 
    (process.env.POSTGRES_HOST && process.env.POSTGRES_HOST.includes('amazonaws.com')) ||
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('amazonaws.com'))
) {
    poolConfig.ssl = {
        rejectUnauthorized: false,
    };
}

if (process.env.NODE_ENV === 'production') {
    pool = new Pool(poolConfig);
} else {
    let globalWithPool = global as typeof globalThis & {
        _postgresPool2?: Pool;
    };
    if (!globalWithPool._postgresPool2) {
        globalWithPool._postgresPool2 = new Pool(poolConfig);
    }
    pool = globalWithPool._postgresPool2;
}

// Initialize database schema
async function initializeDatabase(): Promise<void> {
    const client: PoolClient = await pool.connect();
    
    try {
        // Create SkillKendra Schema if not exists
        await client.query(`CREATE SCHEMA IF NOT EXISTS skillkendra;`);

        // Create candidates table
        await client.query(`
            CREATE TABLE IF NOT EXISTS skillkendra.candidates (
                candidate_id SERIAL PRIMARY KEY,
                candidate_name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone_number VARCHAR(20),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Create uploaded_certificates table
        await client.query(`
            CREATE TABLE IF NOT EXISTS skillkendra.uploaded_certificates (
                uploaded_certificate_id SERIAL PRIMARY KEY,
                candidate_id INT REFERENCES skillkendra.candidates(candidate_id),
                file_url TEXT,
                file_name VARCHAR(255),
                file_size INT,
                file_type VARCHAR(50),
                storage_provider VARCHAR(50),
                uploaded_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Create extractions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS skillkendra.extractions (
                extraction_id SERIAL PRIMARY KEY,
                uploaded_certificate_id INT REFERENCES skillkendra.uploaded_certificates(uploaded_certificate_id),
                certificate_id VARCHAR(100),
                verification_link TEXT,
                issuer_org_name VARCHAR(255),
                issuer_org_domain VARCHAR(255),
                confidence_score FLOAT,
                course_name TEXT,
                issue_date TEXT,
                extracted_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Create validations table
        await client.query(`
            CREATE TABLE IF NOT EXISTS skillkendra.validations (
                validation_id SERIAL PRIMARY KEY,
                uploaded_certificate_id INT REFERENCES skillkendra.uploaded_certificates(uploaded_certificate_id),
                verification_status VARCHAR(50),
                validation_certificate_link TEXT,
                validated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Create kyc_documents table
        await client.query(`
            CREATE TABLE IF NOT EXISTS skillkendra.kyc_documents (
                id SERIAL PRIMARY KEY,
                candidate_id INT REFERENCES skillkendra.candidates(candidate_id),
                session_id VARCHAR(100) UNIQUE,
                candidate_name VARCHAR(100),
                candidate_email VARCHAR(150),
                candidate_phone VARCHAR(15),
                status VARCHAR(20) DEFAULT 'pending',
                requested_docs JSONB,
                aadhaar_data JSONB,
                aadhaar_photo_file VARCHAR(255),
                aadhaar_pdf_file VARCHAR(255),
                aadhaar_fetched_at TIMESTAMPTZ,
                pan_data JSONB,
                pan_pdf_file VARCHAR(255),
                pan_fetched_at TIMESTAMPTZ,
                dl_data JSONB,
                dl_pdf_file VARCHAR(255),
                dl_fetched_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Create KYC_audit_log table
        await client.query(`
            CREATE TABLE IF NOT EXISTS skillkendra.kyc_audit_log (
                id SERIAL PRIMARY KEY,
                candidate_id INT,
                session_id VARCHAR(100),
                event VARCHAR(100) NOT NULL,
                details JSONB DEFAULT '{}'::jsonb,
                ip_address VARCHAR(50),
                user_agent VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        console.log('✓ Database schema initialized successfully');
    } catch (error: any) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Interfaces
export interface KYCDocument {
    id: number;
    candidate_id: number;
    session_id: string;
    candidate_name: string;
    candidate_email: string;
    candidate_phone: string;
    status: string;
    requested_docs: any;
    aadhaar_data?: any;
    pan_data?: any;
    dl_data?: any;
    created_at: Date;
    updated_at: Date;
}

interface SessionData {
    id: string;
    candidateId: number;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    requestedDocs?: string[];
}

interface AuditData {
    candidate_id?: number | null;
    session_id?: string | null;
    event: string;
    details?: any;
    ip_address?: string | null;
    user_agent?: string | null;
}

// Session operations
export async function createSession(sessionData: SessionData): Promise<KYCDocument> {
    await ensureSchema();
    
    // First try to update an existing session
    const updateQuery = `
        UPDATE skillkendra.kyc_documents SET
            candidate_name = $1,
            candidate_email = $2,
            candidate_phone = $3,
            requested_docs = $4,
            updated_at = NOW()
        WHERE session_id = $5
        RETURNING *
    `;
    const updateValues = [
        sessionData.name || 'Unknown',
        sessionData.email || '',
        sessionData.phone || '',
        JSON.stringify(sessionData.requestedDocs || []),
        sessionData.id
    ];
    
    let result: QueryResult<KYCDocument> = await pool.query(updateQuery, updateValues);
    
    // If no row was updated, insert a new one
    if (result.rowCount === 0) {
        const insertQuery = `
            INSERT INTO skillkendra.kyc_documents (
                candidate_id, session_id, candidate_name, candidate_email, 
                candidate_phone, status, requested_docs, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING *
        `;
        const insertValues = [
            session_data_id_to_num(sessionData.candidateId),
            sessionData.id,
            sessionData.name || 'Unknown',
            sessionData.email || '',
            sessionData.phone || '',
            sessionData.status || 'pending',
            JSON.stringify(sessionData.requestedDocs || [])
        ];
        
        result = await pool.query(insertQuery, insertValues);
    }
    
    return result.rows[0];
}

function session_data_id_to_num(id: any): number {
    if (typeof id === 'number') return id;
    if (typeof id === 'string') return parseInt(id, 10);
    return 0;
}

export async function updateSessionStatus(sessionId: string, status: string): Promise<KYCDocument> {
    await ensureSchema();
    const query = `
        UPDATE skillkendra.kyc_documents 
        SET status = $1, updated_at = NOW() 
        WHERE session_id = $2
        RETURNING *
    `;
    const result: QueryResult = await pool.query(query, [status.toLowerCase(), sessionId]);
    return result.rows[0];
}

export async function getSession(sessionId: string): Promise<KYCDocument | null> {
    await ensureSchema();
    const query = 'SELECT * FROM skillkendra.kyc_documents WHERE session_id = $1';
    const result: QueryResult = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
}

export async function saveDocument(sessionId: string, docType: string, data: any): Promise<KYCDocument> {
    await ensureSchema();
    let query: string;
    
    if (docType === 'aadhaar') {
        query = `
            UPDATE skillkendra.kyc_documents
            SET aadhaar_data = $1, aadhaar_fetched_at = NOW(), updated_at = NOW()
            WHERE session_id = $2
            RETURNING *
        `;
    } else if (docType === 'pan') {
        query = `
            UPDATE skillkendra.kyc_documents
            SET pan_data = $1, pan_fetched_at = NOW(), updated_at = NOW()
            WHERE session_id = $2
            RETURNING *
        `;
    } else if (docType === 'driving_license') {
        query = `
            UPDATE skillkendra.kyc_documents
            SET dl_data = $1, dl_fetched_at = NOW(), updated_at = NOW()
            WHERE session_id = $2
            RETURNING *
        `;
    } else {
        throw new Error(`Unsupported document type: ${docType}`);
    }
    
    const result: QueryResult = await pool.query(query, [JSON.stringify(data), sessionId]);
    return result.rows[0];
}

export async function logAudit(auditData: AuditData): Promise<any> {
    await ensureSchema();
    const query = `
        INSERT INTO skillkendra.kyc_audit_log (candidate_id, session_id, event, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    
    const values = [
        auditData.candidate_id || null,
        auditData.session_id || null,
        auditData.event,
        JSON.stringify(auditData.details || {}),
        auditData.ip_address || null,
        auditData.user_agent || null
    ];
    
    const result: QueryResult = await pool.query(query, values);
    return result.rows[0];
}

// Lazy initialization state
let schemaInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
    if (schemaInitialized) return;
    
    if (!initializationPromise) {
        initializationPromise = initializeDatabase().then(() => {
            schemaInitialized = true;
        }).catch(err => {
            console.error('Failed to initialize database schema:', err);
            initializationPromise = null;
            throw err;
        });
    }
    
    return initializationPromise;
}

export { pool };
