-- HumanWriter AI - PostgreSQL Initialization Script
-- This script sets up the database with necessary extensions and initial configuration

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp for UUID generation (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create custom types (Prisma will also create these, but this ensures compatibility)
DO $$ 
BEGIN
    -- Role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "Role" AS ENUM ('GUEST', 'USER', 'ADMIN');
    END IF;
    
    -- Plan enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Plan') THEN
        CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
    END IF;
    
    -- Discipline enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Discipline') THEN
        CREATE TYPE "Discipline" AS ENUM ('INGENIERIA', 'CIENCIAS_SOCIALES', 'EXACTAS_NATURALES', 'AGRARIAS');
    END IF;
    
    -- GenerationStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GenerationStatus') THEN
        CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
    END IF;
    
    -- FineTuningStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FineTuningStatus') THEN
        CREATE TYPE "FineTuningStatus" AS ENUM ('PENDING', 'PREPARING', 'TRAINING', 'COMPLETED', 'FAILED', 'CANCELLED');
    END IF;
    
    -- GapStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GapStatus') THEN
        CREATE TYPE "GapStatus" AS ENUM ('IDENTIFIED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');
    END IF;
END$$;

-- Create function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant necessary permissions (adjust role name as needed)
GRANT ALL PRIVILEGES ON DATABASE humanwriter_db TO humanwriter;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO humanwriter;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO humanwriter;

-- Create indexes for performance (Prisma will create most, but these are extras)
-- These will be created after Prisma migrations run

-- Set up connection pooling settings
ALTER DATABASE humanwriter_db SET max_connections = 100;

-- Configure for better performance
ALTER DATABASE humanwriter_db SET shared_buffers = '256MB';
ALTER DATABASE humanwriter_db SET effective_cache_size = '1GB';
ALTER DATABASE humanwriter_db SET maintenance_work_mem = '128MB';
ALTER DATABASE humanwriter_db SET checkpoint_completion_target = 0.9;
ALTER DATABASE humanwriter_db SET wal_buffers = '16MB';
ALTER DATABASE humanwriter_db SET default_statistics_target = 100;
ALTER DATABASE humanwriter_db SET random_page_cost = 1.1;
ALTER DATABASE humanwriter_db SET effective_io_concurrency = 200;

-- Log configuration
ALTER DATABASE humanwriter_db SET log_statement = 'mod';
ALTER DATABASE humanwriter_db SET log_duration = on;
ALTER DATABASE humanwriter_db SET log_min_duration_statement = 1000;

-- Create schema for future use (e.g., analytics, archives)
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS archives;

GRANT ALL PRIVILEGES ON SCHEMA analytics TO humanwriter;
GRANT ALL PRIVILEGES ON SCHEMA archives TO humanwriter;

-- Initialize completion message
DO $$
BEGIN
    RAISE NOTICE 'HumanWriter AI database initialized successfully';
END$$;
