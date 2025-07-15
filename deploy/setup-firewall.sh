#!/bin/bash

# Configure firewall for FEA Dashboard

set -e

echo "🔥 Configuring firewall for FEA Dashboard..."

# Install ufw if not present
if ! command -v ufw &> /dev/null; then
    echo "Installing UFW firewall..."
    sudo apt update
    sudo apt install -y ufw
fi

# Configure UFW
echo "Setting up firewall rules..."

# Reset to defaults
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if you use non-standard)
sudo ufw allow 22/tcp comment 'SSH'

# Allow FEA Dashboard on port 5000
sudo ufw allow 5000/tcp comment 'FEA Dashboard'

# Allow local network access (adjust to your network range)
# Common local network ranges:
# 192.168.1.0/24, 192.168.0.0/24, 10.0.0.0/24
echo "Enter your local network range (e.g., 192.168.1.0/24):"
read -p "Network range: " NETWORK_RANGE

if [[ -n "$NETWORK_RANGE" ]]; then
    sudo ufw allow from $NETWORK_RANGE to any port 5000 comment 'Local network access'
    echo "Added rule for local network: $NETWORK_RANGE"
fi

# Enable firewall
echo "Enabling firewall..."
sudo ufw --force enable

echo "✅ Firewall configured!"
echo ""
echo "Firewall status:"
sudo ufw status verbose

echo ""
echo "⚠️  Important: Make sure you can still access SSH before closing this session!"
echo "Your FEA Dashboard will be accessible at:"
echo "  http://YOUR_PI_IP:5000" 