#!/bin/bash

# FEA Dashboard Backup Script
# Creates timestamped backups of database and uploaded files

set -e

# Configuration
APP_DIR="/opt/fea-dashboard"
DATA_DIR="$APP_DIR/data"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

echo "🔄 Creating backup for FEA Dashboard..."

# Backup database
if [ -f "$DATA_DIR/database.sqlite" ]; then
    echo "Backing up database..."
    cp "$DATA_DIR/database.sqlite" "$BACKUP_DIR/database_$DATE.sqlite"
    echo "✅ Database backed up to: database_$DATE.sqlite"
else
    echo "⚠️  Database file not found at $DATA_DIR/database.sqlite"
fi

# Backup uploaded files
if [ -d "$DATA_DIR/files" ]; then
    echo "Backing up uploaded files..."
    tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" -C "$DATA_DIR" files/
    echo "✅ Files backed up to: files_$DATE.tar.gz"
else
    echo "⚠️  Files directory not found at $DATA_DIR/files"
fi

# Backup configuration files
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" -C "$APP_DIR" .env package.json 2>/dev/null || echo "⚠️  Some config files may not exist"

# Clean up old backups (keep last 10)
echo "Cleaning up old backups..."
ls -t $BACKUP_DIR/database_*.sqlite 2>/dev/null | tail -n +11 | xargs rm -f || true
ls -t $BACKUP_DIR/files_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f || true
ls -t $BACKUP_DIR/config_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f || true

# Show backup summary
echo ""
echo "📊 Backup Summary:"
echo "Backup created: $DATE"
echo "Location: $BACKUP_DIR"
echo ""
ls -lh $BACKUP_DIR/*$DATE* 2>/dev/null || echo "No backup files created"

echo ""
echo "✅ Backup completed successfully!" 