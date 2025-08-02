#!/bin/bash
set -e

# Create additional databases if needed
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions for better functionality
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    
    -- Create indexes for better performance
    -- These will be created by TypeORM migrations, but having them here as backup
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    
    -- Create a read-only user for pgAdmin if needed
    CREATE USER pgadmin_readonly WITH PASSWORD 'readonly_password';
    GRANT CONNECT ON DATABASE $POSTGRES_DB TO pgadmin_readonly;
    GRANT USAGE ON SCHEMA public TO pgadmin_readonly;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO pgadmin_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO pgadmin_readonly;
EOSQL

echo "PostgreSQL initialization completed successfully!"
echo "Database: $POSTGRES_DB"
echo "User: $POSTGRES_USER"
echo "Extensions installed: uuid-ossp, pg_trgm, btree_gin, pg_stat_statements"
