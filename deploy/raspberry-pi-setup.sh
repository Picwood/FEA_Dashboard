#!/bin/bash

# FEA Dashboard Raspberry Pi Deployment Script
# Run this script on your Raspberry Pi after transferring the application

set -e

echo "🚀 Setting up FEA Dashboard on Raspberry Pi..."

# Create application user if it doesn't exist
if ! id "feadash" &>/dev/null; then
    echo "Creating feadash user..."
    sudo useradd -m -s /bin/bash feadash
    sudo usermod -aG sudo feadash
fi

# Set up application directory
APP_DIR="/opt/fea-dashboard"
DATA_DIR="$APP_DIR/data"
LOG_DIR="/var/log/fea-dashboard"

echo "Setting up directories..."
sudo mkdir -p $APP_DIR
sudo mkdir -p $DATA_DIR
sudo mkdir -p $DATA_DIR/files
sudo mkdir -p $LOG_DIR

# Set proper permissions
sudo chown -R feadash:feadash $APP_DIR
sudo chown -R feadash:feadash $LOG_DIR
sudo chmod -R 755 $APP_DIR
sudo chmod -R 755 $LOG_DIR

# Install dependencies
echo "Installing Node.js dependencies..."
cd $APP_DIR
sudo -u feadash npm install

# Build the application
echo "Building application..."
sudo -u feadash npm run build

# Create environment file
echo "Creating environment configuration..."
sudo -u feadash cat > $APP_DIR/.env << EOF
NODE_ENV=production
PORT=5000
DATA_DIR=/opt/fea-dashboard/data
LOG_LEVEL=info
EOF

echo "✅ Application setup complete!"
echo "Next steps:"
echo "1. Set up systemd service: sudo bash deploy/setup-service.sh"
echo "2. Configure firewall: sudo bash deploy/setup-firewall.sh"
echo "3. Start the service: sudo systemctl start fea-dashboard" 