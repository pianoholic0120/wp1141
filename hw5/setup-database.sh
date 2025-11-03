#!/bin/bash

echo "🚀 Setting up Vector Database..."
echo ""

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running"
    echo ""
    echo "Please start PostgreSQL using one of these methods:"
    echo ""
    echo "Option 1 (Recommended):"
    echo "  brew services start postgresql@14"
    echo ""
    echo "Option 2:"
    echo "  pg_ctl -D /opt/homebrew/var/postgresql@14 start"
    echo ""
    echo "After starting, run this script again."
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Get database name
DB_NAME="vector"
DB_USER="${USER}"

echo "Creating database: $DB_NAME"
echo ""

# Create database if it doesn't exist
psql -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    echo "✅ Database '$DB_NAME' created successfully"
    echo ""
    echo "Database connection string:"
    echo "postgresql://$DB_USER@localhost:5432/$DB_NAME?schema=public"
    echo ""
    echo "Update your .env.local with:"
    echo "DATABASE_URL=\"postgresql://$DB_USER@localhost:5432/$DB_NAME?schema=public\""
else
    echo "❌ Failed to create database. Please check PostgreSQL connection."
    echo ""
    echo "You might need to set a password for PostgreSQL user, or use:"
    echo "  psql postgres"
    echo "  CREATE DATABASE vector;"
    exit 1
fi

